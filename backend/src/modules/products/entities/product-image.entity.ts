import { BaseModel } from '@database/base.model';
import { Entity, Column, ManyToOne } from 'typeorm';
import { ProductVariant } from './product-variant.entity';

@Entity()
export class ProductImage extends BaseModel {
  @Column()
  imageUrl: string;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(
    () => ProductVariant,
    (productVariant) => productVariant.productImages,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  productVariant: ProductVariant;
}
