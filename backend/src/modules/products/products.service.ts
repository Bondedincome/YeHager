import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { GENDER, Product, STATUS } from './entities/product.entity';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save([
        {
          name: 'Classic Tee',
          description: 'Comfortable cotton t-shirt',
          slug: 'classic-tee',
          gender: GENDER.MEN,
          status: STATUS.ACTIVE,
          brand: 'Yehagere',
        } as Product,
        {
          name: 'Denim Jacket',
          description: 'Stylish denim jacket',
          slug: 'denim-jacket',
          gender: GENDER.UNISEX,
          status: STATUS.ACTIVE,
          brand: 'Yehagere',
        } as Product,
        {
          name: 'Sneakers',
          description: 'Comfortable everyday sneakers',
          slug: 'sneakers',
          gender: GENDER.UNISEX,
          status: STATUS.ACTIVE,
          brand: 'Yehagere',
        } as Product,
      ]);
    }
  }

  findAll(): Promise<Product[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.repo.findOneBy({ id });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  create(dto: CreateProductDto): Promise<Product> {
    const product = this.repo.create({
      name: dto.name,
      description: dto.description,
      slug: dto.slug ?? dto.name.toLowerCase().replace(/\s+/g, '-'),
      gender: dto.gender ?? GENDER.UNISEX,
      status: dto.status ?? STATUS.ACTIVE,
      brand: dto.brand ?? 'Yehagere',
    } as Product);

    return this.repo.save(product);
  }

  async update(id: string, dto: Partial<CreateProductDto>): Promise<Product> {
    const product = await this.findOne(id);
    const merged = Object.assign(product, {
      ...(dto.name ? { name: dto.name } : {}),
      ...(dto.description ? { description: dto.description } : {}),
      ...(dto.slug ? { slug: dto.slug } : {}),
      ...(dto.gender ? { gender: dto.gender } : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.brand ? { brand: dto.brand } : {}),
    });

    return this.repo.save(merged);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const res = await this.repo.delete(id);
    return { deleted: (res.affected ?? 0) > 0 };
  }
}
