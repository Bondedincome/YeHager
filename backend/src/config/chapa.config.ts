import { registerAs } from '@nestjs/config';

export interface ChapaConfig {
  /** Secret key from the Chapa dashboard (CHASECK_TEST-… for test mode, CHASECK-… for live). */
  secretKey: string;
  /** Public URL of GET /api/v1/orders/chapa/callback on this API. Chapa calls it after payment. */
  callbackUrl: string;
  /** Optional "secret hash" set on the Chapa dashboard's Webhooks tab. When set, webhook signatures are checked. */
  webhookSecret: string;
  /** Chapa API base URL. Only override for testing. */
  baseUrl: string;
}

export const chapaConfig = registerAs<ChapaConfig>('chapa', () => ({
  secretKey: process.env.CHAPA_SECRET_KEY ?? '',
  callbackUrl: process.env.CHAPA_CALLBACK_URL ?? '',
  webhookSecret: process.env.CHAPA_WEBHOOK_SECRET ?? '',
  baseUrl: (process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1').replace(
    /\/$/,
    '',
  ),
}));
