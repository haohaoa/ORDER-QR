import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './payment.dto';
import { Payment } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { orderId, ...data } = createPaymentDto;
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID ${orderId}`);
    }

    return this.prisma.payment.create({
      data: {
        ...data,
        restaurant: {
          connect: { id: order.restaurantId },
        },
        order: {
          connect: { id: orderId },
        },
      },
      include: {
        order: true,
      },
    });
  }

  async findAll(): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      include: {
        order: true,
      },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });
    if (!payment) {
      throw new NotFoundException(`Không tìm thấy thanh toán với ID ${id}`);
    }
    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: updatePaymentDto,
      include: {
        order: true,
      },
    });
  }

  async remove(id: string): Promise<Payment> {
    return this.prisma.payment.delete({
      where: { id },
    });
  }
}