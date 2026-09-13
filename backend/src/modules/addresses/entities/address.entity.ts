import { BaseModel } from '@database/base.model';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity()
export class Address extends BaseModel {
  @Column()
  city: string;

  @Column()
  subCity: string;

  @Column()
  country: string;

  @Column()
  street: string;

  @Column()
  phone: string;

  @Column({
    default: false,
  })
  isDefault: boolean;

  @Column({
    nullable: true,
  })
  label?: string;

  @ManyToOne(() => User, (user) => user.addresses, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @OneToMany(() => Order, (order) => order.address)
  orders: Order[];
}
