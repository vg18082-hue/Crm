import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecordSubscriptionPaymentDto {
  @ApiPropertyOptional({ example: 300000, description: 'Фактическая сумма оплаты (по умолчанию сумма тарифа)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: 'Оплата за сентябрь 2026' })
  @IsString()
  @IsOptional()
  comment?: string;
}
