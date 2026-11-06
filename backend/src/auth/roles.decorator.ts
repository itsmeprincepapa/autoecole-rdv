import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../users/user-role.enum';

export const ROLES_KEY = 'roles';

// Usage : @Roles(UserRole.ADMIN) ou @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);