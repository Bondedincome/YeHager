import { BaseModel } from '@database/base.model';
import { Entity, Column, OneToMany, Index } from 'typeorm';
import { Cart } from '../../cart/entities/cart.entity';
import { Order } from '../../orders/entities/order.entity';
import { Address } from '../../addresses/entities/address.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Wishlist } from '../../wishlist/entities/wishlist.entity';

export enum Role {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  VIP = 'vip',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Entity()
export class User extends BaseModel {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ select: false, nullable: true })
  password: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ nullable: true })
  passwordSalt: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CUSTOMER,
  })
  role: Role;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'text', nullable: true })
  shippingAddress: string;

  @Column({ default: 0 })
  totalOrders: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalSpentUSD: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  memberSince: Date;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  requiresPasswordChange: boolean;

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.user)
  wishlist: Wishlist[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];
}
