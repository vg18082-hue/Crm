import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      this.logger.log('Connecting to PostgreSQL database...');
      await this.$connect();
      this.logger.log('Connected to database successfully.');

      await this.ensureSchema();
    } catch (err) {
      this.logger.error('Database connection / init error:', err);
    }
  }

  private async ensureSchema() {
    try {
      await this.$queryRawUnsafe(`SELECT 1 FROM "users" LIMIT 1`);
      this.logger.log('Database tables already exist.');
    } catch (tableCheckError) {
      this.logger.warn('Database tables not found in PostgreSQL. Synchronizing Prisma schema...');
      try {
        const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss');
        this.logger.log(`Prisma db push output: ${stdout}`);
        if (stderr) this.logger.warn(`Prisma db push stderr: ${stderr}`);
        this.logger.log('✅ Database schema synchronized successfully.');
      } catch (pushError: any) {
        this.logger.error('npx prisma db push failed:', pushError?.message || pushError);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
