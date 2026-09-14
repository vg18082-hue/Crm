import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Текущий пароль', example: 'OldPassword123' })
  @IsString()
  @IsNotEmpty({ message: 'Текущий пароль обязателен' })
  currentPassword: string;

  @ApiProperty({ description: 'Новый пароль (мин. 6 символов)', example: 'NewSecret123!', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Новый пароль должен содержать не менее 6 символов' })
  newPassword: string;
}
