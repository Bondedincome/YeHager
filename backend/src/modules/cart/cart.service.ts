import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartStatus } from './entities/cart.entity';
import { CartLineDto } from './dto/create-cart.dto';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly repo: Repository<Cart>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) { }

  async getForUser(userId: string) {
    const cart = await this.repo.findOne({
      where: { user: { id: userId }, status: CartStatus.ACTIVE },
      order: { updatedAt: 'DESC' },
    });
    return cart ? this.toResponse(cart) : { items: [], total: 0 };
  }

  async replaceForUser(userId: string, lines: CartLineDto[]) {
    let cart = await this.repo.findOne({
      where: { user: { id: userId }, status: CartStatus.ACTIVE },
      order: { updatedAt: 'DESC' },
    });

    const itemsData = await Promise.all(lines.map(async (line) => {
      const product = await this.productRepo.findOneBy({ id: line.productId });
      if (!product) throw new NotFoundException(`Product ${line.productId} was not found`);
      if (product.stock < line.quantity) {
        throw new BadRequestException(`Only ${product.stock} units of ${product.name} are available`);
      }
      return {
        id: product.id,
        productId: product.id,
        title: product.name || product.title,
        price: Number(product.price),
        quantity: line.quantity,
        imageUrl: product.imageUrl || undefined,
        size: line.size,
        color: line.color,
      };
    }));

    if (!cart) {
      cart = this.repo.create({
        user: { id: userId },
        status: CartStatus.ACTIVE,
        itemsData,
        total: itemsData.reduce((sum, item) => sum + item.price * item.quantity, 0),
      });
    } else {
      cart.itemsData = itemsData;
      cart.total = itemsData.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }

    return this.toResponse(await this.repo.save(cart));
  }

  async clearForUser(userId: string) {
    await this.repo.update(
      { user: { id: userId }, status: CartStatus.ACTIVE },
      { itemsData: [], total: 0 },
    );
    return { items: [], total: 0 };
  }

  private toResponse(cart: Cart) {
    return { id: cart.id, items: cart.itemsData || [], total: Number(cart.total) };
  }
}
