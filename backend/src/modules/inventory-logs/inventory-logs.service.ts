import { Injectable } from '@nestjs/common';
import { CreateInventoryLogDto } from './dto/create-inventory-log.dto';
import { UpdateInventoryLogDto } from './dto/update-inventory-log.dto';

@Injectable()
export class InventoryLogsService {
  create(createInventoryLogDto: CreateInventoryLogDto) {
    return 'This action adds a new inventoryLog';
  }

  findAll() {
    return `This action returns all inventoryLogs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} inventoryLog`;
  }

  update(id: number, updateInventoryLogDto: UpdateInventoryLogDto) {
    return `This action updates a #${id} inventoryLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} inventoryLog`;
  }
}
