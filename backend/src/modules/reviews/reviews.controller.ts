import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(@Body() createReviewDto: CreateReviewDto, @Req() req: any) {
    const userId = req.user.id;
    return this.reviewsService.create(userId, createReviewDto);
  }

  @Public()
  @Get()
  findAll(@Query('productId') productId?: string) {
    return this.reviewsService.findAll(productId);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const review = await this.reviewsService.findOne(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }

  @Patch(':id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto, @Req() req: any) {
    const review = await this.reviewsService.findOne(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    const ownerId = review.user?.id || review.userId;

    if (!isAdmin && ownerId !== req.user.id) {
      throw new ForbiddenException('Access denied: You can only edit your own reviews');
    }

    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async remove(@Param('id') id: string, @Req() req: any) {
    const review = await this.reviewsService.findOne(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    const ownerId = review.user?.id || review.userId;

    if (!isAdmin && ownerId !== req.user.id) {
      throw new ForbiddenException('Access denied: You can only delete your own reviews');
    }

    return this.reviewsService.remove(id);
  }
}
