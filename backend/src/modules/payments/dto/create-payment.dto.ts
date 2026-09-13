import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PaymentProvider } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({
    enum: PaymentProvider,
    example: PaymentProvider.CHAPA,
    description: 'Selected payment provider',
  })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;
}
