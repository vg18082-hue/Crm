import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Регистрация новой компании (Tenant) и администратора',
    description:
      'Создает компанию-подписчика, аккаунт администратора и базовую подписку в рамках одной транзакции.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Компания и администратор успешно зарегистрированы',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Пользователь с таким email уже существует',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Ошибка валидации входных данных',
  })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Вход в систему',
    description:
      'Проверяет учетные данные пользователя и статус активности компании, возвращает JWT токены.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Успешная аутентификация',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Неверный email/пароль или компания деактивирована',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Ошибка валидации входных данных',
  })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить профиль текущего авторизованного пользователя',
    description:
      'Возвращает данные пользователя и информацию о компании (Tenant) на основе JWT токена.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Профиль пользователя успешно получен',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Токен отсутствует или недействителен',
  })
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
