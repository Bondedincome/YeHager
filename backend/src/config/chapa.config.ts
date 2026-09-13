import { registerAs } from '@nestjs/config';

export interface ChapaConfig {
  secretKey: string;
  callbackUrl: string;
}

export const chapaConfig = registerAs<ChapaConfig>('chapa', () => ({
  secretKey: process.env.CHAPA_SECRET_KEY ?? '',
  callbackUrl: process.env.CHAPA_CALLBACK_URL ?? '',
}));
