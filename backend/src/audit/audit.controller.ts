import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenantId } from '../auth/decorators/current-tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AuditService } from './audit.service';

@ApiTags('Audit Logs (Журнал действий)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER_HEAD)
  @ApiOperation({ summary: 'Получить журнал действий пользователей (Только ADMIN/MANAGER_HEAD)' })
  @ApiQuery({ name: 'entity', required: false, description: 'Фильтр по сущности (Client, Lead, Sale, etc.)' })
  @ApiQuery({ name: 'action', required: false, description: 'Фильтр по действию (CREATE, UPDATE, DELETE, etc.)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentTenantId() tenantId: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findAll(tenantId, entity, action, limit ? Number(limit) : 50);
  }
}
