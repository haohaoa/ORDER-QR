import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImageItemDto, UpdateImageItemDto } from './image-item.dto';
import { ImageItem } from '@prisma/client';

@Injectable()
export class ImageItemService {
  constructor(private prisma: PrismaService) {}

  async create(createImageItemDto: CreateImageItemDto): Promise<ImageItem> {
    const { menuId, ...data } = createImageItemDto;
    return this.prisma.imageItem.create({
      data: {
        ...data,
        menu: {
          connect: { id: menuId },
        },
      },
      include: {
        menu: true,
      },
    });
  }

  async findAll(): Promise<ImageItem[]> {
    return this.prisma.imageItem.findMany({
      include: {
        menu: true,
      },
    });
  }

  async findOne(id: number): Promise<ImageItem> {
    const imageItem = await this.prisma.imageItem.findUnique({
      where: { id },
      include: {
        menu: true,
      },
    });
    if (!imageItem) {
      throw new NotFoundException(`Không tìm thấy mục hình ảnh với ID ${id}`);
    }
    return imageItem;
  }

  async update(id: number, updateImageItemDto: UpdateImageItemDto): Promise<ImageItem> {
    return this.prisma.imageItem.update({
      where: { id },
      data: updateImageItemDto,
      include: {
        menu: true,
      },
    });
  }

  async remove(id: number): Promise<ImageItem> {
    return this.prisma.imageItem.delete({
      where: { id },
    });
  }
}