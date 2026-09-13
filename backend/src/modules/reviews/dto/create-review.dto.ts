import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    example: 5,
    description: 'Product rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: 'Excellent quality and fits perfectly!',
    description: 'Review comment',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  comment: string;
}
