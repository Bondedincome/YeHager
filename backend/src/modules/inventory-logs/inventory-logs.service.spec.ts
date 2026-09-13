import { Test, TestingModule } from '@nestjs/testing';
import { InventoryLogsService } from './inventory-logs.service';

describe('InventoryLogsService', () => {
  let service: InventoryLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryLogsService],
    }).compile();

    service = module.get<InventoryLogsService>(InventoryLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
