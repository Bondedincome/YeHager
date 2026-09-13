import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateInquiryDto {
    @IsString()
    @MinLength(2)
    @MaxLength(120)
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(2)
    @MaxLength(180)
    subject: string;

    @IsString()
    @MinLength(10)
    message: string;
}
