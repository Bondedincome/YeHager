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

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post('checkout-session')
  @OptionalAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createCheckoutSession(@Body() dto: any, @Req() req: any) {
    return this.ordersService.createCheckoutSession(dto, req.user?.id);
  }

  @Get('checkout-session/:sessionId')
  @Public()
  getCheckoutOrder(@Param('sessionId') sessionId: string) {
    return this.ordersService.getPaidCheckoutOrder(sessionId);
  }

  @Post('stripe-webhook')
  @Public()
  @HttpCode(200)
  async stripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!request.rawBody || !signature) {
      throw new UnauthorizedException('Missing Stripe webhook signature');
    }
    const event = this.ordersService.constructStripeEvent(request.rawBody, signature);
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      await this.ordersService.fulfillStripeSession(event.data.object);
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
