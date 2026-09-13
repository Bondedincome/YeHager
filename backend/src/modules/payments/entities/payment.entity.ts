import { BaseModel } from '@database/base.model';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

export enum PaymentProvider {
  CHAPA = 'CHAPA',
  TELEBIRR = 'TELEBIRR',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity()
export class Payment extends BaseModel {
  @Column({
    type: 'enum',
    enum: PaymentProvider,
  })
  provider: PaymentProvider;

  @Column({
    nullable: true,
    unique: true,
  })
  transactionId: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  paidAt: Date;

  @ManyToOne(() => Order, (order) => order.payments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  order: Order;
}
