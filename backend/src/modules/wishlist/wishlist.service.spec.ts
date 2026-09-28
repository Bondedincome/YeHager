import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WishlistService } from './wishlist.service';
import { Wishlist } from './entities/wishlist.entity';
import { Product } from '../products/entities/product.entity';

describe('WishlistService', () => {
  let service: WishlistService;
  let wishlistRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    delete: jest.Mock;
  };
  let productRepo: { findOneBy: jest.Mock };

  beforeEach(async () => {
    wishlistRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue({}),
      find: jest.fn().mockResolvedValue([{ product: { id: 'product-1' } }]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    productRepo = { findOneBy: jest.fn().mockResolvedValue({ id: 'product-1' }) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: getRepositoryToken(Wishlist), useValue: wishlistRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('adds a product to the current user wishlist', async () => {
    await expect(service.add('user-1', 'product-1')).resolves.toEqual({ productId: 'product-1' });
    expect(wishlistRepo.create).toHaveBeenCalledWith({
      user: { id: 'user-1' },
      product: { id: 'product-1' },
    });
    expect(wishlistRepo.save).toHaveBeenCalled();
  });

  it('does not create duplicate entries', async () => {
    wishlistRepo.findOne.mockResolvedValue({ id: 'existing' });

    await service.add('user-1', 'product-1');

    expect(wishlistRepo.save).not.toHaveBeenCalled();
  });

  it('returns product IDs owned by the requested user', async () => {
    await expect(service.findAll('user-1')).resolves.toEqual(['product-1']);
    expect(wishlistRepo.find).toHaveBeenCalledWith(expect.objectContaining({
      where: { user: { id: 'user-1' } },
    }));
  });
});
