import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private auditService: AuditService,
        private configService: ConfigService,
    ) { }

    async validateUser(rawEmail: string, password: string): Promise<any> {
        const email = rawEmail.trim().toLowerCase();

        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                role: { include: { permissions: { include: { permission: true } } } },
                patient: true
            }
        });

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas.');
        }

        // Check for lockout
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
            throw new UnauthorizedException(`Cuenta bloqueada temporalmente. Intente de nuevo en ${minutesLeft} minutos.`);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            // Increment failed attempts
            const attempts = user.failedLoginAttempts + 1;
            const lockoutUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: attempts,
                    lockoutUntil
                }
            });

            if (lockoutUntil) {
                throw new UnauthorizedException('Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.');
            }
            throw new UnauthorizedException('Contraseña incorrecta.');
        }

        // Reset failed attempts on success
        if (user.failedLoginAttempts > 0) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: 0,
                    lockoutUntil: null,
                    lastLoginAt: new Date()
                }
            });
        }

        if (!user.isActive) {
            throw new UnauthorizedException('La cuenta está inactiva.');
        }

        const { password: _, ...result } = user;
        return result;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        return this.generateTokens(user);
    }

    async generateTokens(user: any) {
        const permissions = user.role?.permissions?.map(p => `${p.permission.resource}:${p.permission.action}`) || [];

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role?.name,
            permissions,
            version: user.tokenVersion
        };

        const accessToken = this.jwtService.sign(payload);

        // Refresh Token logic
        const refreshTokenValue = uuidv4();
        const refreshTokenExpires = new Date();
        refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 14); // 14 days

        await (this.prisma as any).refreshToken.create({
            data: {
                token: refreshTokenValue,
                userId: user.id,
                expiresAt: refreshTokenExpires
            }
        });

        await this.auditService.createLog({
            userId: user.id,
            action: 'LOGIN',
            resource: 'auth',
            changes: { email: user.email },
        });

        return {
            accessToken,
            refreshToken: refreshTokenValue,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role?.name,
                permissions,
                patientId: user.patient?.id,
            },
        };
    }

    async refresh(refreshToken: string) {
        const tokenDoc = await (this.prisma as any).refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: { include: { role: { include: { permissions: { include: { permission: true } } } }, patient: true } } }
        });

        if (!tokenDoc || tokenDoc.isRevoked || tokenDoc.expiresAt < new Date()) {
            throw new UnauthorizedException('Refresh token inválido o expirado.');
        }

        // Revoke current token (rotation)
        await (this.prisma as any).refreshToken.update({
            where: { id: tokenDoc.id },
            data: { isRevoked: true }
        });

        return this.generateTokens(tokenDoc.user);
    }

    async logout(accessToken: string, refreshToken?: string) {
        try {
            // Blacklist access token
            const decoded = this.jwtService.decode(accessToken) as any;
            if (decoded && decoded.exp) {
                await (this.prisma as any).tokenBlacklist.create({
                    data: {
                        token: accessToken,
                        expiresAt: new Date(decoded.exp * 1000),
                    },
                });
            }

            // Revoke refresh token if provided
            if (refreshToken) {
                await (this.prisma as any).refreshToken.updateMany({
                    where: { token: refreshToken },
                    data: { isRevoked: true }
                });
            }
        } catch (e) {
            console.error('Logout error:', e);
        }

        return { message: 'Sesión cerrada exitosamente.' };
    }

    async register(registerDto: RegisterDto) {
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

        const user = await this.usersService.create({
            ...registerDto,
            password: hashedPassword,
        });

        const { password: _, ...result } = user;
        return result;
    }

    // Otros métodos (changePassword, forgotPassword, etc.) se mantienen igual pero usando factor 12
    async changePassword(userId: string, oldPassword: string, newPassword: string) {
        const userWithPassword = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!userWithPassword) throw new UnauthorizedException('Usuario no encontrado');

        const isPasswordValid = await bcrypt.compare(oldPassword, userWithPassword.password);
        if (!isPasswordValid) throw new UnauthorizedException('Contraseña actual incorrecta');

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                tokenVersion: { increment: 1 } // Invalidate all existing tokens
            },
        });

        return { message: 'Contraseña actualizada y sesiones cerradas.' };
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return { message: 'Si el correo existe, se ha enviado un enlace de recuperación' };
        }

        const token = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await (this.prisma as any).passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });

        console.log(`[SECURITY] Password reset token for ${email}: ${token}`);

        return {
            message: 'Si el correo existe, se ha enviado un enlace de recuperación',
            _devToken: token
        };
    }

    async resetPassword(token: string, newPassword: string) {
        const resetToken = await (this.prisma as any).passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken || new Date() > resetToken.expiresAt) {
            throw new UnauthorizedException('Token inválido o expirado');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: { id: resetToken.userId },
            data: {
                password: hashedPassword,
                tokenVersion: { increment: 1 }
            },
        });

        await (this.prisma as any).passwordResetToken.delete({ where: { id: resetToken.id } });
        return { message: 'Contraseña restablecida exitosamente' };
    }
}
