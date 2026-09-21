import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

  @Get('api/sync-db')
  async syncDb(): Promise<object> {
    try {
      const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss');
      return {
        success: true,
        message: 'Prisma DB Push executed successfully',
        stdout,
        stderr,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  }
}
