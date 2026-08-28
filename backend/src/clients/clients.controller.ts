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
import { CurrentTenantId } from '../auth/decorators/current-tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('Clients (Клиенты)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать клиента' })
  create(
    @CurrentTenantId() tenantId: string,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список клиентов с возможностью поиска' })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по имени, телефону, email, telegram' })
  findAll(
    @CurrentTenantId() tenantId: string,
    @Query('search') search?: string,
  ) {
    return this.clientsService.findAll(tenantId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Карточка клиента (со всеми покупками, лидами, заказами, подписками)' })
  findOne(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.clientsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные клиента' })
  update(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить клиента' })
  remove(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.clientsService.remove(tenantId, id);
  }
}
