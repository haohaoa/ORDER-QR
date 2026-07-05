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

    const record = await this.prisma[model].findUnique({
      where: { id: resourceId },
      select: { [ownerField]: true },
    });

    return record?.[ownerField] === userId;
  }
}
