import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { Role } from '../users/entities/user.entity';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(@Body() dto: any, @Req() req: any) {
    // If authenticated, automatically bind user ID to the order
    if (req.user?.id) {
      dto.userId = req.user.id;
    }
    return this.ordersService.create(dto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Query('userId') queryUserId?: string,
    @Query('orderNumber') orderNumber?: string,
    @Query('email') email?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req?: any,
  ) {
    // 1. Guest order tracking look-up with both orderNumber and matching email
    if (orderNumber && email) {
      return this.ordersService.findByNumberAndEmail(orderNumber, email);
    }

    const user = req?.user;

    // 2. Unauthenticated caller trying to list orders without guest verification
    if (!user) {
      throw new UnauthorizedException(
        'Authentication required: Please sign in or provide order number and email for guest tracking',
      );
    }

    const userRole = String(user.role || '').toLowerCase();
    const isAdmin = userRole === 'admin';

    // 3. Admin user can view all orders or filter by arbitrary userId
    if (isAdmin) {
      if (queryUserId) {
        return this.ordersService.findByUser(queryUserId);
      }
      return this.ordersService.findAll();
    }

    // 4. Patron users can ONLY view their own orders
    return this.ordersService.findByUser(user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findOne(@Param('id') id: string, @Query('email') guestEmail: string, @Req() req: any) {
    const order = await this.ordersService.findOne(id);
    const user = req?.user;
    const userRole = String(user?.role || '').toLowerCase();
    const isAdmin = userRole === 'admin';

    // Admin can view any order
    if (isAdmin) {
      return order;
    }

    // Authenticated patron owner can view their own order
    if (
      user &&
      ((order.userId && order.userId === user.id) ||
        (order.customerEmail &&
          order.customerEmail.toLowerCase() === String(user.email || '').toLowerCase()))
    ) {
      return order;
    }

    // Guest checkout tracking with verified email
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(@Param('id') id: string, @Body() dto: any) {
    return this.ordersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
