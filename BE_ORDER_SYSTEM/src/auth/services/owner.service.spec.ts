import { OwnerService } from './owner.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('OwnerService', () => {
  let service: OwnerService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      category: { findUnique: jest.fn() },
    };
    service = new OwnerService(prisma as unknown as PrismaService);
  });

  it('uses the user restaurant membership when checking restaurant-scoped resources', async () => {
    prisma.category.findUnique.mockResolvedValue({ restaurantId: 'restaurant-1' });
    prisma.user.findUnique.mockResolvedValue({ restaurantId: 'restaurant-1' });

    await expect(service.isOwner('Category', 'cat-1', 'user-1', 'restaurantId')).resolves.toBe(true);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { restaurantId: true },
    });
  });
});
