import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto, UpdateMenuItemDto, CreateImageItemDto, CreateOptionItemDto } from './menu-item.dto';
import { MenuItem } from '@prisma/client';

@Injectable()
export class MenuItemService {
  constructor(private prisma: PrismaService) { }

  private async syncOptions(menuId: string, options?: Array<{ name: string; required?: boolean; isMultiple?: boolean; choices?: any; price?: number }>) {
    if (options === undefined) {
      return;
    }

    await this.prisma.optionItem.deleteMany({ where: { menuId } });

    if (options.length > 0) {
      await this.prisma.optionItem.createMany({
        data: options
          .filter((option) => option?.name?.trim())
          .map((option) => ({
            menuId,
            name: option.name.trim(),
            required: Boolean(option.required),
            isMultiple: Boolean(option.isMultiple),
            choices: option.choices || null,
            price: option.price ?? null,
          })),
      });
    }
  }

  async create(createMenuItemDto: CreateMenuItemDto, extractedRestaurantId?: string): Promise<MenuItem> {
    const { categoryId, options, userId: _userId, ...data } = createMenuItemDto;

    if (!extractedRestaurantId) {
      throw new ForbiddenException('Không xác định được cửa hàng');
    }

    if (categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: categoryId,
          restaurantId: extractedRestaurantId,
        },
      });

      if (!category) {
        throw new ForbiddenException('Danh mục không thuộc về cửa hàng này');
      }
    }

    const createdItem = await this.prisma.menuItem.create({
      data: {
        ...data,
        restaurant: {
          connect: { id: extractedRestaurantId },
        },
        category: categoryId ? {
          connect: { id: categoryId },
        } : undefined,
      },
      include: {
        category: true,
        images: true,
        options: true,
      },
    });

    await this.syncOptions(createdItem.id, options);
    return this.findOne(createdItem.id);
  }

  async findAll(restaurantId?: string): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      where: { status: { not: 'deleted' }, ...(restaurantId ? { restaurantId } : {}) },
      include: {
        category: true,
        images: true,
        options: true,
      },
    });
  }

  async findForUser(restaurantId?: string, tableId?: string): Promise<MenuItem[]> {
    const where: any = { status: { not: 'deleted' } };

    if (tableId) {
      const table = await this.prisma.table.findUnique({ where: { id: tableId } });
      if (table?.restaurantId) {
        where.restaurantId = table.restaurantId;
      }
    } else if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    return this.prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        images: true,
        options: true,
      },
    });
  }

  async findForTable(tableId?: string): Promise<MenuItem[]> {
    const where: any = { status: { not: 'deleted' } };

    if (tableId) {
      const table = await this.prisma.table.findUnique({ where: { id: tableId } });
      if (table && table.restaurantId) {
        where.restaurantId = table.restaurantId;
      }
    }

    return this.prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        images: true,
        options: true,
      },
    });
  }


  async findOne(id: string): Promise<MenuItem> {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        options: true,
      },
    });
    if (!menuItem) {
      throw new NotFoundException(`Không tìm thấy mục menu với ID ${id}`);
    }
    return menuItem;
  }

  async update(id: string, updateMenuItemDto: UpdateMenuItemDto): Promise<MenuItem> {
    const { categoryId, options, ...data } = updateMenuItemDto;

    if (categoryId) {
      const currentMenuItem = await this.prisma.menuItem.findUnique({ where: { id }, select: { restaurantId: true } });
      const category = await this.prisma.category.findFirst({
        where: {
          id: categoryId,
          restaurantId: currentMenuItem?.restaurantId,
        },
      });

      if (!category) {
        throw new ForbiddenException('Danh mục không thuộc về cửa hàng này');
      }
    }

    await this.prisma.menuItem.update({
      where: { id },
      data: {
        ...data,
        category: categoryId ? {
          connect: { id: categoryId },
        } : undefined,
      },
    });

    await this.syncOptions(id, options);
    return this.findOne(id);
  }

  async remove(id: string): Promise<MenuItem> {
    return this.prisma.menuItem.update({
      where: { id },
      data: { status: 'deleted' },
    });
  }

  async addImage(createImageItemDto: CreateImageItemDto) {
  return this.prisma.imageItem.create({
    data: createImageItemDto,
  });
  }

  async addImageAndGetMenuItem(menuId: string, createImageItemDto: CreateImageItemDto) {
    await this.addImage({ ...createImageItemDto, menuId });
    return this.findOne(menuId);
  }

  async addOption(createOptionItemDto: CreateOptionItemDto) {
    return this.prisma.optionItem.create({
      data: createOptionItemDto,
    });
  }

  async deleteImage(imageId: number) {
    return this.prisma.imageItem.delete({
      where: { id: imageId },
    });
  }

  // Public method: Find menu items by QR code (for customer-facing pages)
  async findByQrCode(qrCode: string): Promise<MenuItem[]> {
    const table = await this.prisma.table.findFirst({
      where: { qrCode },
    });

    if (!table || !table.restaurantId) {
      return [];
    }

    return this.prisma.menuItem.findMany({
      where: {
        restaurantId: table.restaurantId,
        status: { not: 'deleted' },
      },
      orderBy: {
        id: 'desc',
      },
      include: {
        category: true,
        images: true,
        options: true,
      },
    });
  }
}