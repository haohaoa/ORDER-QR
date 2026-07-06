import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto, UpdateTableDto } from './table.dto';
import { Table, TableStatus } from '@prisma/client';

@Injectable()
export class TableService {
  constructor(private prisma: PrismaService) {}

  private buildQrCodeValue(name: string): string {
    const normalizedName = name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${normalizedName || 'table'}-${suffix}`;
  }

  async create(createTableDto: CreateTableDto, restaurantId?: string): Promise<Table> {
    if (!restaurantId) {
      throw new NotFoundException('Không xác định được cửa hàng');
    }

    const qrCode = createTableDto.qrCode?.trim() || this.buildQrCodeValue(createTableDto.name);
    return this.prisma.table.create({
      data: {
        name: createTableDto.name,
        qrCode,
        status: createTableDto.status ?? TableStatus.empty,
        restaurant: {
          connect: { id: restaurantId },
        },
      },
    });
  }

  async findForUser(restaurantId?: string, includeAll = false): Promise<Table[]> {
    const where = includeAll || !restaurantId ? {} : { restaurantId };

    return this.prisma.table.findMany({
      where,
      include: {
        orders: true,
      },
    });
  }

  async findOne(id: string): Promise<Table> {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });
    if (!table) {
      throw new NotFoundException(`Không tìm thấy bàn với ID ${id}`);
    }
    return table;
  }

  async update(id: string, updateTableDto: UpdateTableDto): Promise<Table> {
    return this.prisma.table.update({
      where: { id },
      data: updateTableDto,
    });
  }

  async remove(id: string): Promise<Table> {
    return this.prisma.table.delete({
      where: { id },
    });
  }
}