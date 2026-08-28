import { Injectable, NotFoundException } from '@nestjs/common';
import { SaleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePaymentDto) {
    let resolvedClientId = dto.clientId;

    // If saleId provided, resolve clientId and update sale status if fully paid
    if (dto.saleId && !resolvedClientId) {
      const sale = await this.prisma.sale.findFirst({ where: { id: dto.saleId, tenantId } });
      if (sale) resolvedClientId = sale.clientId;
    }

    // If orderId provided, resolve clientId
    if (dto.orderId && !resolvedClientId) {
      const order = await this.prisma.order.findFirst({ where: { id: dto.orderId, tenantId } });
      if (order) resolvedClientId = order.clientId;
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          amount: dto.amount,
          paymentMethod: dto.paymentMethod || 'CASH',
          status: dto.status || SaleStatus.PAID,
          saleId: dto.saleId,
          orderId: dto.orderId,
          clientId: resolvedClientId,
          comment: dto.comment,
          tenantId,
        },
        include: {
          client: true,
          sale: true,
          order: true,
        },
      });

      // Automatically reduce client debt if payment status is PAID and client exists
      if (payment.status === SaleStatus.PAID && resolvedClientId) {
        await tx.client.update({
          where: { id: resolvedClientId },
          data: {
            debt: { decrement: dto.amount },
          },
        });
      }

      // If saleId exists and status is PAID, check if total payments cover sale amount
      if (dto.saleId) {
        const sale = await tx.sale.findUnique({
          where: { id: dto.saleId },
          include: { payments: true },
        });

        if (sale) {
          const totalPaid = sale.payments
            .filter((p) => p.status === SaleStatus.PAID)
            .reduce((sum, p) => sum + Number(p.amount), 0);

          if (totalPaid >= Number(sale.amount)) {
            await tx.sale.update({
              where: { id: sale.id },
              data: { status: SaleStatus.PAID },
            });
          }
        }
      }

      return payment;
    });
  }

  async findAll(tenantId: string, clientId?: string) {
    const where: any = { tenantId };
    if (clientId) {
      where.clientId = clientId;
    }

    return this.prisma.payment.findMany({
      where,
      include: {
        client: true,
        sale: true,
        order: true,
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        sale: true,
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    return payment;
  }
}
