import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateSiteContentDto {
  @ApiProperty({
    description: 'The full content document for this key (replaces the stored one).',
    example: { hero: { headline: 'Matching Sets' } },
  })
  @IsObject()
  content: Record<string, unknown>;
}
