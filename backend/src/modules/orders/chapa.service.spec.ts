import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { ChapaService } from './chapa.service';

const serviceWith = (webhookSecret: string) =>
  new ChapaService({
    get: () => ({
      secretKey: 'CHASECK_TEST-x',
      callbackUrl: '',
      webhookSecret,
      baseUrl: 'https://api.chapa.co/v1',
    }),
  } as unknown as ConfigService);

describe('ChapaService', () => {
  describe('normalizePhone', () => {
    it.each([
      ['0911234567', '0911234567'],
      ['+251 911 234 567', '0911234567'],
      ['911234567', '0911234567'],
      ['0712345678', '0712345678'],
    ])('accepts %s', (input, expected) => {
      expect(ChapaService.normalizePhone(input)).toBe(expected);
    });

    it.each(['12345', '0811234567', 'abc'])('rejects %s', (input) => {
      expect(ChapaService.normalizePhone(input)).toBeUndefined();
    });

    it('treats empty as not given', () => {
      expect(ChapaService.normalizePhone('  ')).toBeUndefined();
    });
  });

  it('strips characters Chapa rejects from checkout text', () => {
    expect(ChapaService.safeText('Order #YH-1 (gift)!', 50)).toBe(
      'Order YH-1 gift',
    );
    expect(ChapaService.safeText('YeHageré Boutique Store', 16)).toBe(
      'YeHager Boutique',
    );
  });

  describe('verifyWebhookSignature', () => {
    const body = { event: 'charge.success', tx_ref: 'YH-1-abc' };
    const raw = Buffer.from(JSON.stringify(body));
    const sign = (secret: string) =>
      createHmac('sha256', secret).update(raw).digest('hex');

    it('accepts a valid signature in either header', () => {
      const service = serviceWith('hook-secret');
      expect(
        service.verifyWebhookSignature(raw, body, {
          'x-chapa-signature': sign('hook-secret'),
        }),
      ).toBe(true);
      expect(
        service.verifyWebhookSignature(raw, body, {
          'chapa-signature': sign('hook-secret'),
        }),
      ).toBe(true);
    });

    it('rejects a wrong or missing signature', () => {
      const service = serviceWith('hook-secret');
      expect(
        service.verifyWebhookSignature(raw, body, {
          'x-chapa-signature': sign('other'),
        }),
      ).toBe(false);
      expect(service.verifyWebhookSignature(raw, body, {})).toBe(false);
    });

    it('skips the check when no webhook secret is configured', () => {
      expect(serviceWith('').verifyWebhookSignature(raw, body, {})).toBe(true);
    });
  });
});
