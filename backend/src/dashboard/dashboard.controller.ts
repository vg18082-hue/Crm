import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenantId } from '../auth/decorators/current-tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard & Reports (Аналитические Дашборды и Отчеты)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('main')
  @ApiOperation({ summary: 'Главный аналитический дашборд (Продажи, лиды, долги, конверсия, менеджеры)' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', '7d', '30d', 'month', 'year'] })
  getMainDashboard(@CurrentTenantId() tenantId: string, @Query('period') period?: string) {
    return this.dashboardService.getMainDashboard(tenantId, period);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Дашборд модуля подписок (Активные, скоро оплата, просроченные, доход по тарифам)' })
  getSubscriptionsDashboard(@CurrentTenantId() tenantId: string) {
    return this.dashboardService.getSubscriptionsDashboard(tenantId);
  }

  @Get('reports/funnel')
  @ApiOperation({ summary: 'Отчет: Воронка продаж и конверсия лидов' })
  getFunnelReport(@CurrentTenantId() tenantId: string) {
    return this.dashboardService.getFunnelReport(tenantId);
  }

  @Get('reports/managers')
  @ApiOperation({ summary: 'Отчет: Эффективность и KPI менеджеров' })
  getManagersReport(@CurrentTenantId() tenantId: string) {
    return this.dashboardService.getManagersReport(tenantId);
  }

  @Get('reports/products')
  @ApiOperation({ summary: 'Отчет: Продажи и маржинальность товаров/услуг' })
  getProductsReport(@CurrentTenantId() tenantId: string) {
    return this.dashboardService.getProductsReport(tenantId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Глобальный быстрый поиск по клиентам, сделкам, товарам, заказам' })
  @ApiQuery({ name: 'q', required: true, description: 'Поисковый запрос' })
  globalSearch(@CurrentTenantId() tenantId: string, @Query('q') query: string) {
    return this.dashboardService.globalSearch(tenantId, query);
  }
}
