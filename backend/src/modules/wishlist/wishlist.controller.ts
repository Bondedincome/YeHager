import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(AuthGuard('jwt'))
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) { }

  @Post()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(@Body() dto: CreateWishlistDto, @Req() req: any) {
    return this.wishlistService.add(req.user.id, dto.productId);
  }

  @Get()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findAll(@Req() req: any) {
    return this.wishlistService.findAll(req.user.id);
  }

  @Delete(':productId')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  remove(@Param('productId') productId: string, @Req() req: any) {
    return this.wishlistService.remove(req.user.id, productId);
  }
}
