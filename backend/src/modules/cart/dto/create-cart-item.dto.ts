import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateCartItemDto {
  @ApiProperty({
    example: 'c7f73f58-7fb9-4b86-8d5d-0a8d6a4b4c5e',
    description: 'ID of the product variant to add to the cart',
  })
  @IsUUID()
  productVariantId: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity of the product variant',
    minimum: 1,
    default: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
