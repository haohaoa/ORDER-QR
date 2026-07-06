import { Test, TestingModule } from '@nestjs/testing';
import { StaffAccountService } from './staff-account.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('StaffAccountService', () => {
  let service: StaffAccountService;
  let prisma: { user: any };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffAccountService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<StaffAccountService>(StaffAccountService);
  });

  it('creates a staff account for the owner restaurant', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'owner-1', role: 'owner', restaurantId: 'restaurant-1' })
      .mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValue({
      id: 'staff-1',
      name: 'Nhân viên A',
      email: 'staff@example.com',
      role: 'service',
      restaurantId: 'restaurant-1',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create('owner-1', {
      name: 'Nhân viên A',
      email: 'staff@example.com',
      password: '123456',
    } as any);

    expect(result.restaurantId).toBe('restaurant-1');
    expect(result.role).toBe('service');
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('rejects non-owner/non-manager requests', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1', role: 'customer', restaurantId: null });

    await expect(
      service.create('user-1', {
        name: 'Nhân viên A',
        email: 'staff@example.com',
        password: '123456',
      } as any),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lists staff accounts for the restaurant', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: 'manager-1', role: 'manager', restaurantId: 'restaurant-1' });
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'staff-1',
        name: 'Nhân viên A',
        email: 'staff@example.com',
        role: 'service',
        status: 'active',
        phone: '0901111111',
        address: 'HCM',
      },
    ]);

    const result = await service.findByRestaurant('manager-1');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Nhân viên A');
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it('deletes a staff account from the same restaurant', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'manager-1', role: 'manager', restaurantId: 'restaurant-1' })
      .mockResolvedValueOnce({ id: 'staff-1', role: 'service', restaurantId: 'restaurant-1' });
    prisma.user.delete.mockResolvedValue({ id: 'staff-1' });

    const result = await service.remove('manager-1', 'staff-1');

    expect(result.message).toContain('Xóa tài khoản nhân viên');
    expect(prisma.user.delete).toHaveBeenCalled();
  });
});
