import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseRootTokens, renderTokensModule } from '../scripts/parse.ts';
import { resolveToken, tokens } from './tokens.ts';

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');

describe('design tokens', () => {
  it('tokens.ts is up to date with tokens.css (run `pnpm --filter @nnoo/design-tokens generate`)', () => {
    expect(read('./tokens.ts')).toBe(renderTokensModule(parseRootTokens(read('./tokens.css'))));
  });

  it('tokens.css is identical to the design-system source', () => {
    expect(read('./tokens.css')).toBe(read('../../../docs/Nnoo/shared/colors_and_type.css'));
  });

  it('keeps the brand roles from the design system', () => {
    expect(tokens['--clay-500']).toBe('#c85a26');
    expect(resolveToken('--brand')).toMatch(/^#/);
  });
});
