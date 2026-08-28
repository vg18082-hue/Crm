import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): object {
    return {
      message: 'CRM NestJS API is running',
      version: '1.0.0',
    };
  }
}
