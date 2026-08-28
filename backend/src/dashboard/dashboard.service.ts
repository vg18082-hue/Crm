import { Injectable } from '@nestjs/common';
import { LeadStatus, SaleStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMainDashboard(tenantId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      salesTodayRaw,
      salesMonthRaw,
      clientsCount,
      leadsCount,
      newOrdersCount,
      pendingSalesCount,
      clientsDebtRaw,
      leadSourcesRaw,
      leadsTotal,
      leadsWon,
      salesByManagerRaw,
      last7DaysSalesRaw,
    ] = await Promise.all([
      // Sales today (amount sum)
      this.prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: startOfToday }, status: SaleStatus.PAID },
        _sum: { amount: true },
      }),
      // Sales this month (amount sum)
      this.prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: startOfMonth }, status: SaleStatus.PAID },
        _sum: { amount: true },
      }),
      // Clients count
      this.prisma.client.count({ where: { tenantId } }),
      // New leads count this month
      this.prisma.lead.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
      // New orders count
      this.prisma.order.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
      // Pending sales
      this.prisma.sale.count({ where: { tenantId, status: SaleStatus.PENDING } }),
      // Total debt
      this.prisma.client.aggregate({
        where: { tenantId },
        _sum: { debt: true },
      }),
      // Lead sources
      this.prisma.lead.groupBy({
        by: ['source'],
        where: { tenantId },
        _count: { id: true },
      }),
      // Total leads
      this.prisma.lead.count({ where: { tenantId } }),
      // Won leads
      this.prisma.lead.count({ where: { tenantId, status: LeadStatus.WON } }),
      // Sales by manager
      this.prisma.sale.groupBy({
        by: ['assignedToId'],
        where: { tenantId, status: SaleStatus.PAID },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Sales last 7 days
      this.prisma.sale.findMany({
        where: {
          tenantId,
          createdAt: { gte: sevenDaysAgo },
          status: SaleStatus.PAID,
        },
        select: { createdAt: true, amount: true },
      }),
    ]);

    const salesToday = Number(salesTodayRaw._sum.amount || 0);
    const salesMonth = Number(salesMonthRaw._sum.amount || 0);
    const totalDebt = Number(clientsDebtRaw._sum.debt || 0);
    const conversionRate = leadsTotal > 0 ? Number(((leadsWon / leadsTotal) * 100).toFixed(1)) : 0;

    // Group real sales by dates for last 7 days
    const daysMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      daysMap.set(key, 0);
    }

    last7DaysSalesRaw.forEach((sale) => {
      const key = new Date(sale.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      if (daysMap.has(key)) {
        daysMap.set(key, (daysMap.get(key) || 0) + Number(sale.amount));
      }
    });

    const salesByDate = Array.from(daysMap.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));

    // Format lead sources
    const leadSources = leadSourcesRaw.map((s) => ({
      source: s.source || 'Не указан',
      count: s._count.id,
    }));

    // Resolve manager names for sales by manager
    const managerIds = salesByManagerRaw.map((m) => m.assignedToId).filter(Boolean) as string[];
    const managers = await this.prisma.user.findMany({
      where: { id: { in: managerIds } },
      select: { id: true, name: true },
    });
    const managerMap = new Map(managers.map((m) => [m.id, m.name]));

    const salesByManager = salesByManagerRaw.map((m) => ({
      managerId: m.assignedToId,
      managerName: m.assignedToId ? managerMap.get(m.assignedToId) || 'Неизвестный' : 'Не назначен',
      totalSalesAmount: Number(m._sum.amount || 0),
      salesCount: m._count.id,
    }));

    return {
      kpi: {
        salesToday,
        salesMonth,
        clientsCount,
        leadsCount,
        newOrdersCount,
        pendingSalesCount,
        totalDebt,
        conversionRate,
      },
      salesByDate,
      leadSources,
      salesByManager,
    };
  }

  async getSubscriptionsDashboard(tenantId: string) {
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      activeSubs,
      dueSoonSubs,
      overdueSubs,
      receivedThisMonthRaw,
      revenueByPlanRaw,
      subsList,
    ] = await Promise.all([
      // Active subscriptions
      this.prisma.clientSubscription.findMany({
        where: { tenantId, status: SubscriptionStatus.ACTIVE },
      }),
      // Due soon (within 7 days)
      this.prisma.clientSubscription.findMany({
        where: { tenantId, nextPaymentDate: { lte: in7Days, gte: now } },
      }),
      // Overdue
      this.prisma.clientSubscription.findMany({
        where: { tenantId, nextPaymentDate: { lt: now }, status: { not: SubscriptionStatus.CANCELLED } },
      }),
      // Payments received this month
      this.prisma.payment.aggregate({
        where: { tenantId, createdAt: { gte: startOfMonth }, status: SaleStatus.PAID },
        _sum: { amount: true },
      }),
      // Revenue by plan
      this.prisma.clientSubscription.groupBy({
        by: ['planName'],
        where: { tenantId },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // All subscriptions overview
      this.prisma.clientSubscription.findMany({
        where: { tenantId },
        include: { client: { select: { id: true, name: true, phone: true } } },
        orderBy: { nextPaymentDate: 'asc' },
        take: 20,
      }),
    ]);

    const activeCount = activeSubs.length;
    const activeAmountSum = activeSubs.reduce((sum, s) => sum + Number(s.amount), 0);

    const dueSoonCount = dueSoonSubs.length;
    const dueSoonAmountSum = dueSoonSubs.reduce((sum, s) => sum + Number(s.amount), 0);

    const overdueCount = overdueSubs.length;
    const overdueAmountSum = overdueSubs.reduce((sum, s) => sum + Number(s.amount), 0);

    const receivedThisMonth = Number(receivedThisMonthRaw._sum.amount || 0);

    const revenueByPlan = revenueByPlanRaw.map((p) => ({
      planName: p.planName,
      totalAmount: Number(p._sum.amount || 0),
      subscriptionsCount: p._count.id,
    }));

    return {
      kpi: {
        activeCount,
        activeAmountSum,
        dueSoonCount,
        dueSoonAmountSum,
        overdueCount,
        overdueAmountSum,
        expectedThisMonthSum: activeAmountSum,
        receivedThisMonth,
      },
      revenueByPlan,
      subscriptions: subsList,
    };
  }
}
