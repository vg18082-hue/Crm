import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateTaskDto) {
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;

    return this.prisma.task.create({
      data: {
        title: dto.title,
        comment: dto.comment,
        type: dto.type || 'OTHER',
        priority: dto.priority || 'MEDIUM',
        status: dto.status || TaskStatus.TODO,
        dueDate,
        assignedToId: dto.assignedToId,
        clientId: dto.clientId,
        leadId: dto.leadId,
        tenantId,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        client: true,
        lead: true,
      },
    });
  }

  async findAll(
    tenantId: string,
    status?: TaskStatus,
    assignedToId?: string,
    overdueOnly?: boolean,
  ) {
    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (overdueOnly) {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] };
    }

    return this.prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        client: true,
        lead: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, tenantId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        client: true,
        lead: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    return task;
  }

  async update(tenantId: string, id: string, dto: UpdateTaskDto) {
    await this.findOne(tenantId, id);

    const dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;

    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        client: true,
        lead: true,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.task.delete({
      where: { id },
      select: { id: true },
    });
  }
}
