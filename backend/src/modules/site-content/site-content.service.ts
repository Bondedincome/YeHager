import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteContent } from './entities/site-content.entity';

/** Only these keys can be read or written. Add new ones here deliberately. */
export const SITE_CONTENT_KEYS = ['homepage'] as const;
export type SiteContentKey = (typeof SITE_CONTENT_KEYS)[number];

/** Guard against accidentally huge documents (e.g. pasted base64 images). */
const MAX_CONTENT_BYTES = 90_000;

@Injectable()
export class SiteContentService {
  constructor(
    @InjectRepository(SiteContent)
    private readonly repo: Repository<SiteContent>,
  ) {}

  private assertKey(key: string): asserts key is SiteContentKey {
    if (!(SITE_CONTENT_KEYS as readonly string[]).includes(key)) {
      throw new NotFoundException(`Unknown content key "${key}"`);
    }
  }

  /** Returns the stored document, or `null` when nothing has been saved yet. */
  async get(key: string) {
    this.assertKey(key);
    const row = await this.repo.findOne({ where: { key } });
    return {
      key,
      content: row?.content ?? null,
      updatedAt: row?.updatedAt ?? null,
    };
  }

  async set(key: string, content: Record<string, unknown>) {
    this.assertKey(key);
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      throw new BadRequestException('content must be a JSON object');
    }
    if (Buffer.byteLength(JSON.stringify(content), 'utf8') > MAX_CONTENT_BYTES) {
      throw new PayloadTooLargeException(
        'Content is too large. Use image links instead of embedded images.',
      );
    }

    const existing = await this.repo.findOne({ where: { key } });
    const row = existing ?? this.repo.create({ key });
    row.content = content;
    const saved = await this.repo.save(row);
    return { key, content: saved.content, updatedAt: saved.updatedAt };
  }

  /** Clears saved content so the storefront falls back to its defaults. */
  async reset(key: string) {
    this.assertKey(key);
    await this.repo.delete({ key });
    return { key, content: null, updatedAt: null };
  }
}
