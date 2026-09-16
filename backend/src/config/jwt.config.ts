import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export const jwtConfig = registerAs<JwtConfig>('jwt', () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is required in production');
  }
  return {
    secret: secret || (process.env.NODE_ENV === 'test' ? 'test-jwt-secret-key-salt' : 'yehagere-atelier-secret-key-2026-secure-token-salt'),
    expiresIn: process.env.JWT_EXPIRES_IN || '72h',
  };
});
