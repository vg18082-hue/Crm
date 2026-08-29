import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTelegramConfigDto } from './dto/update-telegram-config.dto';
import * as TelegramBot from 'node-telegram-bot-api';
import * as crypto from 'crypto';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private bot: TelegramBot | null = null;
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN || '8769172079:AAFQ14uNqlIP-po3omaGEhAXR2TiFsQWVXk';
  private readonly botUsername = process.env.TELEGRAM_BOT_USERNAME || 'mycrm_notification_bot';

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.initTelegramBot();
  }

  onModuleDestroy() {
    if (this.bot) {
      try {
        this.bot.stopPolling();
      } catch (err) {
        this.logger.error('Error stopping Telegram bot polling', err);
      }
    }
  }

  private initTelegramBot() {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not defined. Telegram bot listener disabled.');
      return;
    }

    try {
      this.bot = new TelegramBot(this.botToken, { polling: true });
      this.logger.log(`🤖 Telegram Bot @${this.botUsername} successfully initialized with polling`);

      // Handle /start with deep link token
      this.bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id.toString();
        const rawCode = match?.[1]?.trim();
        const fromUser = msg.from?.username
          ? `@${msg.from.username}`
          : [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || 'Пользователь';

        if (!rawCode) {
          await this.bot?.sendMessage(
            chatId,
            `👋 <b>Привет, ${fromUser}!</b>\n\nЭто официальный бот CRM для мгновенных уведомлений о заказах, лидах, оплатах и подписках.\n\nЧтобы привязать уведомления к вашей компании, зайдите в CRM и нажмите кнопку <b>«Telegram Бот»</b> → <b>«Подключить в 1 клик»</b>.`,
            { parse_mode: 'HTML' },
          );
          return;
        }

        try {
          const config = await this.prisma.telegramConfig.findUnique({
            where: { linkCode: rawCode },
            include: { tenant: true },
          });

          if (!config) {
            await this.bot?.sendMessage(
              chatId,
              `❌ <b>Ошибка привязки</b>\n\nКод привязки устарел или не найден. Пожалуйста, откройте CRM и нажмите кнопку подключения снова.`,
              { parse_mode: 'HTML' },
            );
            return;
          }

          // Save chatId, username, and enable notifications
          await this.prisma.telegramConfig.update({
            where: { id: config.id },
            data: {
              chatId,
              username: fromUser,
              isEnabled: true,
            },
          });

          await this.bot?.sendMessage(
            chatId,
            `🎉 <b>Уведомления успешно подключены!</b>\n\n🏢 Компания: <b>${config.tenant.name}</b>\n👤 Получатель: <b>${fromUser}</b>\n\nТеперь сюда будут автоматически приходить:\n• 🎯 Новые лиды\n• 🛍 Новые заказы\n• 💳 Оплаты и продления\n• ⏰ Напоминания о подписках и задачах`,
            { parse_mode: 'HTML' },
          );

          this.logger.log(`Linked Telegram chatId ${chatId} (${fromUser}) to tenant ${config.tenant.name} (${config.tenantId})`);
        } catch (err: any) {
          this.logger.error(`Error processing Telegram /start deep link: ${err.message}`);
          await this.bot?.sendMessage(
            chatId,
            `⚠️ Произошла ошибка при привязке. Попробуйте еще раз позже.`,
          );
        }
      });

      this.bot.on('polling_error', (err: any) => {
        // Prevent spamming logs if network reconnects
        this.logger.debug(`Telegram polling warning: ${err.message || err.code}`);
      });
    } catch (err: any) {
      this.logger.error(`Failed to initialize Telegram Bot: ${err.message}`);
    }
  }

  async getTelegramConnectInfo(tenantId: string) {
    let config = await this.prisma.telegramConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      config = await this.prisma.telegramConfig.create({
        data: {
          tenantId,
          linkCode: crypto.randomBytes(8).toString('hex'),
        },
      });
    } else if (!config.linkCode) {
      config = await this.prisma.telegramConfig.update({
        where: { tenantId },
        data: {
          linkCode: crypto.randomBytes(8).toString('hex'),
        },
      });
    }

    const connectUrl = `https://t.me/${this.botUsername}?start=${config.linkCode}`;

    return {
      ...config,
      botUsername: this.botUsername,
      connectUrl,
      isConnected: !!config.chatId,
    };
  }

  async regenerateConnectLink(tenantId: string) {
    const newCode = crypto.randomBytes(8).toString('hex');
    const config = await this.prisma.telegramConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        linkCode: newCode,
      },
      update: {
        linkCode: newCode,
      },
    });

    return {
      ...config,
      botUsername: this.botUsername,
      connectUrl: `https://t.me/${this.botUsername}?start=${newCode}`,
      isConnected: !!config.chatId,
    };
  }

  async disconnectTelegram(tenantId: string) {
    const config = await this.prisma.telegramConfig.update({
      where: { tenantId },
      data: {
        chatId: null,
        username: null,
        isEnabled: false,
      },
    });

    return {
      success: true,
      message: 'Telegram успешно отключен',
      config,
    };
  }

  async getTelegramConfig(tenantId: string) {
    return this.getTelegramConnectInfo(tenantId);
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
      const config = await this.prisma.telegramConfig.findUnique({
        where: { tenantId },
      });

      if (!config || !config.isEnabled || !config.chatId) {
        this.logger.debug(`Telegram notifications are disabled or not connected for tenant ${tenantId}`);
        return false;
      }

      if (this.bot) {
        await this.bot.sendMessage(config.chatId, text, { parse_mode: 'HTML' });
        return true;
      }

      // Fallback via HTTP fetch if bot instance isn't active
      const token = config.botToken || this.botToken;
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
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
      return !!resData.ok;
    } catch (err: any) {
      this.logger.error(`Failed to send Telegram message: ${err.message}`);
      return false;
    }
  }

  async sendTestMessage(tenantId: string) {
    const config = await this.prisma.telegramConfig.findUnique({
      where: { tenantId },
      include: { tenant: true },
    });

    if (!config?.chatId) {
      return {
        success: false,
        message: 'Telegram еще не подключен! Нажмите «Подключить Telegram» и нажмите START в боте.',
      };
    }

    const success = await this.sendTelegramMessage(
      tenantId,
      `<b>⚡ CRM SaaS: Тестовое уведомление</b>\n\n🏢 Компания: <b>${config.tenant.name}</b>\n✅ Бот работает отлично! Теперь сюда будут приходить все важные события CRM.`,
    );

    return {
      success,
      message: success
        ? 'Тестовое уведомление успешно отправлено в Telegram!'
        : 'Не удалось отправить сообщение. Убедитесь, что бот не заблокирован в Telegram.',
    };
  }
}
