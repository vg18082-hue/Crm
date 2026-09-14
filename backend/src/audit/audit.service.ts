import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    tenantId: string,
    action: string,
    entity: string,
    entityId?: string,
    userId?: string,
    details?: any,
  ) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action,
          entity,
          entityId,
          details: details ? details : undefined,
        },
      });
    } catch (err) {
      // Don't fail business operations if audit logging fails
      console.error('Failed to write audit log:', err);
    }
  }

  async findAll(tenantId: string, entity?: string, action?: string, limit: number = 50) {
    const where: any = { tenantId };
    if (entity) where.entity = entity;
    if (action) where.action = action;

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
