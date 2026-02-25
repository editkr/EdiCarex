import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MaintenanceGuard implements CanActivate {
    private jwtService: JwtService;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService
    ) {
        // Initialize JwtService manually since we can't easily inject it if it's not exported from a global module available here
        // or we can assume it will be available. Better to use simple decode if verifying signature is hard,
        // but for security we should verify. 
        // For now, let's try to instantiate it or use a simple decode for the role check?
        // Actually, we can use the secret from ConfigService.
        this.jwtService = new JwtService({
            secret: this.configService.get('JWT_SECRET'),
        });
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const url = request.url;

            // 1. Always allow Auth endpoints and Admin Config endpoints
            // This ensures Admins can always log in and turn off maintenance mode
            if (
                url.includes('/auth/') ||
                url.includes('/admin/organization') ||
                url.includes('/health') // Always allow health checks
            ) {
                return true;
            }

            // 2. Check Maintenance Status
            const config = await this.prisma.organizationConfig.findFirst({
                select: { maintenanceMode: true } as any,
            });

            if (!config?.maintenanceMode) {
                return true; // System is ONLINE
            }

            // 3. System is in Maintenance Mode - Check for ADMIN access
            const authHeader = request.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                try {
                    // Verify token to get payload
                    const payload = this.jwtService.verify(token);

                    // Payload only has roleId (checked in AuthService), not role name
                    if (payload.roleId) {
                        const role = await this.prisma.role.findUnique({
                            where: { id: payload.roleId },
                            select: { name: true }
                        });

                        console.log('MAINTENANCE_GUARD: Role Found', { roleName: role?.name });

                        if (role?.name?.toUpperCase() === 'ADMIN') {
                            // Admin allowed
                            return true;
                        }
                    }
                } catch (e) {
                    console.error('MaintenanceGuard Token Verification Failed:', e.message);
                    // Token invalid or verification failed - treat as guest/blocked
                }
            }

            // 4. Block access
            throw new ServiceUnavailableException({
                message: 'El sistema se encuentra en mantenimiento programado.',
                code: 'MAINTENANCE_MODE_ACTIVE',
            });

        } catch (error) {
            if (error instanceof ServiceUnavailableException) throw error;
            console.error('MaintenanceGuard Error:', error);
            // Fail-open: if DB check fails, allow access to avoid accidental lockout
            return true;
        }
    }
}
