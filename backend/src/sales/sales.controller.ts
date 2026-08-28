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
import { SaleStatus } from '@prisma/client';
import { CurrentTenantId } from '../auth/decorators/current-tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SalesService } from './sales.service';

@ApiTags('Sales (Продажи)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Оформить продажу со списком товаров/услуг' })
  create(
    @CurrentTenantId() tenantId: string,
    @Body() dto: CreateSaleDto,
  ) {
    return this.salesService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список всех продаж компании' })
  @ApiQuery({ name: 'status', enum: SaleStatus, required: false })
  @ApiQuery({ name: 'clientId', required: false })
  findAll(
    @CurrentTenantId() tenantId: string,
    @Query('status') status?: SaleStatus,
    @Query('clientId') clientId?: string,
  ) {
    return this.salesService.findAll(tenantId, status, clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Просмотр информации о продаже' })
  findOne(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.salesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить статус или данные продажи' })
  update(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSaleDto,
  ) {
    return this.salesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить продажу' })
  remove(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.salesService.remove(tenantId, id);
  }
}
