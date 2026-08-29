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
  @ApiOperation({ summary: 'Получить статус подключения и ссылку для Telegram бота' })
  getTelegramConfig(@CurrentTenantId() tenantId: string) {
    return this.notificationsService.getTelegramConfig(tenantId);
  }

  @Post('telegram-regenerate-link')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Сгенерировать новую ссылку для подключения бота' })
  regenerateLink(@CurrentTenantId() tenantId: string) {
    return this.notificationsService.regenerateConnectLink(tenantId);
  }

  @Post('telegram-disconnect')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Отключить Telegram бота для компании' })
  disconnectTelegram(@CurrentTenantId() tenantId: string) {
    return this.notificationsService.disconnectTelegram(tenantId);
  }

  @Patch('telegram-config')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Обновить настройки Telegram (переключатели уведомлений)' })
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
