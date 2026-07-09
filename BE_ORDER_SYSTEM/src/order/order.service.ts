import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto, CreateOrderItemDto, CreateOrderByQrCodeDto } from './order.dto';
import { Prisma } from '@prisma/client';
import { OrderGateway } from './order.gateway';

const ORDER_STATUS = {
  pending: 'pending',
  staffConfirmed: 'staffConfirmed',
  preparing: 'preparing',
  ready: 'ready',
  served: 'served',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;

const ORDER_ITEM_STATUS = {
  pending: 'pending',
  staffConfirmed: 'staffConfirmed',
  preparing: 'preparing',
  ready: 'ready',
  served: 'served',
  cancelled: 'cancelled',
} as const;

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private readonly orderGateway: OrderGateway,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<any> {
    const { tableId, ...data } = createOrderDto;
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      throw new NotFoundException(`Không tìm thấy bàn với ID ${tableId}`);
    }

    const createdOrder = await this.prisma.order.create({
      data: {
        ...data,
        restaurant: {
          connect: { id: table.restaurantId },
        },
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

    this.orderGateway.emitNewOrder({
      ...createdOrder,
      restaurantId: table.restaurantId,
    });

    return createdOrder;
  }

  async createByQrCode(qrCode: string, createOrderByQrCodeDto: CreateOrderByQrCodeDto): Promise<any> {
    const table = await this.prisma.table.findFirst({ where: { qrCode } });
    if (!table) {
      throw new NotFoundException(`Không tìm thấy bàn với mã QR ${qrCode}`);
    }

    const { items, ...data } = createOrderByQrCodeDto;
    const createdOrder = await this.prisma.order.create({
      data: {
        ...data,
        restaurant: {
          connect: { id: table.restaurantId },
        },
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

    this.orderGateway.emitNewOrder({
      ...createdOrder,
      restaurantId: table.restaurantId,
    });

    return createdOrder;
  }

  async findAll(restaurantId?: string, includeAll = false): Promise<any[]> {
    const where = includeAll || !restaurantId ? {} : { restaurantId };

    return this.prisma.order.findMany({
      where,
      include: {
        table: true,
        items: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByQrCode(qrCode: string): Promise<any[]> {
    const table = await this.prisma.table.findFirst({ where: { qrCode } });
    if (!table) {
      throw new NotFoundException(`Không tìm thấy bàn với mã QR ${qrCode}`);
    }

    return this.prisma.order.findMany({
      where: {
        tableId: table.id,
        status: {
          in: [ORDER_STATUS.pending, ORDER_STATUS.staffConfirmed, ORDER_STATUS.preparing],
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

  async findKitchenQueue(restaurantId?: string): Promise<any[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        ...(restaurantId ? { restaurantId } : {}),
        status: {
          in: [ORDER_STATUS.pending, ORDER_STATUS.staffConfirmed, ORDER_STATUS.preparing],
        },
      },
      include: {
        table: true,
        items: {
          where: {
            status: {
              in: [ORDER_ITEM_STATUS.pending, ORDER_ITEM_STATUS.staffConfirmed, ORDER_ITEM_STATUS.preparing, ORDER_ITEM_STATUS.ready],
            },
          },
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
    }) as Array<Prisma.OrderGetPayload<{
      include: {
        table: true;
        items: {
          include: {
            menuItem: {
              include: {
                images: true;
              };
            };
          };
        };
        payments: true;
      };
    }>>;

    return orders
      .map((order) => ({
        ...order,
        items: (order.items || [])
          .filter((item) => item.status !== ORDER_ITEM_STATUS.cancelled && item.status !== ORDER_ITEM_STATUS.ready && item.status !== ORDER_ITEM_STATUS.served)
          .map((item) => ({
            ...item,
            status: item.status,
          })),
      }))
      .filter((order) => order.items?.length > 0);
  }

  async findOne(id: string): Promise<any> {
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

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<any> {
    const { tableId, ...data } = updateOrderDto;
    const updatedOrder = await this.prisma.order.update({
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

    if (data.status === ORDER_STATUS.staffConfirmed) {
      const orderItems = await this.prisma.orderItem.findMany({ where: { orderId: id } });
      const pendingItems = orderItems.filter((item) => item.status === ORDER_ITEM_STATUS.pending);

      await Promise.all(
        pendingItems.map((item) =>
          this.prisma.orderItem.update({
            where: { id: item.id },
            data: { status: ORDER_ITEM_STATUS.staffConfirmed },
          }),
        ),
      );
    }

    this.orderGateway.emitOrderUpdated(updatedOrder);

    return updatedOrder;
  }

  async remove(id: string): Promise<any> {
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

  async updateOrderItem(orderId: string, itemId: string, data: { quantity?: number; note?: string }) {
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
      data: { status: ORDER_ITEM_STATUS.cancelled },
    });

    const orderItems = await this.prisma.orderItem.findMany({ where: { orderId } });
    const activeItems = orderItems.filter((currentItem) => currentItem.status !== ORDER_ITEM_STATUS.cancelled);
    const totalAmount = activeItems.reduce((sum, currentItem) => {
      const price = Number(currentItem.price ?? 0)
      return sum + price * currentItem.quantity
    }, 0)

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: activeItems.length === 0 ? ORDER_STATUS.cancelled : ORDER_STATUS.pending,
        totalAmount: new Prisma.Decimal(totalAmount.toString()),
      },
    })

    return updatedItem;
  }

  async confirmOrderItem(orderId: string, itemId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${orderId}`);
    }

    const item = await this.prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!item || item.orderId !== orderId) {
      throw new NotFoundException(`Không tìm thấy món trong đơn hàng ${orderId}`);
    }

    if (item.status !== ORDER_ITEM_STATUS.pending) {
      throw new BadRequestException('Chỉ có thể xác nhận món khi trạng thái là chờ xác nhận');
    }

    const confirmedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: {
        status: ORDER_ITEM_STATUS.staffConfirmed,
        confirmedBy: userId,
        confirmedAt: new Date(),
      },
    });

    const allOrderItems = await this.prisma.orderItem.findMany({ where: { orderId } });
    const hasPendingItems = allOrderItems.some((currentItem) => currentItem.status === ORDER_ITEM_STATUS.pending);

    if (!hasPendingItems) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: ORDER_STATUS.staffConfirmed },
      });
    }

    this.orderGateway.emitOrderItemConfirmed({
      orderId,
      itemId,
      restaurantId: order.restaurantId,
      confirmedBy: userId,
      confirmedAt: new Date(),
    });

    return confirmedItem;
  }

  async setOrderItemStatus(orderId: string, itemId: string, status: string, userId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${orderId}`);
    }

    const item = await this.prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!item || item.orderId !== orderId) {
      throw new NotFoundException(`Không tìm thấy món trong đơn hàng ${orderId}`);
    }

    const normalizedStatus = (() => {
      switch (status) {
        case 'pending':
          return ORDER_ITEM_STATUS.pending;
        case 'staffConfirmed':
          return ORDER_ITEM_STATUS.staffConfirmed;
        case 'preparing':
          return ORDER_ITEM_STATUS.preparing;
        case 'ready':
          return ORDER_ITEM_STATUS.ready;
        case 'served':
          return ORDER_ITEM_STATUS.served;
        case 'cancelled':
          return ORDER_ITEM_STATUS.cancelled;
        default:
          return undefined;
      }
    })();
    const allowedStatuses = [ORDER_ITEM_STATUS.pending, ORDER_ITEM_STATUS.staffConfirmed, ORDER_ITEM_STATUS.preparing, ORDER_ITEM_STATUS.ready, ORDER_ITEM_STATUS.served, ORDER_ITEM_STATUS.cancelled];

    if (!normalizedStatus || !allowedStatuses.includes(normalizedStatus)) {
      throw new BadRequestException('Trạng thái món không hợp lệ');
    }

    if (normalizedStatus === ORDER_ITEM_STATUS.ready && item.status !== ORDER_ITEM_STATUS.staffConfirmed && item.status !== ORDER_ITEM_STATUS.preparing) {
      throw new BadRequestException('Chỉ có thể chuyển món sang sẵn sàng khi đang ở trạng thái xác nhận hoặc đang làm');
    }

    if (normalizedStatus === ORDER_ITEM_STATUS.served && item.status !== ORDER_ITEM_STATUS.ready) {
      throw new BadRequestException('Chỉ có thể phục vụ món khi đã ở trạng thái sẵn sàng');
    }

    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: {
        status: normalizedStatus,
        ...(userId ? { confirmedBy: userId } : {}),
        ...(userId ? { confirmedAt: new Date() } : {}),
      },
    });

    const allOrderItems = await this.prisma.orderItem.findMany({ where: { orderId } });
    const activeItems = allOrderItems.filter((currentItem) => currentItem.status !== ORDER_ITEM_STATUS.cancelled);
    const allItemsReady = activeItems.length > 0 && activeItems.every((currentItem) => currentItem.status === ORDER_ITEM_STATUS.ready || currentItem.status === ORDER_ITEM_STATUS.served);
    const allItemsServed = activeItems.length > 0 && activeItems.every((currentItem) => currentItem.status === ORDER_ITEM_STATUS.served);

    if (allItemsServed) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: ORDER_STATUS.served },
      });
    } else if (allItemsReady) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: ORDER_STATUS.ready },
      });
    } else if (order.status !== ORDER_STATUS.preparing && activeItems.some((currentItem) => currentItem.status === ORDER_ITEM_STATUS.preparing || currentItem.status === ORDER_ITEM_STATUS.staffConfirmed)) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: ORDER_STATUS.preparing },
      });
    }

    return updatedItem;
  }
}