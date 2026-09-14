import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'ООО Инновация' })
  @IsString({ message: 'Название или ФИО должно быть строкой' })
  @IsNotEmpty({ message: 'Название или ФИО обязательно для заполнения' })
  name: string;

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

  @ApiPropertyOptional({ example: 0, description: 'Задолженность клиента' })
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? 0 : Number(value)))
  @IsNumber({}, { message: 'Задолженность должна быть числом' })
  @IsOptional()
  debt?: number;

  @ApiPropertyOptional({ example: 'Постоянный клиент' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ description: 'ID ответственного менеджера' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  assignedToId?: string;
}

