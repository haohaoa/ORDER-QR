import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto, CreateOrderItemDto, CreateOrderByQrCodeDto } from './order.dto';
import { Order, Prisma } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const { tableId, ...data } = createOrderDto;
    return this.prisma.order.create({
      data: {
        ...data,
        table: {
          connect: { id: tableId },
        },
      },
      include: {
        table: true,
        items: true,
        payments: true,
      },
    });
  }

  async createByQrCode(qrCode: string, createOrderByQrCodeDto: CreateOrderByQrCodeDto): Promise<Order> {
    const table = await this.prisma.table.findFirst({ where: { qrCode } });
    if (!table) {
      throw new NotFoundException(`Không tìm thấy bàn với mã QR ${qrCode}`);
    }

    const { items, ...data } = createOrderByQrCodeDto;
    return this.prisma.order.create({
      data: {
        ...data,
        table: {
          connect: { id: table.id },
        },
        items: items?.length
          ? {
              create: items.map((item) => ({
                menuItem: {
                  connect: { id: item.menuItemId },
                },
                name: item.name,
                price: new Prisma.Decimal(item.price.toString()),
                quantity: item.quantity,
                note: item.note,
                details: item.details,
                status: item.status,
              })),
            }
          : undefined,
      },
      include: {
        table: true,
        items: true,
        payments: true,
      },
    });
  }

  async findAll(): Promise<Order[]> {
    return this.prisma.order.findMany({
      include: {
        table: true,
        items: true,
        payments: true,
      },
    });
  }

  async findByQrCode(qrCode: string): Promise<Order[]> {
    const table = await this.prisma.table.findFirst({ where: { qrCode } });
    if (!table) {
      throw new NotFoundException(`Không tìm thấy bàn với mã QR ${qrCode}`);
    }

    return this.prisma.order.findMany({
      where: {
        tableId: table.id,
        status: {
          in: ['pending', 'preparing'],
        },
      },
      include: {
        table: true,
        items: {
          include: {
            menuItem: {
              include: {
                images: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        items: true,
        payments: true,
      },
    });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${id}`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const { tableId, ...data } = updateOrderDto;
    return this.prisma.order.update({
      where: { id },
      data: {
        ...data,
        table: tableId ? {
          connect: { id: tableId },
        } : undefined,
      },
      include: {
        table: true,
        items: true,
        payments: true,
      },
    });
  }

  async remove(id: string): Promise<Order> {
    return this.prisma.order.delete({
      where: { id },
    });
  }

  async addOrderItem(createOrderItemDto: CreateOrderItemDto) {
    const { orderId, menuItemId, ...data } = createOrderItemDto;
    return this.prisma.orderItem.create({
      data: {
        ...data,
        order: {
          connect: { id: orderId },
        },
        menuItem: {
          connect: { id: menuItemId },
        },
      },
    });
  }

  async updateOrderItem(orderId: string, itemId: string, data: { quantity?: number; note?: string; details?: any }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${orderId}`);
    }

    if (order.status !== 'pending') {
      throw new BadRequestException('Chỉ có thể sửa món khi đơn hàng chưa được xác nhận');
    }

    const item = await this.prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!item || item.orderId !== orderId) {
      throw new NotFoundException(`Không tìm thấy món trong đơn hàng ${orderId}`);
    }

    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data,
    });

    const orderItems = await this.prisma.orderItem.findMany({ where: { orderId } });
    const totalAmount = orderItems.reduce((sum, currentItem) => {
      const price = Number(currentItem.price ?? 0)
      return sum + price * currentItem.quantity
    }, 0)

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        totalAmount: new Prisma.Decimal(totalAmount.toString()),
      },
    })

    return updatedItem;
  }

  async deleteOrderItem(orderId: string, itemId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${orderId}`);
    }

    if (order.status !== 'pending') {
      throw new BadRequestException('Chỉ có thể hủy món khi đơn hàng chưa được xác nhận');
    }

    const item = await this.prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!item || item.orderId !== orderId) {
      throw new NotFoundException(`Không tìm thấy món trong đơn hàng ${orderId}`);
    }

    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status: 'cancelled' },
    });

    const orderItems = await this.prisma.orderItem.findMany({ where: { orderId } });
    const activeItems = orderItems.filter((currentItem) => currentItem.status !== 'cancelled');
    const totalAmount = activeItems.reduce((sum, currentItem) => {
      const price = Number(currentItem.price ?? 0)
      return sum + price * currentItem.quantity
    }, 0)

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: activeItems.length === 0 ? 'cancelled' : 'pending',
        totalAmount: new Prisma.Decimal(totalAmount.toString()),
      },
    })

    return updatedItem;
  }
}