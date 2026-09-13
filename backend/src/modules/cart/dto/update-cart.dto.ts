import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCartDto {
  @ApiProperty({
    example: 3,
    description: 'New quantity of the cart item',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
