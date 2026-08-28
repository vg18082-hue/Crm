import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'ООO «Рога и Копыта»',
    description: 'Название компании-подписчика (Tenant)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Название компании обязательно' })
  companyName: string;

  @ApiProperty({
    example: 'Иван Иванов',
    description: 'ФИО администратора компании',
  })
  @IsString()
  @IsNotEmpty({ message: 'Имя пользователя обязательно' })
  name: string;

  @ApiProperty({
    example: 'admin@company.com',
    description: 'Email для входа в систему',
  })
  @IsEmail({}, { message: 'Некорректный формат email' })
  @IsNotEmpty({ message: 'Email обязателен' })
  email: string;

  @ApiProperty({
    example: 'Secret123!',
    description: 'Пароль (минимум 6 символов)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать не менее 6 символов' })
  password: string;
}
