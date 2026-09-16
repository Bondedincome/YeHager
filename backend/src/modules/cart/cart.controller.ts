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
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(@Body() createCartDto: CreateCartDto, @Req() req: any) {
    const userId = req.user.id;
    return this.cartService.create(userId, createCartDto);
  }

  @Get()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findAll(@Req() req: any, @Query('userId') queryUserId?: string) {
    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    if (isAdmin) {
      if (queryUserId) {
        return this.cartService.findAll(queryUserId);
      }
      return this.cartService.findAll();
    }
    // Patrons can only list their own carts
    return this.cartService.findAll(req.user.id);
  }

  @Get(':id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findOne(@Param('id') id: string, @Req() req: any) {
    const cart = await this.cartService.findOne(id);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    const ownerId = cart.user?.id || cart.userId;

    if (!isAdmin && ownerId !== req.user.id) {
      throw new ForbiddenException('Access denied: You do not have permission to view this cart');
    }

    return cart;
  }

  @Patch(':id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto, @Req() req: any) {
    const cart = await this.cartService.findOne(id);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    const ownerId = cart.user?.id || cart.userId;

    if (!isAdmin && ownerId !== req.user.id) {
      throw new ForbiddenException('Access denied: You do not have permission to modify this cart');
    }

    return this.cartService.update(id, updateCartDto);
  }

  @Delete(':id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async remove(@Param('id') id: string, @Req() req: any) {
    const cart = await this.cartService.findOne(id);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    const ownerId = cart.user?.id || cart.userId;

    if (!isAdmin && ownerId !== req.user.id) {
      throw new ForbiddenException('Access denied: You do not have permission to delete this cart');
    }

    return this.cartService.remove(id);
  }
}
