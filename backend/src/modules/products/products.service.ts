import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { GENDER, Product, STATUS } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
  ) { }

  findAll(): Promise<Product[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      relations: { category: true, productVariants: true },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.repo.findOne({
      where: [{ id }, { slug: id }],
      relations: { category: true, productVariants: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  create(dto: CreateProductDto | any): Promise<Product> {
    const title = dto.title || dto.name || 'Untitled';
    const { category, ...productData } = dto;
    const slug =
      dto.slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const product = this.repo.create({
      ...productData,
      title,
      name: title,
      slug,
      categoryName: category ?? dto.categoryName,
      gender: dto.gender ?? GENDER.UNISEX,
      status: dto.status ?? STATUS.ACTIVE,
      brand: dto.brand ?? 'YeHagere',
    } as Product);

    return this.repo.save(product);
  }

  async update(id: string, dto: Partial<CreateProductDto> | any): Promise<Product> {
    const product = await this.findOne(id);
    const { category, ...productData } = dto;
    Object.assign(product, productData);
    if (category !== undefined) product.categoryName = category;
    if (dto.title && !dto.name) {
      product.name = dto.title;
    }
    return this.repo.save(product);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const product = await this.findOne(id);
    await this.repo.softRemove(product);
    return { success: true, message: `Product ${id} removed successfully` };
  }
}
