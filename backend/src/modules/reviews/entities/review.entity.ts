import { BaseModel } from '@database/base.model';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity()
@Unique(['user', 'product'])
export class Review extends BaseModel {
  @Column({
    type: 'int',
  })
  rating: number;

  @Column({
    type: 'text',
  })
  comment: string;

  @ManyToOne(() => User, (user) => user.reviews, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Product, (product) => product.reviews, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  product: Product;
}
