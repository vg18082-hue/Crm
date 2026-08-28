import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSaleItemDto {
  @ApiPropertyOptional({ description: 'ID товара/услуги из каталога' })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty({ example: 'Услуга по настройке сервера' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 500000, description: 'Цена за единицу' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Скидка на позицию' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;
}
