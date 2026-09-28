import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiriesService } from './inquiries.service';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Inquiries')
@Controller('inquiries')
export class InquiriesController {
    constructor(private readonly inquiriesService: InquiriesService) { }

    @Post()
    @Public()
    create(@Body() dto: CreateInquiryDto) {
        return this.inquiriesService.create(dto);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    findAll() {
        return this.inquiriesService.findAll();
    }
}
