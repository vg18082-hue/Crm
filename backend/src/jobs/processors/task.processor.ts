import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Processor('tasks')
export class TaskProcessor {
  private readonly logger = new Logger(TaskProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process('check-task-deadlines')
  async handleTaskDeadlineCheck(job: Job) {
    this.logger.log('Starting automated task deadlines check...');
    const now = new Date();

    const overdueTasks = await this.prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
      },
      include: {
        assignedTo: true,
        client: true,
        tenant: {
          include: { telegramConfig: true },
        },
      },
    });

    this.logger.log(`Found ${overdueTasks.length} overdue tasks.`);

    for (const task of overdueTasks) {
      const tgConfig = task.tenant.telegramConfig;
      if (tgConfig?.isEnabled) {
        const text = `⚠️ <b>Просроченная задача!</b>\n\n` +
          `📌 <b>${task.title}</b>\n` +
          `👤 Ответственный: ${task.assignedTo?.name || 'Не назначен'}\n` +
          (task.client ? `🤝 Клиент: ${task.client.name}\n` : '') +
          `🔥 Приоритет: ${task.priority}\n` +
          `📅 Дедлайн был: ${task.dueDate ? new Date(task.dueDate).toLocaleString('ru-RU') : '—'}`;

        await this.notificationsService.sendTelegramMessage(task.tenantId, text);
      }
    }

    return { overdueTasksCount: overdueTasks.length };
  }
}
