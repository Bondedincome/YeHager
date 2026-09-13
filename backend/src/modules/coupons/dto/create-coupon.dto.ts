import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { DiscountType } from '../entities/coupon.entity';

export class CreateCouponDto {
  @ApiProperty({
    example: 'SUMMER20',
    description: 'Unique coupon code',
  })
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/, {
    message:
      'Coupon code may only contain uppercase letters, numbers, hyphens and underscores.',
  })
  code: string;

  @ApiProperty({
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
    description: 'Type of discount',
  })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({
    example: 20,
    description:
      'Discount value. Percentage (0-100) or fixed amount depending on the discount type.',
  })
  @IsPositive()
  discountValue: number;

  @ApiProperty({
    example: 100,
    description: 'Minimum order amount required to use the coupon',
  })
  @IsPositive()
  minimumPurchase: number;

  @ApiProperty({
    example: '2026-12-31T23:59:59Z',
    description: 'Coupon expiration date',
  })
  @IsDateString()
  expiresAt: Date;

  @ApiProperty({
    example: 500,
    description: 'Maximum number of times this coupon can be used',
  })
  @IsInt()
  @Min(1)
  usageLimit: number;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Whether the coupon is active',
  })
  @IsBoolean()
  isActive?: boolean;
}
