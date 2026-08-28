import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Серверная инфраструктура Pro' })
  @IsString()
  @IsNotEmpty({ message: 'Название товара/услуги обязательно' })
  name: string;

  @ApiPropertyOptional({ example: 'IT Обслуживание' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'Подробное описание товара или услуги' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'SKU-10029' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ enum: ProductType, default: ProductType.PRODUCT })
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @ApiProperty({ example: 350000, description: 'Продажная цена' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 200000, description: 'Себестоимость' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({ example: 10, default: 0, description: 'Остаток на складе' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ example: 'шт', default: 'шт' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
