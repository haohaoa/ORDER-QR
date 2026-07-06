import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';
import { Category } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto, extractedRestaurantId?: string): Promise<Category> {
    if (!extractedRestaurantId) {
      throw new NotFoundException('Không xác định được cửa hàng');
    }

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        restaurantId: extractedRestaurantId,
      },
    });
  }

  async findAll(restaurantId?: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: restaurantId ? { restaurantId } : undefined,
      include: {
        menuItems: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        menuItems: true,
      },
    });
    if (!category) {
      throw new NotFoundException(`Không tìm thấy danh mục với ID ${id}`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string): Promise<Category> {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  // Public method: Find categories by QR code (for customer-facing pages)
  async findByQrCode(qrCode: string): Promise<Category[]> {
    const table = await this.prisma.table.findFirst({
      where: { qrCode },
    });

    if (!table || !table.restaurantId) {
      return [];
    }

    return this.prisma.category.findMany({
      where: {
        restaurantId: table.restaurantId,
      },
      include: {
        menuItems: {
          where: {
            status: { not: 'deleted' },
          },
          orderBy: {
            id: 'desc',
          },
          include: {
            images: true,
            options: true,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }
}