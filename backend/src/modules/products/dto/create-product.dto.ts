import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { STATUS, GENDER } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty({
    description: 'The name of the product',
    example: 'Classic Hoodie',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ description: 'Optional storefront title' })
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({
    description: 'Detailed summary of the product',
    example: 'Premium heavyweight cotton hoodie with a brushed interior.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly unique identifier slug',
    example: 'classic-hoodie',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Target gender/demographic for the product',
    example: GENDER.UNISEX,
  })
  @IsOptional()
  @IsEnum(GENDER)
  gender?: GENDER;

  @ApiPropertyOptional({
    description: 'Publication or inventory status of the product',
    example: STATUS.ACTIVE,
  })
  @IsOptional()
  @IsEnum(STATUS)
  status?: STATUS;

  @ApiPropertyOptional({
    description: 'Brand or manufacturer name',
    example: 'Acme Apparel',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceETB?: number;

  @IsOptional()
  @IsString()
  formattedPriceETB?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  galleryImages?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsArray()
  colors?: Array<{ name: string; hex: string; image?: string; active?: boolean }>;

  @IsOptional()
  @IsInt()
  @Min(0)
  activeColorIndex?: number;

  @IsOptional()
  @IsString()
  activeColorName?: string;

  @IsOptional()
  @IsArray()
  sizes?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsObject()
  details?: {
    overview?: string;
    measurements?: string[];
    fabric?: string;
    care?: string;
  };
}
