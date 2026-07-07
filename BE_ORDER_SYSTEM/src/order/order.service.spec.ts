import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let prisma: {
    table: { findFirst: jest.Mock };
    order: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
    orderItem: { findUnique: jest.Mock; findMany: jest.Mock; update: jest.Mock; delete: jest.Mock };
  };
  let gateway: { emitNewOrder: jest.Mock; emitOrderUpdated: jest.Mock };

  beforeEach(() => {
    prisma = {
      table: { findFirst: jest.fn() },
      order: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
      orderItem: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
    };
    gateway = { emitNewOrder: jest.fn(), emitOrderUpdated: jest.fn() };
    service = new OrderService(prisma as unknown as PrismaService, gateway as any);
  });

  it('finds orders by qr code for the matching table', async () => {
    prisma.table.findFirst.mockResolvedValue({ id: 'table-1' });
    prisma.order.findMany.mockResolvedValue([{ id: 'order-1' }]);

    const result = await service.findByQrCode('QR-001');

    expect(prisma.table.findFirst).toHaveBeenCalledWith({ where: { qrCode: 'QR-001' } });
    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: {
        tableId: 'table-1',
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
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([{ id: 'order-1' }]);
  });

  it('throws when the table qr code does not exist', async () => {
    prisma.table.findFirst.mockResolvedValue(null);

    await expect(service.findByQrCode('missing')).rejects.toThrow(NotFoundException);
  });

  it('emits a realtime notification when a new order is created from qr code', async () => {
    prisma.table.findFirst.mockResolvedValue({ id: 'table-1', restaurantId: 'restaurant-1' });
    prisma.order.create.mockResolvedValue({ id: 'order-1' });

    await service.createByQrCode('QR-001', { status: 'pending', totalAmount: 100, items: [] } as any);

    expect(gateway.emitNewOrder).toHaveBeenCalledWith(expect.objectContaining({ id: 'order-1' }));
  });

  it('updates an order item when the order is still pending', async () => {
    prisma.orderItem.findUnique.mockResolvedValue({ id: 'item-1', orderId: 'order-1', quantity: 1, note: 'old' });
    prisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'pending' });
    prisma.orderItem.update.mockResolvedValue({ id: 'item-1', quantity: 2, note: 'new' });
    prisma.orderItem.findMany.mockResolvedValue([{ id: 'item-1', orderId: 'order-1', price: 100, quantity: 1, status: 'pending' }]);
    prisma.order.update.mockResolvedValue({ id: 'order-1' });

    const result = await service.updateOrderItem('order-1', 'item-1', { quantity: 2, note: 'new' });

    expect(prisma.orderItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { quantity: 2, note: 'new' },
    });
    expect(result).toEqual({ id: 'item-1', quantity: 2, note: 'new' });
  });

  it('rejects updates for confirmed orders', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'preparing' });

    await expect(service.updateOrderItem('order-1', 'item-1', { quantity: 3 })).rejects.toThrow(BadRequestException);
  });

  it('cancels an order item when the order is still pending', async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'pending' });
    prisma.orderItem.findUnique.mockResolvedValue({ id: 'item-1', orderId: 'order-1', status: 'pending' });
    prisma.orderItem.update.mockResolvedValue({ id: 'item-1', status: 'cancelled' });
    prisma.orderItem.findMany.mockResolvedValue([{ id: 'item-1', orderId: 'order-1', status: 'cancelled', price: 100, quantity: 1 }]);

    await service.deleteOrderItem('order-1', 'item-1');

    expect(prisma.orderItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { status: 'cancelled' },
    });
  });
});
