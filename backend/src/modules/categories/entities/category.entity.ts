import { BaseModel } from '@database/base.model';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity()
export class Category extends BaseModel {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index({ unique: true })
  @Column()
  slug: string;

  @Column({ nullable: true })
  image: string;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
