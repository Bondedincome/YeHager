import { Column, Entity } from 'typeorm';
import { BaseModel } from '@database/base.model';

@Entity('inquiries')
export class Inquiry extends BaseModel {
    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    subject: string;

    @Column({ type: 'text' })
    message: string;
}
