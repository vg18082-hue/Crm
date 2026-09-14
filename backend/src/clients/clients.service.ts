import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateClientDto) {
    const data: any = {
      ...dto,
      tenantId,
    };

    // Clean up empty optional fields
    if (!data.assignedToId || typeof data.assignedToId !== 'string' || data.assignedToId.trim() === '') {
      delete data.assignedToId;
    } else {
      // Verify user exists and belongs to this tenant
      const userExists = await this.prisma.user.findFirst({
        where: { id: data.assignedToId, tenantId },
      });
      if (!userExists) {
        delete data.assignedToId;
      }
    }

    return this.prisma.client.create({
      data,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findAll(tenantId: string, search?: string) {
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telegram: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.client.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            leads: true,
            sales: true,
            orders: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        leads: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        sales: {
          include: { saleItems: true, payments: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        orders: {
          include: { orderItems: true, payments: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 10,
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }

    return client;
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto) {
    await this.findOne(tenantId, id);

    const data: any = { ...dto };
    if (data.assignedToId === '' || data.assignedToId === null) {
      data.assignedToId = null;
    } else if (data.assignedToId) {
      const userExists = await this.prisma.user.findFirst({
        where: { id: data.assignedToId, tenantId },
      });
      if (!userExists) {
        data.assignedToId = null;
      }
    }

    return this.prisma.client.update({
      where: { id },
      data,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.client.delete({
      where: { id },
      select: { id: true },
    });
  }
}
