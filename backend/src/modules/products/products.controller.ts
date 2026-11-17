import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { Role } from '../users/entities/user.entity';

type MaybeAuthed = { user?: { role?: string } | null };

const isAdmin = (req?: MaybeAuthed) => String(req?.user?.role || '').toLowerCase() === Role.ADMIN;

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  /** Public catalogue. Unit cost is only included when an admin is signed in. */
  @Public()
  @Get()
  async findAll(@Req() req: MaybeAuthed) {
    const products = await this.productsService.findAll();
    const admin = isAdmin(req);
    return products.map((product) => this.toApiProduct(product, admin));
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: MaybeAuthed) {
    return this.toApiProduct(await this.productsService.findOne(id), isAdmin(req));
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateProductDto) {
    return this.toApiProduct(await this.productsService.create(dto), true);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.toApiProduct(await this.productsService.update(id, dto), true);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  private toApiProduct(product: Product, includeCost: boolean) {
    const { category, costPrice, ...data } = product;
    return {
      ...data,
      ...(includeCost ? { costPrice: costPrice === null || costPrice === undefined ? null : Number(costPrice) } : {}),
      category: product.categoryName || category?.slug || '',
    };
  }
}
