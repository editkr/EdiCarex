import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (req: any) => req?.query?.token,
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    async validate(payload: any) {
        console.log('JWT_STRATEGY_VALIDATE: Payload:', payload);
        try {
            const user = await this.usersService.findOne(payload.sub);
            if (!user) {
                console.error('JWT_STRATEGY: User not found via service', payload.sub);
                throw new UnauthorizedException();
            }
            console.log('JWT_STRATEGY: User found', user.email);
            // Validate token version for smart invalidation
            const userData = user as any;
            if (payload.version !== undefined && userData.tokenVersion !== payload.version) {
                console.warn(`JWT_STRATEGY: Token version mismatch for user ${user.email}. Token: ${payload.version}, DB: ${userData.tokenVersion}`);
                throw new UnauthorizedException('La sesión ha expirado o ha sido invalidada.');
            }

            return {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roleId: user.roleId,
                role: user.role,
                permissions: payload.permissions || [],
                preferences: user.preferences,
            };
        } catch (error) {
            console.error('JWT_STRATEGY: Error validating user', error.message);
            throw new UnauthorizedException();
        }
    }
}
