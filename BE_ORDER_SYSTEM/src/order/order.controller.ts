import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderDto, CreateOrderItemDto, CreateOrderByQrCodeDto } from './order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Public()
  @Post('by-qrcode/:qrCode')
  createByQrCode(@Param('qrCode') qrCode: string, @Body() createOrderByQrCodeDto: CreateOrderByQrCodeDto) {
    return this.orderService.createByQrCode(qrCode, createOrderByQrCodeDto);
  }

  @Post()
  @Roles(UserRole.customer, UserRole.service)
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.manager, UserRole.service, UserRole.kitchen)
  findAll() {
    return this.orderService.findAll();
  }

  @Public()
  @Get('by-qrcode/:qrCode')
  findByQrCode(@Param('qrCode') qrCode: string) {
    return this.orderService.findByQrCode(qrCode);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.manager, UserRole.service, UserRole.kitchen, UserRole.customer)
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.manager, UserRole.service, UserRole.kitchen)
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.manager)
  remove(@Param('id') id: string) {
    return this.orderService.remove(id);
  }

  @Post(':id/items')
  @Roles(UserRole.customer, UserRole.service)
  addOrderItem(@Param('id') id: string, @Body() createOrderItemDto: CreateOrderItemDto) {
    return this.orderService.addOrderItem({ ...createOrderItemDto, orderId: id });
  }

  @Public()
  @Patch(':id/items/:itemId')
  updateOrderItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() body: { quantity?: number; note?: string; details?: any }) {
    return this.orderService.updateOrderItem(id, itemId, body);
  }

  @Public()
  @Delete(':id/items/:itemId')
  deleteOrderItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.orderService.deleteOrderItem(id, itemId);
  }
}