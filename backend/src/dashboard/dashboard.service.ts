import { Injectable } from '@nestjs/common';
import { LeadStatus, SaleStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMainDashboard(tenantId: string, period: string = '7d') {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let periodStartDate = new Date();
    let daysCount = 7;
    let isMonthlyGrouping = false;

    if (period === 'today') {
      periodStartDate = startOfToday;
      daysCount = 1;
    } else if (period === '30d') {
      periodStartDate.setDate(periodStartDate.getDate() - 29);
      periodStartDate.setHours(0, 0, 0, 0);
      daysCount = 30;
    } else if (period === 'month') {
      periodStartDate = startOfMonth;
      const currentDay = now.getDate();
      daysCount = currentDay;
    } else if (period === 'year') {
      periodStartDate = new Date(now.getFullYear(), 0, 1);
      isMonthlyGrouping = true;
    } else {
      // 7d default
      periodStartDate.setDate(periodStartDate.getDate() - 6);
      periodStartDate.setHours(0, 0, 0, 0);
      daysCount = 7;
    }

    const [
      salesTodayRaw,
      salesMonthRaw,
      salesPeriodRaw,
      clientsCount,
      leadsCount,
      newOrdersCount,
      pendingSalesCount,
      clientsDebtRaw,
      leadSourcesRaw,
      leadsTotal,
      leadsWon,
      salesByManagerRaw,
      periodSalesRaw,
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
      // Sales in chosen period
      this.prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: periodStartDate }, status: SaleStatus.PAID },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Clients count
      this.prisma.client.count({ where: { tenantId } }),
      // New leads count in period
      this.prisma.lead.count({ where: { tenantId, createdAt: { gte: periodStartDate } } }),
      // New orders count in period
      this.prisma.order.count({ where: { tenantId, createdAt: { gte: periodStartDate } } }),
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
        where: { tenantId, status: SaleStatus.PAID, createdAt: { gte: periodStartDate } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Sales in period list
      this.prisma.sale.findMany({
        where: {
          tenantId,
          createdAt: { gte: periodStartDate },
          status: SaleStatus.PAID,
        },
        select: { createdAt: true, amount: true },
      }),
    ]);

    const salesToday = Number(salesTodayRaw._sum.amount || 0);
    const salesMonth = Number(salesMonthRaw._sum.amount || 0);
    const salesPeriod = Number(salesPeriodRaw._sum.amount || 0);
    const salesPeriodCount = Number(salesPeriodRaw._count.id || 0);
    const totalDebt = Number(clientsDebtRaw._sum.debt || 0);
    const conversionRate = leadsTotal > 0 ? Number(((leadsWon / leadsTotal) * 100).toFixed(1)) : 0;

    // Build timeline for chart
    const dateMap = new Map<string, number>();

    if (isMonthlyGrouping) {
      const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
      for (let m = 0; m <= now.getMonth(); m++) {
        dateMap.set(months[m], 0);
      }
      periodSalesRaw.forEach((sale) => {
        const mIndex = new Date(sale.createdAt).getMonth();
        const mName = months[mIndex];
        if (dateMap.has(mName)) {
          dateMap.set(mName, (dateMap.get(mName) || 0) + Number(sale.amount));
        }
      });
    } else {
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        dateMap.set(key, 0);
      }
      periodSalesRaw.forEach((sale) => {
        const key = new Date(sale.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        if (dateMap.has(key)) {
          dateMap.set(key, (dateMap.get(key) || 0) + Number(sale.amount));
        }
      });
    }

    const salesByDate = Array.from(dateMap.entries()).map(([date, amount]) => ({
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
      managerName: m.assignedToId ? managerMap.get(m.assignedToId) || 'Неизвестный' : 'Общие продажи',
      totalSalesAmount: Number(m._sum.amount || 0),
      salesCount: m._count.id,
    }));

    return {
      kpi: {
        salesToday,
        salesMonth,
        salesPeriod,
        salesPeriodCount,
        clientsCount,
        leadsCount,
        newOrdersCount,
        pendingSalesCount,
        totalDebt,
        conversionRate,
      },
      period,
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
      this.prisma.clientSubscription.findMany({
        where: { tenantId, status: SubscriptionStatus.ACTIVE },
      }),
      this.prisma.clientSubscription.findMany({
        where: { tenantId, nextPaymentDate: { lte: in7Days, gte: now } },
      }),
      this.prisma.clientSubscription.findMany({
        where: { tenantId, nextPaymentDate: { lt: now }, status: { not: SubscriptionStatus.CANCELLED } },
      }),
      this.prisma.payment.aggregate({
        where: { tenantId, createdAt: { gte: startOfMonth }, status: SaleStatus.PAID },
        _sum: { amount: true },
      }),
      this.prisma.clientSubscription.groupBy({
        by: ['planName'],
        where: { tenantId },
        _sum: { amount: true },
        _count: { id: true },
      }),
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

  async getFunnelReport(tenantId: string) {
    const stages = [
      { key: LeadStatus.NEW, label: 'Новый' },
      { key: LeadStatus.IN_PROGRESS, label: 'В работе' },
      { key: LeadStatus.NEGOTIATION, label: 'Переговоры' },
      { key: LeadStatus.WON, label: 'Успешно (WON)' },
      { key: LeadStatus.LOST, label: 'Отказ (LOST)' },
    ];

    const counts = await this.prisma.lead.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
      _sum: { potentialAmount: true },
    });

    const countMap = new Map(counts.map((c) => [c.status, { count: c._count.id, amount: Number(c._sum.potentialAmount || 0) }]));
    const totalLeads = counts.reduce((acc, c) => acc + c._count.id, 0);

    const funnel = stages.map((st) => {
      const data = countMap.get(st.key) || { count: 0, amount: 0 };
      return {
        stage: st.key,
        label: st.label,
        count: data.count,
        amount: data.amount,
        percentage: totalLeads > 0 ? Number(((data.count / totalLeads) * 100).toFixed(1)) : 0,
      };
    });

    return {
      totalLeads,
      funnel,
    };
  }

  async getManagersReport(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedLeads: { select: { id: true, status: true, potentialAmount: true } },
        assignedSales: { select: { id: true, amount: true, status: true } },
        assignedOrders: { select: { id: true, amount: true, status: true } },
        tasks: { select: { id: true, status: true } },
      },
    });

    return users.map((u) => {
      const totalLeads = u.assignedLeads.length;
      const wonLeads = u.assignedLeads.filter((l) => l.status === LeadStatus.WON).length;
      const leadConversion = totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(1)) : 0;

      const paidSales = u.assignedSales.filter((s) => s.status === SaleStatus.PAID);
      const totalRevenue = paidSales.reduce((acc, s) => acc + Number(s.amount), 0);
      const avgDealSize = paidSales.length > 0 ? Math.round(totalRevenue / paidSales.length) : 0;

      const completedTasks = u.tasks.filter((t) => t.status === 'COMPLETED').length;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        totalLeads,
        wonLeads,
        leadConversion,
        salesCount: paidSales.length,
        totalRevenue,
        avgDealSize,
        tasksCount: u.tasks.length,
        completedTasks,
      };
    });
  }

  async getProductsReport(tenantId: string) {
    const saleItems = await this.prisma.saleItem.findMany({
      where: { sale: { tenantId, status: SaleStatus.PAID } },
      include: { product: true },
    });

    const map = new Map<string, { name: string; quantity: number; revenue: number; cost: number }>();

    for (const item of saleItems) {
      const key = item.productId || item.name;
      const existing = map.get(key) || {
        name: item.name,
        quantity: 0,
        revenue: 0,
        cost: 0,
      };

      existing.quantity += item.quantity;
      existing.revenue += Number(item.total);
      if (item.product?.costPrice) {
        existing.cost += Number(item.product.costPrice) * item.quantity;
      }
      map.set(key, existing);
    }

    const result = Array.from(map.values()).map((p) => ({
      ...p,
      margin: p.revenue > 0 ? Math.round(p.revenue - p.cost) : 0,
      marginPercent: p.revenue > 0 ? Number((((p.revenue - p.cost) / p.revenue) * 100).toFixed(1)) : 0,
    }));

    return result.sort((a, b) => b.revenue - a.revenue);
  }

  async globalSearch(tenantId: string, query: string) {
    if (!query || query.trim().length < 2) {
      return { clients: [], leads: [], products: [], sales: [], orders: [] };
    }

    const q = query.trim();

    const [clients, leads, products, sales, orders] = await Promise.all([
      this.prisma.client.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { telegram: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, phone: true, email: true, debt: true },
      }),
      this.prisma.lead.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { company: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, phone: true, company: true, status: true, potentialAmount: true },
      }),
      this.prisma.product.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, price: true, sku: true, stock: true },
      }),
      this.prisma.sale.findMany({
        where: {
          tenantId,
          OR: [
            { client: { name: { contains: q, mode: 'insensitive' } } },
            { comment: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, amount: true, status: true, client: { select: { name: true } }, createdAt: true },
      }),
      this.prisma.order.findMany({
        where: {
          tenantId,
          OR: [
            { orderNumber: { contains: q, mode: 'insensitive' } },
            { client: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take: 5,
        select: { id: true, orderNumber: true, amount: true, status: true, client: { select: { name: true } }, createdAt: true },
      }),
    ]);

    return { clients, leads, products, sales, orders };
  }
}
