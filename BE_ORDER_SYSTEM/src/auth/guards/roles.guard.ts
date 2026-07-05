// Import Injectable, CanActivate, ExecutionContext từ NestJS
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
// Import Reflector để truy cập metadata
import { Reflector } from '@nestjs/core';
// Import enum UserRole từ Prisma
import { UserRole } from '@prisma/client';
// Import key để lấy metadata roles
import { ROLES_KEY } from '../decorators/roles.decorator';

// Định nghĩa guard để kiểm tra quyền truy cập dựa trên vai trò người dùng
@Injectable()
export class RolesGuard implements CanActivate {
  // Constructor để inject Reflector
  constructor(private reflector: Reflector) {}

  // Phương thức canActivate quyết định xem request có được phép tiếp tục hay không
  canActivate(context: ExecutionContext): boolean {
    // Lấy danh sách roles yêu cầu từ metadata của handler hoặc class
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(), // Metadata của method
      context.getClass(), // Metadata của class
    ]);
    // Nếu không có roles yêu cầu, cho phép truy cập
    if (!requiredRoles) {
      return true;
    }
    // Lấy thông tin user từ request (được gắn bởi JWT strategy)
    const { user } = context.switchToHttp().getRequest();
    // Kiểm tra xem user có ít nhất một role trong danh sách requiredRoles không
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}