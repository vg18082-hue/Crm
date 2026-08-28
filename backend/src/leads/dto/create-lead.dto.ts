import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ example: 'Алексей Петров', description: 'Имя лида / контактного лица' })
  @IsString()
  @IsNotEmpty({ message: 'Имя обязательно' })
  name: string;

  @ApiPropertyOptional({ example: '+998931112233' })
  @IsString()
  @Matches(/^\+?[0-9\s\-\(\)]{7,20}$/, { message: 'Вы ввели неправильный номер телефона' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'ООО Технологии' })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ example: 'Instagram' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ example: 'Внедрение CRM системы' })
  @IsString()
  @IsOptional()
  interestedIn?: string;

  @ApiPropertyOptional({ example: 1500000, description: 'Потенциальная сумма сделки' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Потенциальная сумма должна быть числом' })
  @IsOptional()
  potentialAmount?: number;

  @ApiPropertyOptional({ example: 'Нужна консультация в пятницу' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ example: '2026-08-25T10:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  nextContactDate?: string;

  @ApiPropertyOptional({ enum: LeadStatus, default: LeadStatus.NEW })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional({ description: 'ID существенного клиента, если есть' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'ID ответственного менеджера' })
  @IsString()
  @IsOptional()
  assignedToId?: string;
}
