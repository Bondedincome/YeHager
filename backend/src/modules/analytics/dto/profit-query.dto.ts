import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { OrderStatus } from '../../orders/entities/order.entity';

export class ProfitQueryDto {
  @ApiPropertyOptional({
    description: 'Start of the period (ISO date-time, inclusive).',
    example: '2026-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    description: 'End of the period (ISO date-time, inclusive).',
    example: '2026-11-30T23:59:59.999Z',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({
    description: 'Only count items from this category (slug).',
    example: 'knitwear',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Only count this one product.' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({
    enum: OrderStatus,
    description:
      'Only count orders in this status. Cancelled orders are never counted.',
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description:
      "Viewer's timezone offset in minutes, as returned by JS Date#getTimezoneOffset (e.g. -180 for Addis Ababa). Used to group sales by local day.",
    example: -180,
  })
  @IsOptional()
  @IsInt()
  @Min(-840)
  @Max(840)
  tzOffset?: number;
}
