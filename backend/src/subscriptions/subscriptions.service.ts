import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientSubscriptionDto } from './dto/create-client-subscription.dto';
import { RecordSubscriptionPaymentDto } from './dto/record-subscription-payment.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateClientSubscriptionDto) {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const nextPaymentDate = new Date(dto.nextPaymentDate);

    return this.prisma.clientSubscription.create({
      data: {
        clientId: dto.clientId,
        planName: dto.planName,
        amount: dto.amount,
        periodMonths: dto.periodMonths || 1,
        startDate,
        nextPaymentDate,
        status: dto.status || SubscriptionStatus.ACTIVE,
        paymentMethod: dto.paymentMethod || 'CASH',
        assignedToId: dto.assignedToId,
        comment: dto.comment,
        tenantId,
      },
      include: {
        client: true,
      },
    });
  }

  async findAll(tenantId: string, status?: SubscriptionStatus, search?: string) {
    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { planName: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.clientSubscription.findMany({
      where,
      include: {
        client: true,
      },
      orderBy: { nextPaymentDate: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const sub = await this.prisma.clientSubscription.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
      },
    });

    if (!sub) {
      throw new NotFoundException('Подписка не найдена');
    }

    return sub;
  }

  async recordPayment(tenantId: string, id: string, dto: RecordSubscriptionPaymentDto) {
    const subscription = await this.findOne(tenantId, id);

    const paidAmount = dto.amount !== undefined ? dto.amount : Number(subscription.amount);
    const now = new Date();

    // Advance next payment date by periodMonths
    const newNextPaymentDate = new Date(subscription.nextPaymentDate);
    newNextPaymentDate.setMonth(newNextPaymentDate.getMonth() + (subscription.periodMonths || 1));

    return this.prisma.$transaction(async (tx) => {
      // 1. Register payment record
      await tx.payment.create({
        data: {
          amount: paidAmount,
          paymentMethod: dto.paymentMethod || subscription.paymentMethod || 'CASH',
          status: 'PAID',
          clientId: subscription.clientId,
          comment: dto.comment || `Оплата подписки (${subscription.planName})`,
          tenantId,
        },
      });

      // 2. Update Subscription status to ACTIVE & update dates
      const updatedSub = await tx.clientSubscription.update({
        where: { id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          actualPaymentDate: now,
          nextPaymentDate: newNextPaymentDate,
          paymentMethod: dto.paymentMethod || subscription.paymentMethod,
        },
        include: {
          client: true,
        },
      });

      return updatedSub;
    });
  }

  async updateStatus(tenantId: string, id: string, status: SubscriptionStatus) {
    await this.findOne(tenantId, id);

    return this.prisma.clientSubscription.update({
      where: { id },
      data: { status },
      include: { client: true },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.clientSubscription.delete({
      where: { id },
      select: { id: true },
    });
  }
}
