import { BaseModel } from '@database/base.model';
import { Column, Entity, ManyToOne } from 'typeorm';
import { ProductVariant } from '../../products/entities/product-variant.entity';

export enum InventoryReason {
  RESTOCK = 'RESTOCK',
  ORDER = 'ORDER',
  RETURN = 'RETURN',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
}

@Entity()
export class InventoryLog extends BaseModel {
  @Column({
    type: 'int',
  })
  previousStock: number;

  @Column({
    type: 'int',
  })
  newStock: number;

  @Column({
    type: 'enum',
    enum: InventoryReason,
  })
  reason: InventoryReason;

  @ManyToOne(() => ProductVariant, (variant) => variant.inventoryLogs, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  productVariant: ProductVariant;
}
