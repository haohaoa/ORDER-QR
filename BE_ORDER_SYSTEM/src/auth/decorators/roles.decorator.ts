// Import SetMetadata từ NestJS để set metadata
import { SetMetadata } from '@nestjs/common';
// Import enum UserRole từ Prisma
import { UserRole } from '@prisma/client';

// Khóa để lưu trữ metadata về roles
// KHAI BÁO QUYỀN
export const ROLES_KEY = 'roles';
// Decorator Roles để gắn metadata roles cho controller hoặc method
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);