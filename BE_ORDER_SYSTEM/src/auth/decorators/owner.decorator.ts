// owner.decorator.ts
import { SetMetadata } from '@nestjs/common';

// Gắn metadata để Guard biết cần kiểm tra "owner"
export const OWNER_KEY = 'owner';

// Cấu hình cho kiểm tra chủ sở hữu
export interface OwnerMeta {
  // Model trong Prisma cần kiểm tra
  model: 'MenuItem' | 'Order' | 'OrderItem' | 'Payment'| 'ImageItem'| 'OptionItem' | 'Category' | 'Table';

  // Tên param chứa id (mặc định: 'id')
  param?: string;

  // Tên cột owner trong DB (mặc định: 'ownerId')
  ownerField?: string;
}

// Decorator @Owner
// Dùng để khai báo route cần kiểm tra đúng người sở hữu
export const Owner = (meta: OwnerMeta | OwnerMeta['model']) => {
  // Dùng nhanh: @Owner('menu-item')
  if (typeof meta === 'string') {
    return SetMetadata(OWNER_KEY, { model: meta });
  }

  // Dùng đầy đủ: @Owner({ model, param, ownerField })
  return SetMetadata(OWNER_KEY, {
    param: 'id',
    ownerField: 'userId',
    ...meta,
  });
};
