import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { Role } from '../users/entities/user.entity';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Public()
  @Get()
  async findAll() {
    const products = await this.productsService.findAll();
    return products.map((product) => this.toApiProduct(product));
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.toApiProduct(await this.productsService.findOne(id));
  }

  @Post('seed')
  @Roles(Role.ADMIN)
  seed() {
    return this.productsService.seedCatalog();
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateProductDto) {
    return this.toApiProduct(await this.productsService.create(dto));
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.toApiProduct(await this.productsService.update(id, dto));
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  private toApiProduct(product: Product) {
    const { category, ...data } = product;
    return {
      ...data,
      category: product.categoryName || category?.slug || '',
    };
  }
}
