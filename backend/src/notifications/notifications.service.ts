import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTelegramConfigDto } from './dto/update-telegram-config.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTelegramConfig(tenantId: string) {
    let config = await this.prisma.telegramConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      config = await this.prisma.telegramConfig.create({
        data: { tenantId },
      });
    }

    return config;
  }

  async updateTelegramConfig(tenantId: string, dto: UpdateTelegramConfigDto) {
    return this.prisma.telegramConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        ...dto,
      },
      update: dto,
    });
  }

  async sendTelegramMessage(tenantId: string, text: string): Promise<boolean> {
    try {
      const config = await this.getTelegramConfig(tenantId);
      if (!config.isEnabled || !config.botToken || !config.chatId) {
        this.logger.debug(`Telegram notifications are disabled or not configured for tenant ${tenantId}`);
        return false;
      }

      const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.chatId,
          text,
          parse_mode: 'HTML',
        }),
      });

      const resData: any = await response.json();
      if (!resData.ok) {
        this.logger.error(`Telegram API error: ${resData.description}`);
        return false;
      }

      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send Telegram message: ${err.message}`);
      return false;
    }
  }

  async sendTestMessage(tenantId: string) {
    const success = await this.sendTelegramMessage(
      tenantId,
      `<b>⚡ CRM SaaS: Тестовое уведомление</b>\n\nБот успешно подключен к вашей CRM системе! Теперь вы будете получать оперативные уведомления о подписках, заказах и лидах.`,
    );

    return {
      success,
      message: success
        ? 'Тестовое уведомление успешно отправлено в Telegram!'
        : 'Не удалось отправить сообщение. Проверьте Bot Token и Chat ID.',
    };
  }
}
