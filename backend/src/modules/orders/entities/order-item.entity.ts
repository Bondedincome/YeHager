import { BaseModel } from '@database/base.model';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Order } from './order.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity()
export class OrderItem extends BaseModel {
  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  price: number;

  @Column({
    type: 'int',
  })
  quantity: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  subtotal: number;

  @ManyToOne(() => Order, (order) => order.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  order: Order;

  @ManyToOne(() => ProductVariant, (variant) => variant.items, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  productVariant: ProductVariant;
}
