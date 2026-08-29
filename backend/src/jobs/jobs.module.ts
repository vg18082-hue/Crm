import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionProcessor } from './processors/subscription.processor';
import { TaskProcessor } from './processors/task.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { CronService } from './cron.service';
import { JobsController } from './jobs.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
          try {
            const urlObj = new URL(redisUrl);
            return {
              redis: {
                host: urlObj.hostname,
                port: Number(urlObj.port) || 6379,
                password: urlObj.password || undefined,
                tls: urlObj.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
              },
            };
          } catch (e) {
            // fallback
          }
        }

        return {
          redis: {
            host: process.env.REDIS_HOST || 'redis',
            port: Number(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: 'subscriptions' },
      { name: 'tasks' },
      { name: 'notifications' },
    ),
    PrismaModule,
    NotificationsModule,
  ],
  controllers: [JobsController],
  providers: [
    CronService,
    SubscriptionProcessor,
    TaskProcessor,
    NotificationProcessor,
  ],
  exports: [BullModule, CronService],
})
export class JobsModule {}
