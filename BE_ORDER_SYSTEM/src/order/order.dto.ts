import { IsString, IsEnum, IsNumber, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, OrderItemStatus } from '@prisma/client';

export class CreateOrderDto {
  @IsString()
  tableId: string;

  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsNumber()
  totalAmount: number;
}

export class CreateOrderItemInputDto {
  @IsString()
  menuItemId: string;

  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsObject()
  details?: any;

  @IsEnum(OrderItemStatus)
  status: OrderItemStatus;
}

export class CreateOrderByQrCodeDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemInputDto)
  items?: CreateOrderItemInputDto[];
}

export class UpdateOrderDto {
  @IsString()
  tableId?: string;

  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsNumber()
  totalAmount?: number;
}

export class CreateOrderItemDto {
  @IsString()
  orderId: string;

  @IsString()
  menuItemId: string;

  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsObject()
  details?: any;

  @IsEnum(OrderItemStatus)
  status: OrderItemStatus;
}