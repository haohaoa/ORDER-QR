import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffAccountDto, UpdateStaffAccountDto } from './staff-account.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffAccountService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createStaffAccountDto: CreateStaffAccountDto) {
    // Check if staff account already exists for this user (only 1 allowed)
    const existingStaffAccount = await this.prisma.staffAccount.findUnique({
      where: { userId },
    });

    if (existingStaffAccount) {
      throw new BadRequestException('Tài khoản nhân viên đã tồn tại cho người dùng này');
    }

    // Check if username is already taken
    const existingUsername = await this.prisma.staffAccount.findUnique({
      where: { username: createStaffAccountDto.username },
    });

    if (existingUsername) {
      throw new BadRequestException('Tên đăng nhập đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(createStaffAccountDto.password, 10);
    const hashedPin = createStaffAccountDto.pin ? await bcrypt.hash(createStaffAccountDto.pin, 10) : null;

    return this.prisma.staffAccount.create({
      data: {
        username: createStaffAccountDto.username,
        password: hashedPassword,
        pin: hashedPin,
        userId,
      },
    });
  }

  async findByUserId(userId: string) {
    const staffAccount = await this.prisma.staffAccount.findUnique({
      where: { userId },
    });

    if (!staffAccount) {
      throw new NotFoundException('Không tìm thấy tài khoản nhân viên');
    }

    return staffAccount;
  }

  async update(userId: string, updateStaffAccountDto: UpdateStaffAccountDto) {
    const staffAccount = await this.findByUserId(userId);

    // If updating username, check if it's already taken
    if (updateStaffAccountDto.username && updateStaffAccountDto.username !== staffAccount.username) {
      const existingUsername = await this.prisma.staffAccount.findUnique({
        where: { username: updateStaffAccountDto.username },
      });

      if (existingUsername) {
        throw new BadRequestException('Tên đăng nhập đã được sử dụng');
      }
    }

    const updateData: any = {};

    if (updateStaffAccountDto.username) {
      updateData.username = updateStaffAccountDto.username;
    }

    if (updateStaffAccountDto.password) {
      updateData.password = await bcrypt.hash(updateStaffAccountDto.password, 10);
    }

    if (updateStaffAccountDto.pin !== undefined) {
      updateData.pin = updateStaffAccountDto.pin ? await bcrypt.hash(updateStaffAccountDto.pin, 10) : null;
    }

    return this.prisma.staffAccount.update({
      where: { userId },
      data: updateData,
    });
  }

  async remove(userId: string) {
    await this.findByUserId(userId);
    return this.prisma.staffAccount.delete({
      where: { userId },
    });
  }
}
