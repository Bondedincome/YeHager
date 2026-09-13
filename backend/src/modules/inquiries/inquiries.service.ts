import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { Inquiry } from './entities/inquiry.entity';

@Injectable()
export class InquiriesService {
    constructor(@InjectRepository(Inquiry) private readonly repo: Repository<Inquiry>) { }

    create(dto: CreateInquiryDto) {
        return this.repo.save(this.repo.create(dto));
    }

    findAll() {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
}
