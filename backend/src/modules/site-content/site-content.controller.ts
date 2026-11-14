import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { SiteContentService } from './site-content.service';
import { UpdateSiteContentDto } from './dto/update-site-content.dto';

@ApiTags('Site Content')
@Controller('site-content')
export class SiteContentController {
  constructor(private readonly service: SiteContentService) {}

  /** Anyone can read storefront content. */
  @Public()
  @Get(':key')
  get(@Param('key') key: string) {
    return this.service.get(key);
  }

  /** Admins replace the whole document. */
  @Put(':key')
  @Roles(Role.ADMIN)
  set(@Param('key') key: string, @Body() dto: UpdateSiteContentDto) {
    return this.service.set(key, dto.content);
  }

  /** Admins can clear it to go back to the built-in defaults. */
  @Delete(':key')
  @Roles(Role.ADMIN)
  reset(@Param('key') key: string) {
    return this.service.reset(key);
  }
}
