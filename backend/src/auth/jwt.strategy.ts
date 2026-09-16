import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: (request: Request) =>
        ExtractJwt.fromAuthHeaderAsBearerToken()(request) ??
        request.cookies?.yehagere_auth_token,
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.secret') ||
        'yehagere-atelier-secret-key-2026-secure-token-salt',
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async validate(payload: any) {
    const userId = payload.sub || payload.userId;
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    try {
      const user = await this.usersService.findOne(userId);
      if (user) {
        if (user.status === 'suspended') {
          throw new UnauthorizedException('Your patron account has been temporarily suspended');
        }
        return user;
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
    }

    // Return sanitized token identity if detached in memory
    return {
      id: userId,
      email: payload.email,
      role: (payload.role || 'customer').toLowerCase(),
      status: 'active',
    };
  }
}
