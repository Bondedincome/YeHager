import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Payment } from '../payments/entities/payment.entity';
import { ChapaService } from './chapa.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, User, Product, Payment])],
  controllers: [OrdersController],
  providers: [OrdersService, ChapaService],
})
export class OrdersModule { }
