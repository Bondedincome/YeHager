import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly inMemoryAddresses = new Map<string, any>();

  constructor(
    @Optional()
    @InjectRepository(Address)
    private readonly repo?: Repository<Address>,
  ) {}

  async create(userId: string, createAddressDto: CreateAddressDto) {
    if (this.repo) {
      const address = this.repo.create({
        ...createAddressDto,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user: { id: userId } as any,
      });
      return this.repo.save(address);
    }

    const id = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const address = {
      id,
      userId,
      ...createAddressDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inMemoryAddresses.set(id, address);
    return address;
  }

  async findAll(userId?: string) {
    if (this.repo) {
      if (userId) {
        return this.repo.find({
          where: { user: { id: userId } },
          relations: { user: true },
        });
      }
      return this.repo.find({ relations: { user: true } });
    }

    const all = Array.from(this.inMemoryAddresses.values());
    if (userId) {
      return all.filter((a) => a.userId === userId);
    }
    return all;
  }

  async findOne(id: string) {
    if (this.repo) {
      return this.repo.findOne({
        where: { id },
        relations: { user: true },
      });
    }
    return this.inMemoryAddresses.get(id);
  }

  async update(id: string, updateAddressDto: UpdateAddressDto) {
    if (this.repo) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.repo.update(id, updateAddressDto as any);
      return this.findOne(id);
    }
    const existing = this.inMemoryAddresses.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updateAddressDto, updatedAt: new Date() };
    this.inMemoryAddresses.set(id, updated);
    return updated;
  }

  async remove(id: string) {
    if (this.repo) {
      const result = await this.repo.delete(id);
      return { deleted: (result.affected ?? 0) > 0 };
    }
    const existed = this.inMemoryAddresses.delete(id);
    return { deleted: existed };
  }
}
