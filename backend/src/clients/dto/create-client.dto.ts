import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'ООО Инновация' })
  @IsString()
  @IsNotEmpty({ message: 'Название или ФИО обязательно' })
  name: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'client@company.uz' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '@client_tg' })
  @IsString()
  @IsOptional()
  telegram?: string;

  @ApiPropertyOptional({ example: 'г. Ташкент, ул. Амира Темура 12' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Telegram Реклама' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ example: 0, description: 'Задолженность клиента' })
  @IsNumber()
  @IsOptional()
  debt?: number;

  @ApiPropertyOptional({ example: 'Постоянный клиент' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ description: 'ID ответственного менеджера' })
  @IsString()
  @IsOptional()
  assignedToId?: string;
}
