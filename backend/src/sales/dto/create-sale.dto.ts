import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, SaleStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateSaleItemDto } from './create-sale-item.dto';

export class CreateSaleDto {
  @ApiProperty({ description: 'ID клиента' })
  @IsString()
  @IsNotEmpty({ message: 'Клиент обязателен' })
  clientId: string;

  @ApiPropertyOptional({ description: 'ID связанного лида' })
  @IsString()
  @IsOptional()
  leadId?: string;

  @ApiPropertyOptional({ example: 0, description: 'Общая скидка на всю сделку' })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ enum: SaleStatus, default: SaleStatus.PENDING })
  @IsEnum(SaleStatus)
  @IsOptional()
  status?: SaleStatus;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: 'Продажа со скидкой постоянному клиенту' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ description: 'ID ответственного менеджера' })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ type: [CreateSaleItemDto], description: 'Позиции продажи (товары/услуги)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  @IsOptional()
  items?: CreateSaleItemDto[];
}
