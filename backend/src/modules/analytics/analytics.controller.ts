import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { AnalyticsService } from './analytics.service';
import { ProfitQueryDto } from './dto/profit-query.dto';

@ApiTags('Analytics')
@Controller('analytics')
@Roles(Role.ADMIN)
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  /** Profit & loss by product and by day. Admins only. */
  @Get('profit')
  profit(@Query() query: ProfitQueryDto) {
    return this.service.profit(query);
  }
}
