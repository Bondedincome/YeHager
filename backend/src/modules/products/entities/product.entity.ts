import { Entity, Column, Index, ManyToOne, OneToMany } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { BaseModel } from '@root/src/database/base.model';
import { ProductVariant } from './product-variant.entity';
import { Wishlist } from '../../wishlist/entities/wishlist.entity';
import { Review } from '../../reviews/entities/review.entity';

export enum GENDER {
  MEN = 'MEN',
  WOMEN = 'WOMEN',
  UNISEX = 'UNISEX',
}

export enum STATUS {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Entity()
export class Product extends BaseModel {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index({ unique: true })
  @Column()
  slug: string;

  @Column({
    type: 'enum',
    enum: GENDER,
    default: GENDER.UNISEX,
  })
  gender: GENDER;

  @Column({
    type: 'enum',
    enum: STATUS,
    default: STATUS.ACTIVE,
  })
  status: STATUS;

  @Column()
  brand: string;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
  })
  category: Category;

  @OneToMany(() => ProductVariant, (productVariant) => productVariant.product)
  productVariants: ProductVariant[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.product)
  wishlist: Wishlist[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];
}
