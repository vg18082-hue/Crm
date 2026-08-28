import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthUserDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0' })
  id: string;

  @ApiProperty({ example: 'Иван Иванов' })
  name: string;

  @ApiProperty({ example: 'admin@company.com' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  role: Role;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-2345-6789abcdef01' })
  tenantId: string;

  @ApiProperty({ example: 'ООO «Рога и Копыта»' })
  tenantName: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token (срок действия 1 день)',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Refresh Token (срок действия 7 дней)',
  })
  refreshToken: string;

  @ApiProperty({ type: AuthUserDto, description: 'Данные пользователя и компании' })
  user: AuthUserDto;
}
