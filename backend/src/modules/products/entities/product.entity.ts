import { Entity, Column, Index, ManyToOne, OneToMany } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { BaseModel } from '@database/base.model';
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
  @Column({ default: '' })
  title: string;

  @Column({ default: '' })
  name: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index({ unique: true })
  @Column({ nullable: true })
  slug: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceETB: number;

  @Column({ nullable: true })
  formattedPriceETB: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  galleryImages: string[];

  @Column({ nullable: true })
  categoryName: string;

  @Column({ default: false })
  isNew: boolean;

  @Column({ nullable: true })
  tag: string;

  @Column({ type: 'jsonb', nullable: true })
  colors: Array<{
    name: string;
    hex: string;
    image?: string;
    galleryImages?: string[];
    active?: boolean;
  }>;

  @Column({ type: 'int', default: 0 })
  activeColorIndex: number;

  @Column({ nullable: true })
  activeColorName: string;

  @Column({ type: 'simple-array', nullable: true })
  sizes: string[];

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'jsonb', nullable: true })
  details: {
    overview?: string;
    measurements?: string[];
    fabric?: string;
    care?: string;
  };

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

  @Column({ default: 'YeHagere' })
  brand: string;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
  })
  category: Category;

  @OneToMany(() => ProductVariant, (productVariant) => productVariant.product, {
    cascade: true,
  })
  productVariants: ProductVariant[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.product)
  wishlist: Wishlist[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];
}
