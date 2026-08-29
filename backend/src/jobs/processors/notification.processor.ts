import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationsService } from '../../notifications/notifications.service';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Process('send-telegram')
  async handleSendTelegram(job: Job<{ tenantId: string; message: string }>) {
    const { tenantId, message } = job.data;
    this.logger.log(`Processing queued Telegram notification for tenant ${tenantId}`);
    return this.notificationsService.sendTelegramMessage(tenantId, message);
  }
}
