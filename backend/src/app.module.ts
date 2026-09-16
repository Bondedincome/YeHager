import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './modules/products/product.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { UsersModule } from './modules/users/users.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { CartModule } from './modules/cart/cart.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { InventoryLogsModule } from './modules/inventory-logs/inventory-logs.module';
import { AuthModule } from './auth/auth.module';
import { CoreModule } from './core.module';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { chapaConfig } from './config/chapa.config';
import { validationSchema } from './config/validation.schema';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './common/logger/logger.service';
import { InquiriesModule } from './modules/inquiries/inquiries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig, jwtConfig, chapaConfig],
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: configService.get<boolean>('database.synchronize'),
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true,
        logging: configService.get<string>('app.nodeEnv') !== 'production',
      }),
    }),
    ProductsModule,
    CategoriesModule,
    UsersModule,
    ReviewsModule,
    WishlistModule,
    CartModule,
    AddressesModule,
    OrdersModule,
    PaymentsModule,
    CouponsModule,
    InventoryLogsModule,
    AuthModule,
    CoreModule,
    InquiriesModule,
  ],
  controllers: [],
  providers: [
    LoggerService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule { }
