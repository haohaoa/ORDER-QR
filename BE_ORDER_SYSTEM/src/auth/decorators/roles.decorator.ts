import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  admin = 'admin',
  manager = 'manager',
  service = 'service',
  kitchen = 'kitchen',
  customer = 'customer',
  owner = 'owner',
  staff = 'service',
}

export const normalizeUserRole = (role?: string | null): UserRole | undefined => {
  if (!role) {
    return undefined;
  }

  const normalized = role.toString().toLowerCase();

  switch (normalized) {
    case 'owner':
      return UserRole.owner;
    case 'admin':
      return UserRole.admin;
    case 'manager':
      return UserRole.manager;
    case 'service':
      return UserRole.service;
    case 'kitchen':
      return UserRole.kitchen;
    case 'customer':
      return UserRole.customer;
    case 'staff':
      return UserRole.service;
    default:
      return normalized as UserRole;
  }
};

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);