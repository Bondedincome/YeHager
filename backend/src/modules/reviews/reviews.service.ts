import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly inMemoryReviews = new Map<string, any>();

  constructor(
    @Optional()
    @InjectRepository(Review)
    private readonly repo?: Repository<Review>,
  ) {}

  async create(userId: string, createReviewDto: CreateReviewDto) {
    if (this.repo) {
      const review = this.repo.create({
        ...createReviewDto,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user: { id: userId } as any,
      });
      return this.repo.save(review);
    }

    const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const review = {
      id,
      userId,
      ...createReviewDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inMemoryReviews.set(id, review);
    return review;
  }

  async findAll(productId?: string) {
    if (this.repo) {
      if (productId) {
        return this.repo.find({
          where: { product: { id: productId } },
          relations: { user: true, product: true },
        });
      }
      return this.repo.find({ relations: { user: true, product: true } });
    }

    const all = Array.from(this.inMemoryReviews.values());
    if (productId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return all.filter((r: any) => r.productId === productId);
    }
    return all;
  }

  async findOne(id: string) {
    if (this.repo) {
      return this.repo.findOne({
        where: { id },
        relations: { user: true, product: true },
      });
    }
    return this.inMemoryReviews.get(id);
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    if (this.repo) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.repo.update(id, updateReviewDto as any);
      return this.findOne(id);
    }
    const existing = this.inMemoryReviews.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updateReviewDto, updatedAt: new Date() };
    this.inMemoryReviews.set(id, updated);
    return updated;
  }

  async remove(id: string) {
    if (this.repo) {
      const result = await this.repo.delete(id);
      return { deleted: (result.affected ?? 0) > 0 };
    }
    const existed = this.inMemoryReviews.delete(id);
    return { deleted: existed };
  }
}
