import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentTenantId } from '../auth/decorators/current-tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard (Аналитические Дашборды)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('main')
  @ApiOperation({ summary: 'Главный аналитический дашборд (Продажи, лиды, долги, конверсия, менеджеры)' })
  getMainDashboard(@CurrentTenantId() tenantId: string) {
    return this.dashboardService.getMainDashboard(tenantId);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Дашборд модуля подписок (Активные, скоро оплата, просроченные, доход по тарифам)' })
  getSubscriptionsDashboard(@CurrentTenantId() tenantId: string) {
    return this.dashboardService.getSubscriptionsDashboard(tenantId);
  }
}
