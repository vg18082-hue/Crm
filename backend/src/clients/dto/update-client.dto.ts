import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateClientDto {
  @ApiPropertyOptional({ example: 'ООО Инновация' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'client@company.uz' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @ValidateIf((o) => !!o.email)
  @IsEmail({}, { message: 'Некорректный формат адреса электронной почты (email)' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '@client_tg' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  telegram?: string;

  @ApiPropertyOptional({ example: 'г. Ташкент, ул. Амира Темура 12' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Telegram Реклама' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ example: 50000 })
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @IsNumber({}, { message: 'Задолженность должна быть числом' })
  @IsOptional()
  debt?: number;

  @ApiPropertyOptional({ example: 'Комментарий' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value))
  @IsString()
  @IsOptional()
  assignedToId?: string;
}

