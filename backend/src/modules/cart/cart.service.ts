import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartStatus } from './entities/cart.entity';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly inMemoryCarts = new Map<string, any>();

  constructor(
    @Optional()
    @InjectRepository(Cart)
    private readonly repo?: Repository<Cart>,
  ) {}

  async create(userId: string, createCartDto: CreateCartDto) {
    if (this.repo) {
      const cart = this.repo.create({
        ...createCartDto,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user: { id: userId } as any,
        status: CartStatus.ACTIVE,
        total: 0,
      });
      return this.repo.save(cart);
    }

    const id = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cart = {
      id,
      userId,
      ...createCartDto,
      status: CartStatus.ACTIVE,
      total: 0,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inMemoryCarts.set(id, cart);
    return cart;
  }

  async findAll(userId?: string) {
    if (this.repo) {
      if (userId) {
        return this.repo.find({
          where: { user: { id: userId } },
          relations: { user: true, items: true },
        });
      }
      return this.repo.find({ relations: { user: true, items: true } });
    }

    const all = Array.from(this.inMemoryCarts.values());
    if (userId) {
      return all.filter((c) => c.userId === userId);
    }
    return all;
  }

  async findOne(id: string) {
    if (this.repo) {
      return this.repo.findOne({
        where: { id },
        relations: { user: true, items: true },
      });
    }
    return this.inMemoryCarts.get(id);
  }

  async update(id: string, updateCartDto: UpdateCartDto) {
    if (this.repo) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.repo.update(id, updateCartDto as any);
      return this.findOne(id);
    }
    const existing = this.inMemoryCarts.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updateCartDto, updatedAt: new Date() };
    this.inMemoryCarts.set(id, updated);
    return updated;
  }

  async remove(id: string) {
    if (this.repo) {
      const result = await this.repo.delete(id);
      return { deleted: (result.affected ?? 0) > 0 };
    }
    const existed = this.inMemoryCarts.delete(id);
    return { deleted: existed };
  }
}
