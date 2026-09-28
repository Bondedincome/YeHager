import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { Product } from '../products/entities/product.entity';

describe('CartService', () => {
  let service: CartService;
  let cartRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let productRepo: { findOneBy: jest.Mock };

  beforeEach(async () => {
    cartRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ ...value, id: 'cart-1' })),
      update: jest.fn().mockResolvedValue(undefined),
    };
    productRepo = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 'product-1',
        name: 'Linen shirt',
        price: 35,
        stock: 8,
        imageUrl: '/linen.jpg',
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(Cart), useValue: cartRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns an empty cart for a user without a saved cart', async () => {
    await expect(service.getForUser('user-1')).resolves.toEqual({ items: [], total: 0 });
  });

  it('persists canonical product data and calculates the total', async () => {
    const result = await service.replaceForUser('user-1', [
      { productId: 'product-1', quantity: 2, size: 'M', color: 'Cream' },
    ]);

    expect(cartRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      user: { id: 'user-1' },
      total: 70,
      itemsData: [expect.objectContaining({
        productId: 'product-1',
        title: 'Linen shirt',
        price: 35,
        quantity: 2,
      })],
    }));
    expect(result.total).toBe(70);
  });

  it('rejects cart quantities above current stock', async () => {
    productRepo.findOneBy.mockResolvedValue({ id: 'product-1', name: 'Linen shirt', price: 35, stock: 1 });

    await expect(service.replaceForUser('user-1', [
      { productId: 'product-1', quantity: 2 },
    ])).rejects.toBeInstanceOf(BadRequestException);
  });
});
