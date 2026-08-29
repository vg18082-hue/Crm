import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Processor('subscriptions')
export class SubscriptionProcessor {
  private readonly logger = new Logger(SubscriptionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process('check-subscriptions')
  async handleSubscriptionCheck(job: Job) {
    this.logger.log('Starting automated subscriptions health & status check...');
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    // 1. Mark overdue subscriptions
    const overdueUpdated = await this.prisma.clientSubscription.updateMany({
      where: {
        nextPaymentDate: { lt: now },
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.DUE_SOON, SubscriptionStatus.PENDING_PAYMENT] },
      },
      data: {
        status: SubscriptionStatus.OVERDUE,
      },
    });

    // 2. Mark due soon subscriptions (within next 7 days)
    const dueSoonUpdated = await this.prisma.clientSubscription.updateMany({
      where: {
        nextPaymentDate: { gte: now, lte: in7Days },
        status: SubscriptionStatus.ACTIVE,
      },
      data: {
        status: SubscriptionStatus.DUE_SOON,
      },
    });

    this.logger.log(`Subscriptions updated: ${overdueUpdated.count} marked OVERDUE, ${dueSoonUpdated.count} marked DUE_SOON.`);

    // 3. Send Telegram reminders for upcoming and overdue subscriptions
    const subsToNotify = await this.prisma.clientSubscription.findMany({
      where: {
        status: { in: [SubscriptionStatus.DUE_SOON, SubscriptionStatus.OVERDUE] },
      },
      include: {
        client: true,
        tenant: {
          include: { telegramConfig: true },
        },
      },
    });

    for (const sub of subsToNotify) {
      const tgConfig = sub.tenant.telegramConfig;
      if (tgConfig?.isEnabled && tgConfig.notifySubscriptions) {
        const nextDate = new Date(sub.nextPaymentDate);
        const daysDiff = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

        let messageText = '';
        if (daysDiff < 0) {
          messageText = `🚨 <b>Внимание: Просрочена подписка!</b>\n\n` +
            `👤 Клиент: <b>${sub.client.name}</b>\n` +
            `💼 Тариф: ${sub.planName}\n` +
            `💰 Сумма: ${Number(sub.amount).toLocaleString()} сум\n` +
            `⏳ Дней просрочки: <b>${Math.abs(daysDiff)}</b>\n` +
            `📅 Дата платежа: ${nextDate.toLocaleDateString('ru-RU')}`;
        } else if (daysDiff <= 7) {
          messageText = `⏰ <b>Напоминание: Скоро оплата подписки</b>\n\n` +
            `👤 Клиент: <b>${sub.client.name}</b>\n` +
            `💼 Тариф: ${sub.planName}\n` +
            `💰 Сумма: ${Number(sub.amount).toLocaleString()} сум\n` +
            `📅 Срок оплаты: <b>${nextDate.toLocaleDateString('ru-RU')}</b> (через ${daysDiff} дн.)`;
        }

        if (messageText) {
          await this.notificationsService.sendTelegramMessage(sub.tenantId, messageText);
        }
      }
    }

    return {
      overdueCount: overdueUpdated.count,
      dueSoonCount: dueSoonUpdated.count,
    };
  }
}
