import { Column, Entity, Index } from 'typeorm';
import { BaseModel } from '@database/base.model';

/**
 * Editable storefront content (e.g. the homepage CMS), stored as one JSON
 * document per key so the shape can evolve on the frontend without migrations.
 */
@Entity('site_content')
export class SiteContent extends BaseModel {
  @Index('IDX_site_content_key', { unique: true })
  @Column({ type: 'varchar', length: 64 })
  key: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  content: Record<string, unknown>;
}
