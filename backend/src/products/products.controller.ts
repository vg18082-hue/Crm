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
import { ProductType } from '@prisma/client';
import { CurrentTenantId } from '../auth/decorators/current-tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products & Services (Товары и Услуги)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Добавить товар или услугу' })
  create(
    @CurrentTenantId() tenantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Каталог товаров и услуг' })
  @ApiQuery({ name: 'type', enum: ProductType, required: false, description: 'Тип: PRODUCT или SERVICE' })
  @ApiQuery({ name: 'category', required: false, description: 'Категория' })
  @ApiQuery({ name: 'search', required: false, description: 'Поиск по названию, SKU, категории' })
  findAll(
    @CurrentTenantId() tenantId: string,
    @Query('type') type?: ProductType,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll(tenantId, type, category, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить товар/услугу по ID' })
  findOne(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.productsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить товар/услугу' })
  update(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить товар/услугу' })
  remove(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.productsService.remove(tenantId, id);
  }
}
