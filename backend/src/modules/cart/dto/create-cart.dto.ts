import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CartLineDto {
    @IsUUID()
    productId: string;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsOptional()
    @IsString()
    size?: string;

    @IsOptional()
    @IsString()
    color?: string;
}

export class CreateCartDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CartLineDto)
    items: CartLineDto[];
}
