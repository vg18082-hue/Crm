import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(tenantId: string, dto: CreateOrderDto) {
    const items = dto.items || [];

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

    const orderDiscount = dto.discount || 0;
    const finalAmount = calculatedAmount - orderDiscount > 0 ? calculatedAmount - orderDiscount : 0;
    const orderNumber = dto.orderNumber || `ORD-${Date.now().toString().slice(-6)}`;
    const completionDate = dto.completionDate ? new Date(dto.completionDate) : undefined;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        clientId: dto.clientId,
        amount: finalAmount,
        discount: orderDiscount,
        status: dto.status || OrderStatus.PENDING,
        paymentMethod: dto.paymentMethod || 'CASH',
        completionDate,
        comment: dto.comment,
        assignedToId: dto.assignedToId,
        tenantId,
        orderItems: {
          create: preparedItems,
        },
      },
      include: {
        client: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        orderItems: { include: { product: true } },
        payments: true,
      },
    });

    // Send Telegram alert
    const text = `🛍 <b>Новый Заказ #${order.orderNumber}!</b>\n\n` +
      `👤 Клиент: <b>${order.client.name}</b>\n` +
      `💰 Сумма: <b>${Number(order.amount).toLocaleString()} сум</b>\n` +
      `💳 Оплата: ${order.paymentMethod}\n` +
      (order.comment ? `📝 Комментарий: ${order.comment}\n` : '');

    this.notificationsService.sendTelegramMessage(tenantId, text).catch(() => {});

    return order;
  }

  async findAll(tenantId: string, status?: OrderStatus, clientId?: string, search?: string) {
    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.order.findMany({
      where,
      include: {
        client: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        orderItems: { include: { product: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        orderItems: { include: { product: true } },
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    return order;
  }

  async update(tenantId: string, id: string, dto: UpdateOrderDto) {
    await this.findOne(tenantId, id);

    const completionDate = dto.completionDate ? new Date(dto.completionDate) : undefined;

    return this.prisma.order.update({
      where: { id },
      data: {
        ...dto,
        completionDate,
      },
      include: {
        client: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        orderItems: { include: { product: true } },
        payments: true,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.order.delete({
      where: { id },
      select: { id: true },
    });
  }
}
