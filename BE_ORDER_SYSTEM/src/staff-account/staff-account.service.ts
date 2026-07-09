import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffAccountDto, UpdateStaffAccountDto } from './staff-account.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffAccountService {
  constructor(private prisma: PrismaService) {}

  private async getActor(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, restaurantId: true },
    });
  }

  private canManageRestaurant(role?: string | null) {
    return ['manager', 'admin', 'owner'].includes((role ?? '').toLowerCase());
  }

  async create(userId: string, createStaffAccountDto: CreateStaffAccountDto) {
    const actor = await this.getActor(userId);

    if (!actor) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (!this.canManageRestaurant(actor.role)) {
      throw new ForbiddenException('Chỉ chủ nhà hàng hoặc quản lý mới được tạo tài khoản nhân viên');
    }

    if (!actor.restaurantId) {
      throw new ForbiddenException('Tài khoản này chưa được gán vào nhà hàng nào');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createStaffAccountDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const requestedRole = (createStaffAccountDto.role ?? 'service').toLowerCase();
    const allowedRoles = ['service', 'kitchen'];
    const normalizedRole = allowedRoles.includes(requestedRole) ? requestedRole : 'service';

    const hashedPassword = await bcrypt.hash(createStaffAccountDto.password, 10);

    const createdUser = await (this.prisma.user.create as any)({
      data: {
        name: createStaffAccountDto.name,
        email: createStaffAccountDto.email,
        password: hashedPassword,
        phone: createStaffAccountDto.phone,
        address: createStaffAccountDto.address,
        role: normalizedRole,
        restaurantId: actor.restaurantId,
        status: 'active',
      },
    });

    return {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      restaurantId: createdUser.restaurantId,
      status: createdUser.status,
      message: 'Tài khoản nhân viên đã được tạo thành công.',
    };
  }

  async findByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản nhân viên');
    }

    return {
      id: user.id,
      userId,
      role: user.role ?? 'service',
      status: user.status,
    };
  }

  async findByRestaurant(userId: string) {
    const actor = await this.getActor(userId);

    if (!actor) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (!this.canManageRestaurant(actor.role)) {
      throw new ForbiddenException('Chỉ chủ nhà hàng hoặc quản lý mới được xem danh sách nhân viên');
    }

    if (!actor.restaurantId) {
      throw new ForbiddenException('Tài khoản này chưa được gán vào nhà hàng nào');
    }

    const staffAccounts = await (this.prisma.user.findMany as any)({
      where: {
        restaurantId: actor.restaurantId,
        role: { in: ['service', 'kitchen'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return staffAccounts.map((account) => ({
      id: account.id,
      name: account.name,
      email: account.email,
      phone: account.phone,
      address: account.address,
      role: account.role,
      status: account.status,
      createdAt: account.createdAt,
    }));
  }

  async update(userId: string, updateStaffAccountDto: UpdateStaffAccountDto) {
    const user = await this.findByUserId(userId);

    return {
      ...user,
      name: updateStaffAccountDto.name,
      email: updateStaffAccountDto.email,
      message: 'Cập nhật thông tin nhân viên thành công.',
    };
  }

  async remove(actorId: string, targetUserId?: string) {
    const actor = await this.getActor(actorId);

    if (!actor) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (!this.canManageRestaurant(actor.role)) {
      throw new ForbiddenException('Chỉ chủ nhà hàng hoặc quản lý mới được xóa tài khoản nhân viên');
    }

    const targetUserIdToDelete = targetUserId ?? actorId;
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserIdToDelete },
      select: { id: true, role: true, restaurantId: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy tài khoản nhân viên');
    }

    if (!['service', 'kitchen'].includes((targetUser.role ?? '').toLowerCase())) {
      throw new ForbiddenException('Chỉ có thể xóa tài khoản nhân viên hoặc bếp');
    }

    if (targetUser.restaurantId !== actor.restaurantId) {
      throw new ForbiddenException('Không thể xóa tài khoản của nhà hàng khác');
    }

    await this.prisma.user.delete({
      where: { id: targetUserIdToDelete },
    });

    return {
      userId: targetUserIdToDelete,
      message: 'Xóa tài khoản nhân viên thành công.',
    };
  }
}
