import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist) private readonly wishlistRepo: Repository<Wishlist>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) { }

  async add(userId: string, productId: string) {
    const product = await this.productRepo.findOneBy({ id: productId });
    if (!product) throw new NotFoundException('Product not found');
    const existing = await this.wishlistRepo.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });
    if (existing) return { productId };
    await this.wishlistRepo.save(this.wishlistRepo.create({
      user: { id: userId },
      product,
    }));
    return { productId };
  }

  async findAll(userId: string) {
    const entries = await this.wishlistRepo.find({
      where: { user: { id: userId } },
      relations: { product: true },
      order: { createdAt: 'DESC' },
    });
    return entries.map((entry) => entry.product.id);
  }

  async remove(userId: string, productId: string) {
    const result = await this.wishlistRepo.delete({
      user: { id: userId },
      product: { id: productId },
    });
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
