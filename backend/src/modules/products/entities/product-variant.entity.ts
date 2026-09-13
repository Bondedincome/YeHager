import { Entity, Column, ManyToOne, Index, OneToMany } from 'typeorm';
import { BaseModel } from '@database/base.model';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { InventoryLog } from '../../inventory-logs/entities/inventory-log.entity';

@Entity()
export class ProductVariant extends BaseModel {
  @Index({ unique: true })
  @Column()
  sku: string;

  @Column()
  color: string;

  @Column()
  size: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  price: number;

  @Column({
    type: 'int',
    default: 0,
  })
  stock: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  weight: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Product, (product) => product.productVariants, {
    nullable: false,
  })
  product: Product;

  @OneToMany(() => ProductImage, (productImage) => productImage.productVariant)
  productImages: ProductImage[];

  @OneToMany(() => CartItem, (items) => items.productVariant)
  cartItems: CartItem[];

  @OneToMany(() => InventoryLog, (log) => log.productVariant)
  inventoryLogs: InventoryLog[];

  @OneToMany(() => OrderItem, (item) => item.productVariant)
  items: OrderItem[];
}
