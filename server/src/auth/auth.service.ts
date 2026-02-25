import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private auditService: AuditService,
    ) { }

    async validateUser(rawEmail: string, password: string): Promise<any> {
        const email = rawEmail.trim().toLowerCase();
        console.log(`[AUTH DEBUG] Attempting login for email: '${email}'`);
        // We need to fetch the user with patient relation to check if they are a patient
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                role: true,
                patient: true
            }
        });

        if (!user) {
            console.log(`[AUTH DEBUG] User not found for email: '${email}'`);
            throw new UnauthorizedException('Usuario no encontrado. Verifique el email.');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log(`[AUTH DEBUG] Password INVALID for user: '${email}'`);
            throw new UnauthorizedException('Contraseña incorrecta.');
        }

        console.log(`[AUTH DEBUG] Login SUCCESS for user: '${email}'`);

        if (!user.isActive) {
            throw new UnauthorizedException('Account is inactive');
        }

        if (user.deletedAt) {
            // EMERGENCY RECOVERY: If main admin is deleted, restore them automatically
            if (email === 'admin@edicarex.com') {
                console.log('🚨 EMERGENCY: Resurrecting soft-deleted Admin user');
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { deletedAt: null }
                });
                user.deletedAt = null; // Update local object
            } else {
                throw new UnauthorizedException('Account has been deleted');
            }
        }

        const { password: _, ...result } = user;
        return result;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        const payload = {
            sub: user.id,
            email: user.email,
            roleId: user.roleId,
        };

        const accessToken = this.jwtService.sign(payload);

        // [AUDIT] Manual log for LOGIN
        await this.auditService.createLog({
            userId: user.id,
            action: 'LOGIN',
            resource: 'auth',
            changes: { email: user.email },
        }).catch(err => console.error('Failed to log login:', err));

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                preferences: (user as any).preferences, // Include preferences (permissions)
                patientId: (user as any).patient?.id, // Return patientId if exists
            },
        };
    }

    async register(registerDto: RegisterDto) {
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        const user = await this.usersService.create({
            ...registerDto,
            password: hashedPassword,
        });

        const { password: _, ...result } = user;
        return result;
    }

    async refreshToken(userId: string) {
        const user = await this.usersService.findOne(userId);

        const payload = {
            sub: user.id,
            email: user.email,
            roleId: user.roleId,
        };

        return {
            accessToken: this.jwtService.sign(payload),
        };
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string) {
        // Get user with password
        const userWithPassword = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!userWithPassword) {
            throw new UnauthorizedException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, userWithPassword.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: 'Password changed successfully' };
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            // Don't reveal if user exists
            return { message: 'If email exists, a reset link has been sent' };
        }

        // Generate token
        const token = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Store token (using any cast due to prisma generate issue)
        await (this.prisma as any).passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });

        // In production, send email here
        // For now, return the token (simulated)
        console.log(`Password reset token for ${email}: ${token}`);

        return {
            message: 'If email exists, a reset link has been sent',
            // Only for development - remove in production
            _devToken: token
        };
    }

    async resetPassword(token: string, newPassword: string) {
        // Find valid token
        const resetToken = await (this.prisma as any).passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        if (new Date() > resetToken.expiresAt) {
            // Delete expired token
            await (this.prisma as any).passwordResetToken.delete({ where: { id: resetToken.id } });
            throw new UnauthorizedException('Token has expired');
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword },
        });

        // Delete used token
        await (this.prisma as any).passwordResetToken.delete({ where: { id: resetToken.id } });

        return { message: 'Password reset successfully' };
    }

    async logout(token: string) {
        try {
            // Decode token to get expiry
            const decoded = this.jwtService.decode(token) as any;
            if (!decoded || !decoded.exp) {
                return { message: 'Logged out successfully' };
            }

            const expiresAt = new Date(decoded.exp * 1000);

            // Add to blacklist
            await (this.prisma as any).tokenBlacklist.create({
                data: {
                    token,
                    expiresAt,
                },
            });
        } catch (e) {
            // Token might be invalid, but logout still succeeds
        }

        return { message: 'Logged out successfully' };
    }

    async isTokenBlacklisted(token: string): Promise<boolean> {
        try {
            const blacklisted = await (this.prisma as any).tokenBlacklist.findUnique({
                where: { token },
            });
            return !!blacklisted;
        } catch {
            return false;
        }
    }
}
