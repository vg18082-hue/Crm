import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ example: 'Алексей Петров', description: 'Имя лида / контактного лица' })
  @IsString({ message: 'Имя лида должно быть строкой' })
  @IsNotEmpty({ message: 'Имя обязательно' })
  name: string;

  @ApiPropertyOptional({ example: '+998931112233' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @ValidateIf((o) => !!o.phone)
  @IsString()
  @Matches(/^\+?[0-9\s\-\(\)]{7,20}$/, { message: 'Вы ввели неправильный номер телефона' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'ООО Технологии' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ example: 'Instagram' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ example: 'Внедрение CRM системы' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  interestedIn?: string;

  @ApiPropertyOptional({ example: 1500000, description: 'Потенциальная сумма сделки' })
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @IsNumber({}, { message: 'Потенциальная сумма должна быть числом' })
  @IsOptional()
  potentialAmount?: number;

  @ApiPropertyOptional({ example: 'Нужна консультация в пятницу' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ example: '2026-08-25T10:00:00.000Z' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @ValidateIf((o) => !!o.nextContactDate)
  @IsDateString({}, { message: 'Некорректный формат даты контакта' })
  @IsOptional()
  nextContactDate?: string;

  @ApiPropertyOptional({ enum: LeadStatus, default: LeadStatus.NEW })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional({ description: 'ID существенного клиента, если есть' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'ID ответственного менеджера' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  assignedToId?: string;
}
