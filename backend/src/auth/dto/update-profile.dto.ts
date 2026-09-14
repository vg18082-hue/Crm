import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'ФИО пользователя', example: 'Иван Иванов' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({ description: 'Название компании', example: 'ООО Новые Технологии' })
  @IsOptional()
  @IsString()
  name?: string;
}
