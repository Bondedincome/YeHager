import { NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SiteContent } from './entities/site-content.entity';
import { SiteContentService } from './site-content.service';

describe('SiteContentService', () => {
  let service: SiteContentService;
  const rows = new Map<string, SiteContent>();

  const repo = {
    findOne: jest.fn(({ where: { key } }: { where: { key: string } }) => Promise.resolve(rows.get(key) ?? null)),
    create: jest.fn((data: Partial<SiteContent>) => ({ ...data }) as SiteContent),
    save: jest.fn((row: SiteContent) => {
      const saved = { ...row, updatedAt: new Date('2026-01-01T00:00:00Z') } as SiteContent;
      rows.set(row.key, saved);
      return Promise.resolve(saved);
    }),
    delete: jest.fn(({ key }: { key: string }) => {
      rows.delete(key);
      return Promise.resolve({ affected: 1 });
    }),
  };

  beforeEach(async () => {
    rows.clear();
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [SiteContentService, { provide: getRepositoryToken(SiteContent), useValue: repo }],
    }).compile();
    service = module.get(SiteContentService);
  });

  it('returns null content when nothing is saved', async () => {
    await expect(service.get('homepage')).resolves.toEqual({ key: 'homepage', content: null, updatedAt: null });
  });

  it('saves and reads back content', async () => {
    await service.set('homepage', { hero: { headline: 'Hi' } });
    const result = await service.get('homepage');
    expect(result.content).toEqual({ hero: { headline: 'Hi' } });
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('updates the existing row instead of creating a second one', async () => {
    await service.set('homepage', { a: 1 });
    await service.set('homepage', { a: 2 });
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect((await service.get('homepage')).content).toEqual({ a: 2 });
  });

  it('rejects unknown keys', async () => {
    await expect(service.get('secrets')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.set('secrets', {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects oversized content', async () => {
    await expect(service.set('homepage', { blob: 'x'.repeat(100_000) })).rejects.toBeInstanceOf(
      PayloadTooLargeException,
    );
  });

  it('reset clears saved content', async () => {
    await service.set('homepage', { a: 1 });
    await service.reset('homepage');
    expect((await service.get('homepage')).content).toBeNull();
  });
});
