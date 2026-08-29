import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(tenantId: string, dto: CreateLeadDto) {
    const nextContactDate = dto.nextContactDate ? new Date(dto.nextContactDate) : undefined;

    const lead = await this.prisma.lead.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        company: dto.company,
        source: dto.source,
        interestedIn: dto.interestedIn,
        potentialAmount: dto.potentialAmount,
        comment: dto.comment,
        nextContactDate,
        status: dto.status || LeadStatus.NEW,
        clientId: dto.clientId,
        assignedToId: dto.assignedToId,
        tenantId,
      },
      include: {
        client: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Send Telegram alert if enabled
    const text = `🎯 <b>Новый Лид в CRM!</b>\n\n` +
      `👤 Имя: <b>${lead.name}</b>\n` +
      (lead.phone ? `📞 Телефон: ${lead.phone}\n` : '') +
      (lead.company ? `🏢 Компания: ${lead.company}\n` : '') +
      (lead.source ? `🌐 Источник: ${lead.source}\n` : '') +
      (lead.interestedIn ? `📦 Интерес: ${lead.interestedIn}\n` : '') +
      (lead.potentialAmount ? `💰 Потенциал: ${Number(lead.potentialAmount).toLocaleString()} сум\n` : '');

    this.notificationsService.sendTelegramMessage(tenantId, text).catch(() => {});

    return lead;
  }

  async findAll(tenantId: string, status?: LeadStatus, search?: string) {
    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { interestedIn: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.lead.findMany({
      where,
      include: {
        client: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        sales: {
          include: { saleItems: true, payments: true },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('Лид не найден');
    }

    return lead;
  }

  async update(tenantId: string, id: string, dto: UpdateLeadDto) {
    await this.findOne(tenantId, id);

    const nextContactDate = dto.nextContactDate ? new Date(dto.nextContactDate) : undefined;

    return this.prisma.lead.update({
      where: { id },
      data: {
        ...dto,
        nextContactDate,
      },
      include: {
        client: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async convertToClientAndSale(tenantId: string, id: string) {
    const lead = await this.findOne(tenantId, id);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Client if not already linked
      let client = lead.client;
      if (!client) {
        client = await tx.client.create({
          data: {
            name: lead.company ? `${lead.name} (${lead.company})` : lead.name,
            phone: lead.phone,
            source: lead.source,
            comment: lead.comment,
            assignedToId: lead.assignedToId,
            tenantId,
          },
        });
      }

      // 2. Create Sale
      const saleAmount = lead.potentialAmount || 0;
      const sale = await tx.sale.create({
        data: {
          clientId: client.id,
          leadId: lead.id,
          amount: saleAmount,
          status: 'PENDING',
          assignedToId: lead.assignedToId,
          tenantId,
        },
      });

      // 3. Update Lead Status to WON
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: LeadStatus.WON,
          clientId: client.id,
        },
        include: {
          client: true,
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      return { lead: updatedLead, client, sale };
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.lead.delete({
      where: { id },
      select: { id: true },
    });
  }
}
