import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantDto } from './restaurant.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  async createWithManager(createRestaurantDto: CreateRestaurantDto) {
    const { manager, ...restaurantData } = createRestaurantDto;

    if (!manager) {
      throw new BadRequestException('Manager payload is required');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: manager.email },
    });

    if (existingUser) {
      throw new ConflictException('Email của người quản lý đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(manager.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          ...restaurantData,
        },
      });

      const managerUser = await tx.user.create({
        data: {
          name: manager.name,
          email: manager.email,
          password: hashedPassword,
          phone: manager.phone,
          address: manager.address,
          role: 'manager',
          restaurantId: restaurant.id,
        },
      });

      return {
        restaurant,
        manager: {
          id: managerUser.id,
          name: managerUser.name,
          email: managerUser.email,
          role: managerUser.role,
          restaurantId: managerUser.restaurantId,
        },
      };
    });
  }
}
