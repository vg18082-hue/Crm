import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Перезвонить клиенту по поводу договора' })
  @IsString()
  @IsNotEmpty({ message: 'Заголовок задачи обязателен' })
  title: string;

  @ApiPropertyOptional({ example: 'Уточнить скидку на объем' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ enum: TaskType, default: TaskType.CALL })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ example: '2026-08-25T15:00:00.000Z', description: 'Срок выполнения (дедлайн)' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'ID ответственного сотрудника' })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'ID связанного клиента' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'ID связанного лида' })
  @IsString()
  @IsOptional()
  leadId?: string;
}
