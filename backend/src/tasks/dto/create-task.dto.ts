import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Перезвонить клиенту по поводу договора' })
  @IsString({ message: 'Заголовок задачи должен быть строкой' })
  @IsNotEmpty({ message: 'Заголовок задачи обязателен' })
  title: string;

  @ApiPropertyOptional({ example: 'Уточнить скидку на объем' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
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
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @ValidateIf((o) => !!o.dueDate)
  @IsDateString({}, { message: 'Некорректный формат срока выполнения' })
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'ID ответственного сотрудника' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'ID связанного клиента' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'ID связанного лида' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  @IsOptional()
  leadId?: string;
}
