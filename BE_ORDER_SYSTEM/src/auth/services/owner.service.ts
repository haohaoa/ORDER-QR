// owner.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OwnerService {
  constructor(private prisma: PrismaService) { }

  async isOwner(
    model: 'MenuItem' | 'Order' | 'OrderItem' | 'Payment' | 'ImageItem' | 'OptionItem' | 'Category' | 'Table',
    resourceId: string,
    userId: string,
    ownerField = 'userId',
  ): Promise<boolean> {
    if (!resourceId || !userId) return false;

    const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
    const record = await (this.prisma as any)[modelKey].findUnique({
      where: { id: resourceId },
      select: { [ownerField]: true },
    });

    if (ownerField === 'restaurantId') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { restaurantId: true },
      });

      return record?.[ownerField] === user?.restaurantId;
    }

    return record?.[ownerField] === userId;
  }
}
