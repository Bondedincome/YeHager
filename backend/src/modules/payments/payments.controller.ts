import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(@Body() createPaymentDto: CreatePaymentDto, @Req() req: any) {
    const userId = req.user.id;
    return this.paymentsService.create(userId, createPaymentDto);
  }

  @Get()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findAll(@Req() req: any, @Query('userId') queryUserId?: string) {
    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    if (isAdmin) {
      if (queryUserId) {
        return this.paymentsService.findAll(queryUserId);
      }
      return this.paymentsService.findAll();
    }
    // Patrons can only view their own payment histories
    return this.paymentsService.findAll(req.user.id);
  }

  @Get(':id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findOne(@Param('id') id: string, @Req() req: any) {
    const payment = await this.paymentsService.findOne(id);
    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    const ownerId =
      payment.userId ||
      payment.user?.id ||
      payment.order?.userId ||
      payment.order?.user?.id;

    if (!isAdmin && ownerId !== req.user.id) {
      throw new ForbiddenException('Access denied: You do not have permission to view this payment');
    }

    return payment;
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}
