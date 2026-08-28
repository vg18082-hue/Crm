import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';
import { CurrentTenantId } from '../auth/decorators/current-tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateClientSubscriptionDto } from './dto/create-client-subscription.dto';
import { RecordSubscriptionPaymentDto } from './dto/record-subscription-payment.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions (Абонентские платежи и подписки)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать регулярную подписку для клиента' })
  create(
    @CurrentTenantId() tenantId: string,
    @Body() dto: CreateClientSubscriptionDto,
  ) {
    return this.subscriptionsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список подписок с фильтрацией' })
  @ApiQuery({ name: 'status', enum: SubscriptionStatus, required: false })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по клиенту или тарифу' })
  findAll(
    @CurrentTenantId() tenantId: string,
    @Query('status') status?: SubscriptionStatus,
    @Query('search') search?: string,
  ) {
    return this.subscriptionsService.findAll(tenantId, status, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить информацию о подписке' })
  findOne(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.findOne(tenantId, id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Зафиксировать оплату подписки (Статус -> ACTIVE, смещение nextPaymentDate на следующий период)' })
  recordPayment(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: RecordSubscriptionPaymentDto,
  ) {
    return this.subscriptionsService.recordPayment(tenantId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Изменить статус подписки (ACTIVE, PAUSED, CANCELLED, OVERDUE)' })
  updateStatus(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body('status') status: SubscriptionStatus,
  ) {
    return this.subscriptionsService.updateStatus(tenantId, id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить подписку' })
  remove(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.remove(tenantId, id);
  }
}
