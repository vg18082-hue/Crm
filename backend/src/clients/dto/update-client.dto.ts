import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateClientDto {
  @ApiPropertyOptional({ example: 'ООО Инновация' })
  @IsString()
  @IsOptional()
  name?: string;

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

  @ApiPropertyOptional({ example: 50000 })
  @IsNumber()
  @IsOptional()
  debt?: number;

  @ApiPropertyOptional({ example: 'Комментарий' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assignedToId?: string;
}
