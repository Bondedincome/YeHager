import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { STATUS, GENDER } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty({
    description: 'The name of the product',
    example: 'Classic Hoodie',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed summary of the product',
    example: 'Premium heavyweight cotton hoodie with a brushed interior.',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly unique identifier slug',
    example: 'classic-hoodie',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Target gender/demographic for the product',
    example: GENDER.UNISEX,
  })
  gender?: GENDER;

  @ApiPropertyOptional({
    description: 'Publication or inventory status of the product',
    example: STATUS.ACTIVE,
  })
  status?: STATUS;

  @ApiPropertyOptional({
    description: 'Brand or manufacturer name',
    example: 'Acme Apparel',
  })
  brand?: string;
}
