import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty({
    example: 'HD-BLK-M',
    description: 'Unique Stock Keeping Unit (SKU)',
  })
  @IsString()
  @MaxLength(50)
  sku: string;

  @ApiProperty({
    example: 'Black',
    description: 'Product color',
  })
  @IsString()
  @MaxLength(50)
  color: string;

  @ApiProperty({
    example: 'M',
    description: 'Product size',
  })
  @IsString()
  @MaxLength(20)
  size: string;

  @ApiProperty({
    example: 49.99,
    description: 'Selling price',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Available stock quantity',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    example: 0.75,
    description: 'Weight in kilograms',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  weight?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this variant is available for sale',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
