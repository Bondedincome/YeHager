import { registerAs } from '@nestjs/config';
import * as crypto from 'crypto';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

let devEphemeralSecret: string | null = null;

export function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  const isDeployed =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.K_SERVICE) ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.RAILWAY_ENVIRONMENT) ||
    Boolean(process.env.FLY_APP_NAME);

  if (!secret) {
    if (isDeployed) {
      throw new Error(
        'FATAL: JWT_SECRET environment variable is strictly required in deployed environments. Refusing to start.',
      );
    }
    if (!devEphemeralSecret) {
      devEphemeralSecret = crypto.randomBytes(32).toString('hex');
      console.warn(
        '⚠️ WARNING: JWT_SECRET is not configured. Generated ephemeral runtime secret for isolated development session.',
      );
    }
    return devEphemeralSecret;
  }
  return secret;
}

export const jwtConfig = registerAs<JwtConfig>('jwt', () => {
  return {
    secret: resolveJwtSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN || '72h',
  };
});
