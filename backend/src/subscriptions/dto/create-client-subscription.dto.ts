import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, SubscriptionStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateClientSubscriptionDto {
  @ApiProperty({ description: 'ID клиента' })
  @IsString()
  @IsNotEmpty({ message: 'Клиент обязателен' })
  clientId: string;

  @ApiProperty({ example: 'Business Tariff', description: 'Название тарифа' })
  @IsString()
  @IsNotEmpty({ message: 'Название тарифа обязательно' })
  planName: string;

  @ApiProperty({ example: 300000, description: 'Сумма регулярного платежа' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Периодичность в месяцах' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  periodMonths?: number;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z', description: 'Дата начала подписки' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z', description: 'Дата следующего платежа' })
  @IsDateString()
  @IsNotEmpty({ message: 'Дата следующего платежа обязательна' })
  nextPaymentDate: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'ID ответственного менеджера' })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ example: 'CRM подписка + поддержка 24/7' })
  @IsString()
  @IsOptional()
  comment?: string;
}
