import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentTenantId } from '../auth/decorators/current-tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { UpdateTelegramConfigDto } from './dto/update-telegram-config.dto';

@ApiTags('Notifications (Уведомления и Telegram)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('telegram-config')
  @ApiOperation({ summary: 'Получить настройки Telegram бота компании' })
  getTelegramConfig(@CurrentTenantId() tenantId: string) {
    return this.notificationsService.getTelegramConfig(tenantId);
  }

  @Patch('telegram-config')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Обновить настройки Telegram бота (Только Администратор)' })
  updateTelegramConfig(
    @CurrentTenantId() tenantId: string,
    @Body() dto: UpdateTelegramConfigDto,
  ) {
    return this.notificationsService.updateTelegramConfig(tenantId, dto);
  }

  @Post('telegram-test')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Отправить тестовое уведомление в Telegram' })
  sendTestMessage(@CurrentTenantId() tenantId: string) {
    return this.notificationsService.sendTestMessage(tenantId);
  }
}
