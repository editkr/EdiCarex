
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermission = this.reflector.get<string>('permission', context.getHandler());
        if (!requiredPermission) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        // Admin has full access
        if (user.role?.name === 'Admin' || user.role?.name === 'ADMIN') {
            return true;
        }

        // Check user preferences for granular permissions
        const userPermissions = user.preferences?.permissions || [];

        // Check if user has the specific permission OR 'ALL'
        const hasPermission = userPermissions.includes(requiredPermission) || userPermissions.includes('ALL');

        if (!hasPermission) {
            throw new ForbiddenException('No tienes permisos para acceder a este recurso');
        }

        return true;
    }
}
