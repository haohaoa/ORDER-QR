import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOptionItemDto, UpdateOptionItemDto } from './option-item.dto';
import { OptionItem } from '@prisma/client';

@Injectable()
export class OptionItemService {
  constructor(private prisma: PrismaService) {}

  async create(createOptionItemDto: CreateOptionItemDto): Promise<OptionItem> {
    const { menuId, ...data } = createOptionItemDto;
    return this.prisma.optionItem.create({
      data: {
        ...data,
        price: data.price ?? null,
        menu: {
          connect: { id: menuId },
        },
      },
      include: {
        menu: true,
      },
    });
  }

  async findAll(): Promise<OptionItem[]> {
    return this.prisma.optionItem.findMany({
      include: {
        menu: true,
      },
    });
  }

  async findOne(id: number): Promise<OptionItem> {
    const optionItem = await this.prisma.optionItem.findUnique({
      where: { id },
      include: {
        menu: true,
      },
    });
    if (!optionItem) {
      throw new NotFoundException(`Không tìm thấy mục tùy chọn với ID ${id}`);
    }
    return optionItem;
  }

  async update(id: number, updateOptionItemDto: UpdateOptionItemDto): Promise<OptionItem> {
    return this.prisma.optionItem.update({
      where: { id },
      data: {
        ...updateOptionItemDto,
        price: updateOptionItemDto.price ?? undefined,
      },
      include: {
        menu: true,
      },
    });
  }

  async remove(id: number): Promise<OptionItem> {
    return this.prisma.optionItem.delete({
      where: { id },
    });
  }
}