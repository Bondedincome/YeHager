import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { Product, STATUS } from '../products/entities/product.entity';

type CheckoutRequest = {
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: Array<{ productId: string; quantity: number; size?: string; color?: string }>;
};

@Injectable()
export class OrdersService {
  private readonly stripe: Stripe | null;

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    private readonly configService: ConfigService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = secretKey ? new Stripe(secretKey) : null;
  }

  async createCheckoutSession(dto: CheckoutRequest, userId?: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe payments are not configured on the server');
    }
    if (!dto.customerName?.trim() || !dto.customerEmail?.trim() || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('Customer details and at least one product are required');
    }
    if (!dto.shippingAddress?.street?.trim() || !dto.shippingAddress?.city?.trim() || !dto.shippingAddress?.country?.trim()) {
      throw new BadRequestException('A complete shipping address is required');
    }

    const products = await Promise.all(dto.items.map(async (line) => {
      const quantity = Number(line.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        throw new BadRequestException('Each product quantity must be between 1 and 20');
      }
      const product = await this.productRepo.findOneBy({ id: line.productId });
      if (!product || product.status !== STATUS.ACTIVE) {
        throw new NotFoundException(`Product ${line.productId} is unavailable`);
      }
      if (product.stock < quantity) {
        throw new BadRequestException(`Only ${product.stock} units of ${product.title || product.name} are available`);
      }
      const size = line.size?.trim();
      if (size && product.sizes?.length && !product.sizes.includes(size)) {
        throw new BadRequestException(`Size ${size} is unavailable for ${product.title || product.name}`);
      }
      const selectedColor = line.color?.trim();
      const colors = (product.colors || []).filter((color) => color.active !== false);
      if (selectedColor && colors.length && !colors.some((color) => color.name === selectedColor)) {
        throw new BadRequestException(`Color ${selectedColor} is unavailable for ${product.title || product.name}`);
      }
      return { product, quantity, size, color: selectedColor };
    }));

    const subtotal = products.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);
    const shippingFee = subtotal > 200 ? 0 : 25;
    const total = Number((subtotal + shippingFee).toFixed(2));
    const orderNumber = `YH-${Math.floor(100000 + Math.random() * 900000)}`;
    const order = await this.orderRepo.save(this.orderRepo.create({
      orderNumber,
      userId: userId || null,
      customerName: dto.customerName.trim(),
      customerEmail: dto.customerEmail.trim().toLowerCase(),
      subtotal,
      shippingFee,
      total,
      totalETB: Number((total * 125).toFixed(2)),
      paymentMethod: 'stripe',
      paymentStatus: PaymentStatus.PENDING,
      orderStatus: OrderStatus.PENDING,
      shippingAddress: dto.shippingAddress,
      itemsData: products.map(({ product, quantity, size, color }) => ({
        id: product.id,
        title: product.title || product.name,
        price: Number(product.price),
        priceETB: Number(product.priceETB || Number(product.price) * 125),
        quantity,
        size: size || 'M',
        color: color || product.activeColorName || 'Standard',
        imageUrl: product.imageUrl,
      })),
    }));

    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL')?.replace(/\/$/, '');
      if (!frontendUrl) throw new BadRequestException('FRONTEND_URL is not configured');
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: order.customerEmail,
        line_items: [
          ...products.map(({ product, quantity }) => ({
            quantity,
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(Number(product.price) * 100),
              product_data: { name: product.title || product.name },
            },
          })),
          ...(shippingFee > 0 ? [{
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(shippingFee * 100),
              product_data: { name: 'Shipping' },
            },
          }] : []),
        ],
        metadata: { orderId: order.id },
        success_url: `${frontendUrl}/cart?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/cart?checkout=cancelled`,
      });
      return { checkoutUrl: session.url, orderNumber: order.orderNumber };
    } catch (error) {
      await this.orderRepo.softRemove(order);
      throw error;
    }
  }

  async fulfillStripeSession(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.orderId;
    if (!orderId || session.payment_status !== 'paid') return;
    const order = await this.orderRepo.findOneBy({ id: orderId });
    if (!order) throw new NotFoundException(`Order ${orderId} was not found`);
    if (session.currency !== 'usd' || session.amount_total !== Math.round(Number(order.total) * 100)) {
      throw new BadRequestException('Stripe amount does not match the order total');
    }

    const result = await this.orderRepo.update(
      { id: order.id, paymentStatus: PaymentStatus.PENDING },
      { paymentStatus: PaymentStatus.PAID, orderStatus: OrderStatus.CONFIRMED },
    );
    if (result.affected && order.userId) {
      await this.userRepo.increment({ id: order.userId }, 'totalOrders', 1);
      await this.userRepo.increment({ id: order.userId }, 'totalSpentUSD', Number(order.total));
    }
  }

  async getPaidCheckoutOrder(sessionId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe payments are not configured on the server');
    }
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId;
    if (!orderId || session.payment_status !== 'paid') {
      throw new BadRequestException('Payment has not been confirmed');
    }
    await this.fulfillStripeSession(session);
    const order = await this.orderRepo.findOneBy({ id: orderId });
    if (!order || order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Payment has not been confirmed');
    }
    return { orderNumber: order.orderNumber, total: Number(order.total), totalETB: Number(order.totalETB) };
  }

  constructStripeEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!this.stripe || !webhookSecret) {
      throw new BadRequestException('Stripe webhook is not configured');
    }
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
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
      paymentMethod: dto.paymentMethod || 'stripe',
      paymentStatus: dto.paymentStatus || PaymentStatus.PAID,
      orderStatus: dto.orderStatus || OrderStatus.CONFIRMED,
      shippingAddress: dto.shippingAddress || null,
      itemsData: dto.items || [],
      trackingNumber: dto.trackingNumber || `TRK-${Math.floor(1000000 + Math.random() * 9000000)}`,
      carrier: dto.carrier || 'DHL Express Heritage Courier',
      notes: dto.notes || null,
    });

    const savedOrder = await this.orderRepo.save(order);
    if (dto.userId) {
      await this.userRepo.increment({ id: dto.userId }, 'totalOrders', 1);
      await this.userRepo.increment({ id: dto.userId }, 'totalSpentUSD', Number(savedOrder.total));
    }
    return savedOrder;
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
