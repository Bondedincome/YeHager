import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly inMemoryPayments = new Map<string, any>();

  constructor(
    @Optional()
    @InjectRepository(Payment)
    private readonly repo?: Repository<Payment>,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(userId: string, createPaymentDto: CreatePaymentDto & any) {
    if (this.repo) {
      const payment = this.repo.create({
        ...createPaymentDto,
        status: PaymentStatus.PENDING,
      });
      return this.repo.save(payment);
    }

    const id = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payment = {
      id,
      userId,
      ...createPaymentDto,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inMemoryPayments.set(id, payment);
    return payment;
  }

  async findAll(userId?: string) {
    if (this.repo) {
      if (userId) {
        return this.repo.find({
          where: { order: { user: { id: userId } } },
          relations: { order: { user: true } },
        });
      }
      return this.repo.find({ relations: { order: { user: true } } });
    }

    const all = Array.from(this.inMemoryPayments.values());
    if (userId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return all.filter((p: any) => p.userId === userId || p.order?.userId === userId);
    }
    return all;
  }

  async findOne(id: string) {
    if (this.repo) {
      return this.repo.findOne({
        where: { id },
        relations: { order: { user: true } },
      });
    }
    return this.inMemoryPayments.get(id);
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    if (this.repo) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.repo.update(id, updatePaymentDto as any);
      return this.findOne(id);
    }
    const existing = this.inMemoryPayments.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updatePaymentDto, updatedAt: new Date() };
    this.inMemoryPayments.set(id, updated);
    return updated;
  }

  async remove(id: string) {
    if (this.repo) {
      const result = await this.repo.delete(id);
      return { deleted: (result.affected ?? 0) > 0 };
    }
    const existed = this.inMemoryPayments.delete(id);
    return { deleted: existed };
  }
}
