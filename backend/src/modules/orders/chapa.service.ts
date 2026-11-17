import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type { ChapaConfig } from '../../config/chapa.config';

export type ChapaInitializeInput = {
  amount: number;
  currency: 'ETB' | 'USD';
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  txRef: string;
  returnUrl: string;
  title: string;
  description: string;
};

/** The parts of Chapa's verify response we rely on. */
export type ChapaVerification = {
  /** Lower-cased; Chapa documents "success", "failed" and "pending". */
  status: string;
  amount: number;
  currency: string;
  txRef: string;
  reference?: string;
  mode?: string;
};

type ChapaEnvelope<T> = { status?: string; message?: unknown; data?: T | null };

/**
 * Thin client for Chapa's REST API (https://developer.chapa.co).
 * Payments are only ever trusted after calling `verify`, never from a callback or webhook body.
 */
@Injectable()
export class ChapaService {
  private readonly logger = new Logger(ChapaService.name);

  constructor(private readonly configService: ConfigService) {}

  private get config(): ChapaConfig {
    const config = this.configService.get<ChapaConfig>('chapa');
    if (!config?.secretKey) {
      throw new ServiceUnavailableException(
        'Online payments are not set up yet (CHAPA_SECRET_KEY is missing).',
      );
    }
    if (!/^CHASECK(_TEST)?-/.test(config.secretKey)) {
      this.logger.error(
        'CHAPA_SECRET_KEY should start with CHASECK_TEST- (test) or CHASECK- (live).',
      );
      throw new ServiceUnavailableException(
        'Online payments are not set up correctly. Please try again later.',
      );
    }
    return config;
  }

  get isTestMode(): boolean {
    return (
      this.configService.get<ChapaConfig>('chapa')?.secretKey ?? ''
    ).startsWith('CHASECK_TEST');
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<{ httpStatus: number; body: ChapaEnvelope<T> }> {
    const { secretKey, baseUrl } = this.config;
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(init.headers ?? {}),
        },
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      this.logger.error(
        `Chapa request to ${path} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadGatewayException(
        'Could not reach the payment provider. Please try again.',
      );
    }
    const body = (await response.json().catch(() => ({}))) as ChapaEnvelope<T>;
    return { httpStatus: response.status, body };
  }

  /** Chapa returns `message` as a string or as a field → errors object. */
  private static messageOf(message: unknown): string {
    if (typeof message === 'string') return message;
    if (message && typeof message === 'object') {
      return Object.values(message as Record<string, unknown>)
        .flat()
        .map(String)
        .join(' ');
    }
    return 'Payment provider error';
  }

  /** Creates a hosted checkout and returns the URL to send the customer to. */
  async initialize(input: ChapaInitializeInput): Promise<string> {
    const { callbackUrl } = this.config;
    const { httpStatus, body } = await this.request<{ checkout_url?: string }>(
      '/transaction/initialize',
      {
        method: 'POST',
        body: JSON.stringify({
          amount: input.amount.toFixed(2),
          currency: input.currency,
          email: input.email,
          first_name: input.firstName,
          last_name: input.lastName,
          ...(input.phoneNumber ? { phone_number: input.phoneNumber } : {}),
          tx_ref: input.txRef,
          ...(callbackUrl ? { callback_url: callbackUrl } : {}),
          return_url: input.returnUrl,
          customization: {
            title: ChapaService.safeText(input.title, 16),
            description: ChapaService.safeText(input.description, 50),
          },
        }),
      },
    );

    const checkoutUrl = body.data?.checkout_url;
    if (httpStatus >= 400 || body.status !== 'success' || !checkoutUrl) {
      const reason = ChapaService.messageOf(body.message);
      this.logger.warn(`Chapa initialize failed (${httpStatus}): ${reason}`);
      throw new BadGatewayException(
        `The payment page could not be opened: ${reason}`,
      );
    }
    return checkoutUrl;
  }

  /** Asks Chapa for the real state of a transaction. Returns null if Chapa has no record of it yet. */
  async verify(txRef: string): Promise<ChapaVerification | null> {
    const { httpStatus, body } = await this.request<{
      status?: string;
      amount?: number | string;
      currency?: string;
      tx_ref?: string;
      reference?: string;
      mode?: string;
    }>(`/transaction/verify/${encodeURIComponent(txRef)}`);

    if (httpStatus === 404 || !body.data) return null;
    if (httpStatus >= 400) {
      throw new BadGatewayException(
        `Payment could not be verified: ${ChapaService.messageOf(body.message)}`,
      );
    }
    return {
      status: String(body.data.status ?? '').toLowerCase(),
      amount: Number(body.data.amount ?? 0),
      currency: String(body.data.currency ?? '').toUpperCase(),
      txRef: String(body.data.tx_ref ?? txRef),
      reference: body.data.reference,
      mode: body.data.mode,
    };
  }

  /**
   * Checks a webhook's HMAC-SHA256 signature. Chapa's docs differ on what is signed,
   * so the raw body and the re-serialised JSON body are both accepted, in either header.
   * Returns true when no webhook secret is configured (payments are still verified via the API).
   */
  verifyWebhookSignature(
    rawBody: Buffer | undefined,
    parsedBody: unknown,
    headers: Record<string, unknown>,
  ): boolean {
    const secret = this.configService.get<ChapaConfig>('chapa')?.webhookSecret;
    if (!secret) return true;

    const candidates = [
      headers['x-chapa-signature'],
      headers['chapa-signature'],
    ].filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );
    if (candidates.length === 0) return false;

    const payloads: Buffer[] = [Buffer.from(JSON.stringify(parsedBody ?? {}))];
    if (rawBody) payloads.unshift(rawBody);
    const expected = payloads.map((payload) =>
      createHmac('sha256', secret).update(payload).digest('hex'),
    );

    return candidates.some((signature) =>
      expected.some((hash) => {
        const a = Buffer.from(hash);
        const b = Buffer.from(signature.trim().toLowerCase());
        return a.length === b.length && timingSafeEqual(a, b);
      }),
    );
  }

  /** Chapa rejects unusual characters in customization text; keep letters, numbers, spaces and . - _ */
  static safeText(text: string, max: number): string {
    return (
      text
        .replace(/[^A-Za-z0-9 ._-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max)
        .trim() || 'YeHagere'
    );
  }

  /** Chapa expects 10-digit Ethiopian numbers: 09xxxxxxxx or 07xxxxxxxx. */
  static normalizePhone(raw: string | undefined): string | undefined {
    if (!raw?.trim()) return undefined;
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('251')) digits = `0${digits.slice(3)}`;
    if (digits.length === 9 && /^[79]/.test(digits)) digits = `0${digits}`;
    return /^0[79]\d{8}$/.test(digits) ? digits : undefined;
  }
}
