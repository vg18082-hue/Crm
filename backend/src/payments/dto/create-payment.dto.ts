import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, SaleStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 500000, description: 'Сумма платежа' })
  @IsNumber()
  @Min(0.01, { message: 'Сумма платежа должна быть больше 0' })
  amount: number;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ enum: SaleStatus, default: SaleStatus.PAID })
  @IsEnum(SaleStatus)
  @IsOptional()
  status?: SaleStatus;

  @ApiPropertyOptional({ description: 'ID связанного клиента' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'ID связанной продажи' })
  @IsString()
  @IsOptional()
  saleId?: string;

  @ApiPropertyOptional({ description: 'ID связанного заказа' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ example: 'Оплата наличными через кассу' })
  @IsString()
  @IsOptional()
  comment?: string;
}
