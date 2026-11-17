import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import type { RawBodyRequest } from '@nestjs/common';
import { OptionalAuth, Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { OrdersService } from './orders.service';
import { ChapaService } from './chapa.service';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly chapa: ChapaService,
  ) { }

  /** Starts a Chapa payment. Works for guests and signed-in customers. */
  @Post('checkout')
  @OptionalAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createCheckout(@Body() dto: any, @Req() req: any) {
    return this.ordersService.createCheckout(dto, req.user?.id);
  }

  /** The cart page calls this after Chapa sends the customer back. */
  @Get('checkout/:txRef')
  @Public()
  checkoutStatus(@Param('txRef') txRef: string) {
    return this.ordersService.confirmChapaPayment(txRef);
  }

  /**
   * Chapa's callback_url (GET). The reference may arrive as trx_ref or tx_ref.
   * The payment is always re-checked with Chapa, so this can't be faked.
   */
  @Get('chapa/callback')
  @Public()
  async chapaCallback(@Query('trx_ref') trxRef?: string, @Query('tx_ref') txRef?: string) {
    const reference = trxRef || txRef;
    if (!reference) return { received: false };
    const status = await this.ordersService.confirmChapaPayment(reference).catch(() => null);
    return { received: true, status: status?.status ?? 'unknown' };
  }

  /** Chapa webhook (POST). Signature is checked when CHAPA_WEBHOOK_SECRET is set. */
  @Post('chapa/webhook')
  @Public()
  @HttpCode(200)
  async chapaWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Body() body: { tx_ref?: string; trx_ref?: string; event?: string },
    @Headers() headers: Record<string, unknown>,
  ) {
    if (!this.chapa.verifyWebhookSignature(request.rawBody, body, headers)) {
      throw new UnauthorizedException('Invalid Chapa signature');
    }
    const reference = body?.tx_ref || body?.trx_ref;
    if (reference && (!body.event || body.event.startsWith('charge.'))) {
      await this.ordersService.confirmChapaPayment(reference).catch(() => null);
    }
    return { received: true };
  }

  @Post()
  @Roles(Role.ADMIN)
  @OptionalAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(@Body() dto: any, @Req() req: any) {
    if (req.user?.id) dto.userId = req.user.id;
    else delete dto.userId;
    return this.ordersService.create(dto);
  }

  @Get()
  @OptionalAuth()
  findAll(
    @Query('userId') queryUserId?: string,
    @Query('orderNumber') orderNumber?: string,
    @Query('email') email?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req?: any,
  ) {
    if (orderNumber && email) {
      return this.ordersService.findByNumberAndEmail(orderNumber, email);
    }

    const user = req?.user;
    if (!user) {
      throw new UnauthorizedException(
        'Authentication required: Please sign in or provide order number and email for guest tracking',
      );
    }

    const isAdmin = String(user.role || '').toLowerCase() === 'admin';
    if (isAdmin) {
      return queryUserId
        ? this.ordersService.findByUser(queryUserId)
        : this.ordersService.findAll();
    }
    return this.ordersService.findByUser(user.id);
  }

  @Get(':id')
  @OptionalAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findOne(@Param('id') id: string, @Query('email') guestEmail: string, @Req() req: any) {
    const order = await this.ordersService.findOne(id);
    const user = req?.user;
    const isAdmin = String(user?.role || '').toLowerCase() === 'admin';

    if (isAdmin) return order;
    if (
      user &&
      ((order.userId && order.userId === user.id) ||
        (order.customerEmail &&
          order.customerEmail.toLowerCase() === String(user.email || '').toLowerCase()))
    ) {
      return order;
    }
    if (
      guestEmail &&
      order.customerEmail &&
      order.customerEmail.toLowerCase() === guestEmail.toLowerCase()
    ) {
      return order;
    }
    throw new ForbiddenException('Access denied: You do not have permission to view this order');
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(@Param('id') id: string, @Body() dto: any) {
    return this.ordersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
