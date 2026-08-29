import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectQueue('subscriptions') private readonly subscriptionsQueue: Queue,
    @InjectQueue('tasks') private readonly tasksQueue: Queue,
  ) {}

  // Automated daily check at 09:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailyMorningCron() {
    this.logger.log('⏰ Triggering Scheduled Daily 09:00 AM Subscriptions & Tasks Check');
    await this.subscriptionsQueue.add('check-subscriptions', {}, { removeOnComplete: true });
    await this.tasksQueue.add('check-task-deadlines', {}, { removeOnComplete: true });
  }

  // Automated periodic check every 3 hours during the day
  @Cron('0 */3 * * *')
  async handlePeriodicCron() {
    this.logger.log('⏰ Triggering Periodic 3-hour Subscriptions & Tasks Check');
    await this.subscriptionsQueue.add('check-subscriptions', {}, { removeOnComplete: true });
    await this.tasksQueue.add('check-task-deadlines', {}, { removeOnComplete: true });
  }

  // Trigger manually on demand (e.g. from UI or API)
  async triggerAllChecksNow() {
    this.logger.log('⚡ Manual trigger: Subscriptions and Tasks queue jobs created');
    const subJob = await this.subscriptionsQueue.add('check-subscriptions', {}, { removeOnComplete: true });
    const taskJob = await this.tasksQueue.add('check-task-deadlines', {}, { removeOnComplete: true });
    return {
      success: true,
      message: 'Фоновые задачи проверки подписок и дедлайнов успешно отправлены в очередь Bull!',
      jobs: {
        subscriptionsJobId: subJob.id,
        tasksJobId: taskJob.id,
      },
    };
  }
}
