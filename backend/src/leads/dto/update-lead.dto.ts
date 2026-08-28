import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateLeadDto {
  @ApiPropertyOptional({ example: 'Алексей Петров' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+998931112233' })
  @IsString()
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

  @ApiPropertyOptional({ example: 1500000 })
  @IsNumber()
  @IsOptional()
  potentialAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ example: '2026-08-25T10:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  nextContactDate?: string;

  @ApiPropertyOptional({ enum: LeadStatus })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assignedToId?: string;
}
