import { Injectable, NotFoundException } from '@nestjs/common';
import { SaleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateSaleDto) {
    const items = dto.items || [];

    // Calculate total amount from items if items provided
    let calculatedAmount = 0;
    const preparedItems = items.map((item) => {
      const itemDiscount = item.discount || 0;
      const total = item.quantity * item.price - itemDiscount;
      calculatedAmount += total;
      return {
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        discount: itemDiscount,
        total: total > 0 ? total : 0,
      };
    });

    const saleDiscount = dto.discount || 0;
    const finalAmount = calculatedAmount - saleDiscount > 0 ? calculatedAmount - saleDiscount : 0;

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          clientId: dto.clientId,
          leadId: dto.leadId,
          amount: finalAmount,
          discount: saleDiscount,
          status: dto.status || SaleStatus.PENDING,
          paymentMethod: dto.paymentMethod || 'CASH',
          comment: dto.comment,
          assignedToId: dto.assignedToId,
          tenantId,
          saleItems: {
            create: preparedItems,
          },
        },
        include: {
          client: true,
          lead: true,
          assignedTo: { select: { id: true, name: true, email: true } },
          saleItems: { include: { product: true } },
          payments: true,
        },
      });

      // Update client debt if sale status is PENDING
      if (sale.status === SaleStatus.PENDING) {
        await tx.client.update({
          where: { id: dto.clientId },
          data: {
            debt: { increment: finalAmount },
          },
        });
      }

      return sale;
    });
  }

  async findAll(tenantId: string, status?: SaleStatus, clientId?: string) {
    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    return this.prisma.sale.findMany({
      where,
      include: {
        client: true,
        lead: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        saleItems: { include: { product: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        lead: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        saleItems: { include: { product: true } },
        payments: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Продажа не найдена');
    }

    return sale;
  }

  async update(tenantId: string, id: string, dto: UpdateSaleDto) {
    const existing = await this.findOne(tenantId, id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.sale.update({
        where: { id },
        data: dto,
        include: {
          client: true,
          lead: true,
          assignedTo: { select: { id: true, name: true, email: true } },
          saleItems: true,
          payments: true,
        },
      });

      // If status changed to PAID from PENDING, reduce client debt
      if (existing.status === SaleStatus.PENDING && dto.status === SaleStatus.PAID) {
        await tx.client.update({
          where: { id: existing.clientId },
          data: {
            debt: { decrement: existing.amount },
          },
        });
      }

      return updated;
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.sale.delete({
      where: { id },
      select: { id: true },
    });
  }
}
