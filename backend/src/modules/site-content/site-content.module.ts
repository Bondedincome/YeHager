import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteContent } from './entities/site-content.entity';
import { SiteContentService } from './site-content.service';
import { SiteContentController } from './site-content.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SiteContent])],
  controllers: [SiteContentController],
  providers: [SiteContentService],
})
export class SiteContentModule {}
