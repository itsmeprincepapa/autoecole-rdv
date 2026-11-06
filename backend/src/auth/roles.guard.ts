import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/user-role.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Rôles autorisés, définis par @Roles(...) sur la route
    const allowedRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Pas de @Roles sur la route : aucune restriction de rôle
    if (!allowedRoles || allowedRoles.length === 0) return true;

    // request.user a été rempli par JwtStrategy.validate()
    const request = context.switchToHttp().getRequest<{
      user?: { id: string; role: UserRole };
    }>();

    // Refus (403) si pas d'utilisateur ou si son rôle n'est pas autorisé
    return !!request.user && allowedRoles.includes(request.user.role);
  }
}