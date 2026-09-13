import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateWishlistDto {
  @ApiProperty({
    example: '7b9b9c82-0d83-4f34-94d0-91fd14dd2d77',
    description: 'ID of the product to add to the wishlist',
  })
  @IsUUID()
  productId: string;
}
