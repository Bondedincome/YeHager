import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductImageDto {
  @ApiProperty({
    example:
      'https://res.cloudinary.com/yehagere/image/upload/v1/products/hoodie-black-front.jpg',
    description: 'Public URL of the product image',
  })
  @IsString()
  @IsUrl()
  @MaxLength(500)
  imageUrl: string;

  @ApiProperty({
    example: true,
    description: 'Whether this is the primary image for the product variant',
    default: false,
  })
  @IsBoolean()
  isPrimary: boolean;

  @ApiProperty({
    example: 1,
    description: 'Display order of the image',
    default: 0,
  })
  @IsInt()
  @Min(0)
  sortOrder: number;
}
