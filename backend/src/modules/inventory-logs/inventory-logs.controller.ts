import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InventoryLogsService } from './inventory-logs.service';
import { CreateInventoryLogDto } from './dto/create-inventory-log.dto';
import { UpdateInventoryLogDto } from './dto/update-inventory-log.dto';

@ApiTags('Inventory Logs')
@Controller('inventory-logs')
export class InventoryLogsController {
  constructor(private readonly inventoryLogsService: InventoryLogsService) {}

  @Post()
  create(@Body() createInventoryLogDto: CreateInventoryLogDto) {
    return this.inventoryLogsService.create(createInventoryLogDto);
  }

  @Get()
  findAll() {
    return this.inventoryLogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryLogsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInventoryLogDto: UpdateInventoryLogDto,
  ) {
    return this.inventoryLogsService.update(+id, updateInventoryLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryLogsService.remove(+id);
  }
}
