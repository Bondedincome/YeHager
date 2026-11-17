import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import {
  Payment,
  PaymentStatus as ChargeStatus,
} from '../payments/entities/payment.entity';
import { ChapaService } from './chapa.service';

const PRODUCT_ID = '5eb6f436-8b5b-482b-a325-38562c507827';

describe('OrdersService – Chapa confirmation', () => {
  let service: OrdersService;
  let payment: { id: string; status: ChargeStatus; order: Partial<Order> };

  const chapa = { verify: jest.fn() };
  const execute = jest.fn().mockResolvedValue({ affected: 1 });
  const queryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    execute,
  };
  const paymentRepo = {
    findOne: jest.fn(() => Promise.resolve(payment)),
    // Mimics a conditional UPDATE: succeeds only while the status still matches.
    update: jest.fn(
      (where: { status: unknown }, values: { status: ChargeStatus }) => {
        const allowed = (where.status as { value?: ChargeStatus[] })?.value ?? [
          where.status,
        ];
        if (!allowed.includes(payment.status))
          return Promise.resolve({ affected: 0 });
        payment.status = values.status;
        return Promise.resolve({ affected: 1 });
      },
    ),
  };
  const orderRepo = { update: jest.fn().mockResolvedValue({ affected: 1 }) };
  const productRepo = { createQueryBuilder: jest.fn(() => queryBuilder) };
  const userRepo = { increment: jest.fn().mockResolvedValue({}) };

  beforeEach(async () => {
    jest.clearAllMocks();
    payment = {
      id: 'pay-1',
      status: ChargeStatus.PENDING,
      order: {
        id: 'order-1',
        orderNumber: 'YH-123456',
        userId: 'user-1',
        total: 125,
        totalETB: 15625,
        itemsData: [{ id: PRODUCT_ID, price: 100, quantity: 2 }],
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: ChapaService, useValue: chapa },
      ],
    }).compile();
    service = module.get(OrdersService);
  });

  it('marks the order paid, reduces stock and updates the customer once', async () => {
    chapa.verify.mockResolvedValue({
      status: 'success',
      amount: 15625,
      currency: 'ETB',
      txRef: 't',
    });

    await expect(service.confirmChapaPayment('t')).resolves.toEqual(
      expect.objectContaining({ paid: true, orderNumber: 'YH-123456' }),
    );
    expect(orderRepo.update).toHaveBeenCalledWith(
      { id: 'order-1' },
      { paymentStatus: PaymentStatus.PAID, orderStatus: OrderStatus.CONFIRMED },
    );
    expect(queryBuilder.setParameter).toHaveBeenCalledWith('quantity', 2);
    expect(userRepo.increment).toHaveBeenCalledTimes(2);

    // A second callback/webhook for the same payment changes nothing.
    await expect(service.confirmChapaPayment('t')).resolves.toEqual(
      expect.objectContaining({ paid: true }),
    );
    expect(orderRepo.update).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(userRepo.increment).toHaveBeenCalledTimes(2);
  });

  it('reports pending when Chapa has no result yet', async () => {
    chapa.verify.mockResolvedValue(null);
    await expect(service.confirmChapaPayment('t')).resolves.toEqual(
      expect.objectContaining({ status: 'pending' }),
    );
    expect(orderRepo.update).not.toHaveBeenCalled();
  });

  it('records a failed payment without touching the order', async () => {
    chapa.verify.mockResolvedValue({
      status: 'failed',
      amount: 0,
      currency: 'ETB',
      txRef: 't',
    });
    await expect(service.confirmChapaPayment('t')).resolves.toEqual(
      expect.objectContaining({ status: 'failed' }),
    );
    expect(payment.status).toBe(ChargeStatus.FAILED);
    expect(orderRepo.update).not.toHaveBeenCalled();
  });

  it('refuses a payment for less than the order total', async () => {
    chapa.verify.mockResolvedValue({
      status: 'success',
      amount: 100,
      currency: 'ETB',
      txRef: 't',
    });
    await expect(service.confirmChapaPayment('t')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(orderRepo.update).not.toHaveBeenCalled();
  });

  it('refuses a payment in the wrong currency', async () => {
    chapa.verify.mockResolvedValue({
      status: 'success',
      amount: 15625,
      currency: 'USD',
      txRef: 't',
    });
    await expect(service.confirmChapaPayment('t')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
