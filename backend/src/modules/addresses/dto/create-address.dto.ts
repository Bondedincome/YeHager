import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({
    example: 'Addis Ababa',
    description: 'City',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @ApiProperty({
    example: 'Bole',
    description: 'Sub-city',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  subCity: string;

  @ApiProperty({
    example: 'Ethiopia',
    description: 'Country',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country: string;

  @ApiProperty({
    example: 'Bole Road, House No. 123',
    description: 'Street address',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  street: string;

  @ApiProperty({
    example: '+251911223344',
    description: 'Recipient phone number',
  })
  @IsPhoneNumber()
  phone: string;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description: 'Set as the default shipping address',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: 'Home',
    description: 'Optional label such as Home, Office, etc.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;
}
