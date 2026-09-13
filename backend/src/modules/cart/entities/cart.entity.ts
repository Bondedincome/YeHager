import { Entity, ManyToOne, Column, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BaseModel } from '@database/base.model';
import { CartItem } from './cart-item.entity';

export enum CartStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

@Entity()
export class Cart extends BaseModel {
  @ManyToOne(() => User, (user) => user.carts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({
    type: 'enum',
    enum: CartStatus,
    default: CartStatus.ACTIVE,
  })
  status: CartStatus;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  total: number;

  @OneToMany(() => CartItem, (item) => item.cart)
  items: CartItem[];
}
