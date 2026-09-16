import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export const jwtConfig = registerAs<JwtConfig>('jwt', () => ({
  secret: process.env.JWT_SECRET || 'yehagere-atelier-secret-key-2026-secure-token-salt',
  expiresIn: process.env.JWT_EXPIRES_IN || '72h',
}));
