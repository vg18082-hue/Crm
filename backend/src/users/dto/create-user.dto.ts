import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Иван Иванов', description: 'ФИО сотрудника' })
  @IsString()
  @IsNotEmpty({ message: 'Имя обязательно' })
  name: string;

  @ApiProperty({ example: 'manager@qave.uz', description: 'Email сотрудника' })
  @IsEmail({}, { message: 'Некорректный email' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'pass1234', description: 'Пароль (минимум 6 символов)' })
  @IsString()
  @MinLength(6, { message: 'Пароль должен быть минимум 6 символов' })
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.MANAGER, description: 'Роль сотрудника' })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
