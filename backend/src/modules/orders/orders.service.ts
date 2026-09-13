import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

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

    return this.orderRepo.save(order);
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
