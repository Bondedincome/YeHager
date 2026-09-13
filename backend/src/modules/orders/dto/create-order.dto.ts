import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: 'db9d50ab-04d0-4720-bfc5-60898e8d6793',
    description: 'Shipping address ID',
  })
  @IsUUID()
  addressId: string;
}
