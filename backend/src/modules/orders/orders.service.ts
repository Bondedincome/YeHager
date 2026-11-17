import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { In, Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { Product, STATUS } from '../products/entities/product.entity';
import {
  Payment,
  PaymentProvider,
  PaymentStatus as ChargeStatus,
} from '../payments/entities/payment.entity';
import { ChapaService } from './chapa.service';

/** Fallback USD→ETB rate for products without an ETB price. */
const ETB_PER_USD = 125;
/** Orders above this subtotal (USD) ship free; otherwise SHIPPING_USD is added. */
const FREE_SHIPPING_OVER_USD = 200;
const SHIPPING_USD = 25;

/** A product's unit cost as a number, or null when it hasn't been entered. */
const unitCost = (product: Pick<Product, 'costPrice'>): number | null =>
  product.costPrice === null || product.costPrice === undefined ? null : Number(product.costPrice);

const priceETB = (product: Pick<Product, 'price' | 'priceETB'>) =>
  Number(product.priceETB) > 0 ? Number(product.priceETB) : Number(product.price) * ETB_PER_USD;

const money = (n: number) => Math.round(n * 100) / 100;

/** Product ids are UUIDs; anything else (old numeric ids) can't be looked up. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CheckoutRequest = {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: {
    street: string;
    city: string;
    postalCode?: string;
    country: string;
  };
  items: Array<{ productId: string; quantity: number; size?: string; color?: string }>;
};

export type CheckoutStatus = {
  paid: boolean;
  status: 'paid' | 'pending' | 'failed';
  orderNumber: string;
  total: number;
  totalETB: number;
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    private readonly configService: ConfigService,
    private readonly chapa: ChapaService,
  ) {}

  /**
   * Creates a pending order priced from the database (never from the browser)
   * and returns a Chapa hosted-checkout link. Customers are charged in ETB.
   */
  async createCheckout(dto: CheckoutRequest, userId?: string) {
    const name = dto.customerName?.trim() ?? '';
    const email = dto.customerEmail?.trim().toLowerCase() ?? '';
    const validEmail = email.length <= 254 && /^[^\s@]+@[^\s@]+$/.test(email) && email.split('@')[1].includes('.');
    if (!name || !validEmail || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('Your name, a valid email and at least one product are required');
    }
    if (dto.items.length > 50) throw new BadRequestException('Too many items in one order');
    if (!dto.shippingAddress?.street?.trim() || !dto.shippingAddress?.city?.trim() || !dto.shippingAddress?.country?.trim()) {
      throw new BadRequestException('A complete delivery address is required');
    }
    const phone = ChapaService.normalizePhone(dto.customerPhone);
    if (dto.customerPhone?.trim() && !phone) {
      throw new BadRequestException('Phone number must be an Ethiopian mobile number like 0911234567');
    }

    const lines = await Promise.all(
      dto.items.map(async (line) => {
        const quantity = Number(line.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
          throw new BadRequestException('Each product quantity must be between 1 and 20');
        }
        if (!UUID_PATTERN.test(String(line.productId))) {
          throw new BadRequestException('Your bag contains an item that is no longer available. Please remove it.');
        }
        const product = await this.productRepo.findOneBy({ id: line.productId });
        const title = product?.title || product?.name || 'This item';
        if (!product || product.status !== STATUS.ACTIVE) {
          throw new NotFoundException(`${title} is no longer available`);
        }
        if (!(Number(product.price) > 0) && !(Number(product.priceETB) > 0)) {
          throw new BadRequestException(`${title} has no price yet`);
        }
        if (product.stock < quantity) {
          throw new BadRequestException(
            product.stock > 0 ? `Only ${product.stock} of ${title} left` : `${title} is out of stock`,
          );
        }
        const size = line.size?.trim();
        if (size && product.sizes?.length && !product.sizes.includes(size)) {
          throw new BadRequestException(`Size ${size} is not available for ${title}`);
        }
        const color = line.color?.trim();
        const colors = (product.colors || []).filter((c) => c.active !== false);
        if (color && colors.length && !colors.some((c) => c.name === color)) {
          throw new BadRequestException(`${color} is not available for ${title}`);
        }
        return { product, quantity, size, color };
      }),
    );

    const subtotal = money(lines.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0));
    const subtotalETB = money(lines.reduce((sum, l) => sum + priceETB(l.product) * l.quantity, 0));
    const shippingFee = subtotal > FREE_SHIPPING_OVER_USD ? 0 : SHIPPING_USD;
    const shippingETB = shippingFee * ETB_PER_USD;
    const total = money(subtotal + shippingFee);
    const totalETB = money(subtotalETB + shippingETB);

    const orderNumber = `YH-${Math.floor(100000 + Math.random() * 900000)}`;
    // Unique per attempt so a customer can retry a failed payment with a fresh reference.
    const txRef = `${orderNumber}-${randomBytes(4).toString('hex')}`;

    const order = await this.orderRepo.save(
      this.orderRepo.create({
        orderNumber,
        userId: userId || null,
        customerName: name,
        customerEmail: email,
        customerPhone: phone ?? null,
        subtotal,
        shippingFee,
        total,
        totalETB,
        paymentMethod: 'chapa',
        paymentStatus: PaymentStatus.PENDING,
        orderStatus: OrderStatus.PENDING,
        shippingAddress: dto.shippingAddress,
        itemsData: lines.map(({ product, quantity, size, color }) => ({
          id: product.id,
          title: product.title || product.name,
          price: Number(product.price),
          priceETB: priceETB(product),
          cost: unitCost(product),
          quantity,
          ...(size ? { size } : {}),
          ...(color || product.activeColorName ? { color: color || product.activeColorName } : {}),
          imageUrl: product.imageUrl,
        })),
      }),
    );

    const payment = await this.paymentRepo.save(
      this.paymentRepo.create({
        provider: PaymentProvider.CHAPA,
        transactionId: txRef,
        amount: totalETB,
        status: ChargeStatus.PENDING,
        orderId: order.id,
        order: { id: order.id } as Order,
        ...(userId ? { userId, user: { id: userId } as User } : {}),
      }),
    );

    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL')?.replace(/\/$/, '');
      if (!frontendUrl) throw new BadRequestException('FRONTEND_URL is not configured');
      const [firstName, ...rest] = name.split(/\s+/);
      const checkoutUrl = await this.chapa.initialize({
        amount: totalETB,
        currency: 'ETB',
        email,
        firstName,
        lastName: rest.join(' ') || firstName,
        phoneNumber: phone,
        txRef,
        returnUrl: `${frontendUrl}/cart?checkout=return&tx_ref=${encodeURIComponent(txRef)}`,
        title: 'YeHagere',
        description: `Order ${orderNumber}`,
      });
      return { checkoutUrl, orderNumber, txRef, totalETB };
    } catch (error) {
      // Nothing was charged; don't leave an abandoned order behind.
      await this.paymentRepo.softRemove(payment);
      await this.orderRepo.softRemove(order);
      throw error;
    }
  }

  /**
   * Looks up the payment with Chapa and, if it succeeded for the right amount,
   * marks the order paid. Safe to call many times (callback, webhook, return page).
   */
  async confirmChapaPayment(txRef: string): Promise<CheckoutStatus> {
    const payment = await this.paymentRepo.findOne({
      where: { transactionId: txRef, provider: PaymentProvider.CHAPA },
      relations: { order: true },
    });
    const order = payment?.order;
    if (!payment || !order) throw new NotFoundException('Payment not found');

    const result = (status: CheckoutStatus['status']): CheckoutStatus => ({
      paid: status === 'paid',
      status,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      totalETB: Number(order.totalETB),
    });

    if (payment.status === ChargeStatus.SUCCESS) return result('paid');

    const verification = await this.chapa.verify(txRef);
    if (!verification || verification.status === 'pending') return result('pending');
    if (verification.status !== 'success') {
      await this.paymentRepo.update({ id: payment.id, status: ChargeStatus.PENDING }, { status: ChargeStatus.FAILED });
      return result('failed');
    }

    const expected = Number(order.totalETB);
    if (verification.currency !== 'ETB' || verification.amount + 0.01 < expected) {
      this.logger.error(
        `Chapa amount mismatch for ${txRef}: got ${verification.amount} ${verification.currency}, expected ${expected} ETB`,
      );
      throw new BadRequestException('The amount paid does not match this order. Please contact us.');
    }

    // Only the first confirmation wins, so stock and customer totals change exactly once.
    const claimed = await this.paymentRepo.update(
      { id: payment.id, status: In([ChargeStatus.PENDING, ChargeStatus.FAILED]) },
      { status: ChargeStatus.SUCCESS, paidAt: new Date() },
    );
    if (claimed.affected) {
      await this.orderRepo.update(
        { id: order.id },
        { paymentStatus: PaymentStatus.PAID, orderStatus: OrderStatus.CONFIRMED },
      );
      for (const item of order.itemsData ?? []) {
        const id = String(item.id ?? '');
        const quantity = Number(item.quantity) || 0;
        if (!UUID_PATTERN.test(id) || quantity <= 0) continue;
        await this.productRepo
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => 'GREATEST("stock" - :quantity, 0)' })
          .where('id = :id', { id })
          .setParameter('quantity', Math.floor(quantity))
          .execute();
      }
      if (order.userId) {
        await this.userRepo.increment({ id: order.userId }, 'totalOrders', 1);
        await this.userRepo.increment({ id: order.userId }, 'totalSpentUSD', Number(order.total));
      }
    }
    return result('paid');
  }

  async create(dto: any): Promise<Order> {
    const orderNumber =
      dto.orderNumber ||
      `YH-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = this.orderRepo.create({
      orderNumber,
      userId: dto.userId || null,
      customerName: dto.customerName || '',
      customerEmail: dto.customerEmail || '',
      customerPhone: dto.customerPhone || null,
      subtotal: Number(dto.subtotal || dto.totalUSD || dto.total || 0),
      shippingFee: Number(dto.shippingFee || 0),
      tax: Number(dto.tax || 0),
      discount: Number(dto.discount || 0),
      total: Number(dto.total || dto.totalUSD || 0),
      totalETB: dto.totalETB ? Number(dto.totalETB) : null,
      paymentMethod: dto.paymentMethod || 'manual_boutique',
      paymentStatus: dto.paymentStatus || PaymentStatus.PAID,
      orderStatus: dto.orderStatus || OrderStatus.CONFIRMED,
      shippingAddress: dto.shippingAddress || null,
      itemsData: await this.withUnitCosts(dto.items || []),
      // Added by staff when the parcel is handed to a courier.
      trackingNumber: dto.trackingNumber || undefined,
      carrier: dto.carrier || undefined,
      notes: dto.notes || null,
    });

    const savedOrder = await this.orderRepo.save(order);
    if (dto.userId) {
      await this.userRepo.increment({ id: dto.userId }, 'totalOrders', 1);
      await this.userRepo.increment({ id: dto.userId }, 'totalSpentUSD', Number(savedOrder.total));
    }
    return savedOrder;
  }

  /** Copy each product's current unit cost onto the order lines (unless one was sent). */
  private async withUnitCosts(items: Order['itemsData']): Promise<Order['itemsData']> {
    if (!Array.isArray(items) || items.length === 0) return [];
    const ids = [
      ...new Set(
        items
          .map((item) => (item?.id === undefined || item?.id === null ? '' : String(item.id)))
          .filter((id) => UUID_PATTERN.test(id)),
      ),
    ];
    const products = ids.length ? await this.productRepo.findBy({ id: In(ids) }) : [];
    const costById = new Map(products.map((product) => [product.id, unitCost(product)]));
    return items.map((item) => ({
      ...item,
      cost: item.cost ?? costById.get(String(item.id)) ?? null,
    }));
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({
      order: { createdAt: 'DESC' },
      relations: { user: true },
    });
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: [{ id }, { orderNumber: id }],
      relations: { user: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async findByNumberAndEmail(orderNumber: string, email: string): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: {
        orderNumber,
        customerEmail: email,
      },
    });
  }

  async update(id: string, dto: any): Promise<Order> {
    const order = await this.findOne(id);
    Object.assign(order, dto);
    return this.orderRepo.save(order);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const order = await this.findOne(id);
    await this.orderRepo.softRemove(order);
    return { success: true };
  }
}
