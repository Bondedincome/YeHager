import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { ProfitQueryDto } from './dto/profit-query.dto';
import { buildProfitReport, ProfitReport } from './profit-report';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  /**
   * Profit & loss for paid, non-cancelled orders in the period.
   * Unpaid Chapa checkouts, failed and refunded payments are left out.
   */
  async profit(
    query: ProfitQueryDto,
  ): Promise<ProfitReport & { filters: ProfitQueryDto; generatedAt: string }> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if (from && to && from > to)
      throw new BadRequestException('"from" must be before "to"');

    const where: FindOptionsWhere<Order> = {
      paymentStatus: PaymentStatus.PAID,
      orderStatus:
        query.status && query.status !== OrderStatus.CANCELLED
          ? query.status
          : Not(OrderStatus.CANCELLED),
    };
    if (from && to) where.createdAt = Between(from, to);
    else if (from) where.createdAt = MoreThanOrEqual(from);
    else if (to) where.createdAt = LessThanOrEqual(to);

    const [orders, products] = await Promise.all([
      this.orderRepo.find({
        where,
        select: {
          id: true,
          createdAt: true,
          shippingFee: true,
          discount: true,
          itemsData: true,
        },
        order: { createdAt: 'ASC' },
      }),
      // Include deleted products so old sales still show the right name, category and cost.
      this.productRepo.find({
        withDeleted: true,
        select: {
          id: true,
          title: true,
          name: true,
          categoryName: true,
          costPrice: true,
        },
      }),
    ]);

    const report = buildProfitReport(
      orders,
      products.map((p) => ({
        id: p.id,
        title: p.title || p.name,
        categoryName: p.categoryName,
        costPrice: p.costPrice,
      })),
      {
        category: query.category,
        productId: query.productId,
        tzOffset: query.tzOffset,
      },
    );

    return { ...report, filters: query, generatedAt: new Date().toISOString() };
  }
}
