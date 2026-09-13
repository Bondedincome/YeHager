import { BaseModel } from '@database/base.model';
import { Entity, ManyToOne, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity()
@Unique(['user', 'product'])
export class Wishlist extends BaseModel {
  @ManyToOne(() => User, (user) => user.wishlist, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Product, (product) => product.wishlist, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  product: Product;
}
