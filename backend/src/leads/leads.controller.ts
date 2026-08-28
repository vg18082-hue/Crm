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
import { LeadStatus } from '@prisma/client';
import { CurrentTenantId } from '../auth/decorators/current-tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('Leads (Воронка лидов)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать нового лида' })
  create(
    @CurrentTenantId() tenantId: string,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leadsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список лидов (с фильтром по статусу и поиску)' })
  @ApiQuery({ name: 'status', enum: LeadStatus, required: false, description: 'Фильтр по этапу воронки' })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по имени, телефону, компании' })
  findAll(
    @CurrentTenantId() tenantId: string,
    @Query('status') status?: LeadStatus,
    @Query('search') search?: string,
  ) {
    return this.leadsService.findAll(tenantId, status, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Карточка лида по ID' })
  findOne(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.leadsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить лида (этап воронки, сумма, следующий контакт)' })
  update(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(tenantId, id, dto);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Быстрая конвертация лида в Клиента и Сделку (Статус -> WON)' })
  convert(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.leadsService.convertToClientAndSale(tenantId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить лида' })
  remove(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.leadsService.remove(tenantId, id);
  }
}
