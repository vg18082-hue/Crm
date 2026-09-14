import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Внутренняя ошибка сервера';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message || exception.message;
        error = resObj.error || exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[]) || [];
          const fieldNames = target.join(', ');
          message = fieldNames
            ? `Запись с такими данными (${fieldNames}) уже существует в системе`
            : 'Запись с такими уникальными данными уже существует';
          error = 'Conflict';
          break;
        }
        case 'P2003': {
          status = HttpStatus.BAD_REQUEST;
          const fieldName = (exception.meta?.field_name as string) || '';
          message = fieldName
            ? `Связанный объект (${fieldName}) не найден в базе данных или был удален`
            : 'Выбранный связанный объект (сотрудник, клиент или товар) не существует';
          error = 'Bad Request';
          break;
        }
        case 'P2025': {
          status = HttpStatus.NOT_FOUND;
          message = 'Запрашиваемая запись не найдена';
          error = 'Not Found';
          break;
        }
        case 'P2000': {
          status = HttpStatus.BAD_REQUEST;
          message = 'Введенное значение превышает максимально допустимую длину';
          error = 'Bad Request';
          break;
        }
        default: {
          status = HttpStatus.BAD_REQUEST;
          message = `Ошибка базы данных (${exception.code}): ${exception.message.split('\n').pop() || ''}`;
          error = 'Database Error';
          break;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      message = exception.message || 'Внутренняя ошибка сервера';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
