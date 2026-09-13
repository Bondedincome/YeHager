import { BaseModel } from '@database/base.model';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Cart } from './cart.entity';
import { Entity, Column, ManyToOne, Unique } from 'typeorm';

@Entity()
@Unique(['cart', 'productVariant'])
export class CartItem extends BaseModel {
  @ManyToOne(() => Cart, (cart) => cart.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  cart: Cart;

  @ManyToOne(() => ProductVariant, (variant) => variant.cartItems, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  productVariant: ProductVariant;

  @Column({
    type: 'int',
    default: 1,
  })
  quantity: number;
}
