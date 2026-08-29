import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CronService } from './cron.service';

@ApiTags('Jobs & Queues (Очереди Bull и Cron фоновые задачи)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly cronService: CronService) {}

  @Post('trigger-cron-now')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Запустить проверку подписок и дедлайнов в очереди немедленно (Только Администратор)' })
  triggerCronNow() {
    return this.cronService.triggerAllChecksNow();
  }
}
