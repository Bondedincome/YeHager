import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: any) {
    return this.ordersService.create(dto);
  }

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('orderNumber') orderNumber?: string,
    @Query('email') email?: string,
  ) {
    if (orderNumber && email) {
      return this.ordersService.findByNumberAndEmail(orderNumber, email);
    }
    if (userId) {
      return this.ordersService.findByUser(userId);
    }
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.ordersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
