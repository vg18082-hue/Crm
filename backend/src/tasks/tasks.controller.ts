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
import { TaskStatus } from '@prisma/client';
import { CurrentTenantId } from '../auth/decorators/current-tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('Tasks (Задачи)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Создать задачу (звонок, перезвон, встреча и др.)' })
  create(
    @CurrentTenantId() tenantId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список задач с фильтрацией' })
  @ApiQuery({ name: 'status', enum: TaskStatus, required: false })
  @ApiQuery({ name: 'assignedToId', required: false, description: 'Задачи конкретного сотрудника' })
  @ApiQuery({ name: 'overdueOnly', type: Boolean, required: false, description: 'Только просроченные задачи' })
  findAll(
    @CurrentTenantId() tenantId: string,
    @Query('status') status?: TaskStatus,
    @Query('assignedToId') assignedToId?: string,
    @Query('overdueOnly') overdueOnly?: boolean,
  ) {
    return this.tasksService.findAll(tenantId, status, assignedToId, overdueOnly);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Просмотр задачи' })
  findOne(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.tasksService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить статус или параметры задачи' })
  update(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить задачу' })
  remove(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.tasksService.remove(tenantId, id);
  }
}
