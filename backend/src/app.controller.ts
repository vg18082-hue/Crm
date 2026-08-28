import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): object {
    return this.appService.getStatus();
  }

  @Get('health')
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        postgres: {
          host: process.env.POSTGRES_HOST || 'postgres',
          port: process.env.POSTGRES_PORT || 5432,
          database: process.env.POSTGRES_DB || 'crm_db',
        },
        redis: {
          host: process.env.REDIS_HOST || 'redis',
          port: process.env.REDIS_PORT || 6379,
        },
      },
    };
  }
}
