import {
  Controller,
  Get,
  Put,
  Body,
  Delete,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Get()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCart(@Req() req: any) {
    return this.cartService.getForUser(req.user.id);
  }

  @Put()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  replaceCart(@Body() dto: CreateCartDto, @Req() req: any) {
    return this.cartService.replaceForUser(req.user.id, dto.items);
  }

  @Delete()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearCart(@Req() req: any) {
    return this.cartService.clearForUser(req.user.id);
  }
}
