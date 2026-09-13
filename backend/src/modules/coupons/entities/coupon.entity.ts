import { BaseModel } from '@database/base.model';
import { Column, Entity, Index } from 'typeorm';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

@Entity()
export class Coupon extends BaseModel {
  @Index({ unique: true })
  @Column()
  code: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
  })
  discountType: DiscountType;

  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  discountValue: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  minimumPurchase: number;

  @Column({
    type: 'timestamp',
  })
  expiresAt: Date;

  @Column({
    type: 'int',
  })
  usageLimit: number;

  @Column({
    type: 'int',
    default: 0,
  })
  usageCount: number;

  @Column({
    default: true,
  })
  isActive: boolean;
}
