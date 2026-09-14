import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, SubscriptionStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class CreateClientSubscriptionDto {
  @ApiProperty({ description: 'ID клиента' })
  @IsString({ message: 'Клиент обязателен' })
  @IsNotEmpty({ message: 'Клиент обязателен' })
  clientId: string;

  @ApiProperty({ example: 'Business Tariff', description: 'Название тарифа' })
  @IsString({ message: 'Название тарифа должно быть текстом' })
  @IsNotEmpty({ message: 'Название тарифа обязательно' })
  planName: string;

  @ApiProperty({ example: 300000, description: 'Сумма регулярного платежа' })
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? 0 : Number(value)))
  @IsNumber({}, { message: 'Сумма подписки должна быть числом' })
  @Min(0, { message: 'Сумма не может быть отрицательной' })
  amount: number;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Периодичность в месяцах' })
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? 1 : Number(value)))
  @IsNumber({}, { message: 'Периодичность должна быть числом месяцев' })
  @Min(1, { message: 'Минимальный период - 1 месяц' })
  @IsOptional()
  periodMonths?: number;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z', description: 'Дата начала подписки' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @ValidateIf((o) => !!o.startDate)
  @IsDateString({}, { message: 'Некорректный формат даты начала подписки' })
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z', description: 'Дата следующего платежа' })
  @IsDateString({}, { message: 'Некорректный формат даты следующего платежа' })
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
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ example: 'CRM подписка + поддержка 24/7' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  comment?: string;
}
