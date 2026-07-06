import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OwnerService } from '../services/owner.service';
import { OWNER_KEY, OwnerMeta } from '../decorators/owner.decorator';
import { UserRole } from '../decorators/roles.decorator';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private ownerService: OwnerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.get<OwnerMeta>(
      OWNER_KEY,
      context.getHandler(),
    );

    if (!meta) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện hành động này');
    }

    if (user.role === UserRole.admin || user.role === 'owner') return true;

    const param = meta.param ?? 'id';
    const ownerField = meta.ownerField ?? 'restaurantId';
    const resourceId = req.params[param];

    const isOwner = await this.ownerService.isOwner(
      meta.model,
      resourceId,
      user.id,
      ownerField,
    );

    if (!isOwner) {
      throw new ForbiddenException('Bạn không có quyền để thực hiện hành động này');
    }

    return true;
  }
}
