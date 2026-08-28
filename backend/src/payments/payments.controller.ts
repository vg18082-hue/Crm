import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenantId } from '../auth/decorators/current-tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments (Оплаты)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Зарегистрировать новый платеж' })
  create(
    @CurrentTenantId() tenantId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'История платежей' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Фильтр по клиенту' })
  findAll(
    @CurrentTenantId() tenantId: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.paymentsService.findAll(tenantId, clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Информация о платеже' })
  findOne(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.paymentsService.findOne(tenantId, id);
  }
}
