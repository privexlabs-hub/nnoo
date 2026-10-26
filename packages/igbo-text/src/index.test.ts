import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { assertNfc, fold, hasToneMarks, IgboTextError, isNfc, nfc } from './index.ts';

describe('nfc', () => {
  it('composes decomposed dotted vowels and tone marks', () => {
    const decomposed = 'ụlọ';
    expect(nfc(decomposed)).toBe('ụlọ');
    expect(isNfc(decomposed)).toBe(false);
    expect(isNfc('ụlọ')).toBe(true);
  });

  it('keeps stacked marks (dot below + grave) in canonical order', () => {
    const a = nfc('ụ̀');
    const b = nfc('ụ̀');
    expect(a).toBe(b);
    expect(a).toBe('ụ̀');
  });

  it('assertNfc rejects instead of rewriting', () => {
    expect(() => assertNfc('ọ', 'title_ig')).toThrow(IgboTextError);
    expect(assertNfc('Nnọọ')).toBe('Nnọọ');
  });

  it('is idempotent for any string', () => {
    fc.assert(fc.property(fc.string({ unit: 'grapheme' }), (s) => nfc(nfc(s)) === nfc(s)));
  });
});

describe('fold (search key only)', () => {
  it.each([
    ['ụlọ', 'ulo'],
    ['Ọbá', 'oba'],
    ['Nnọọ', 'nnoo'],
    ['Ndị Igbo', 'ndi igbo'],
    ['Ụbọchị ahịa', 'ubochi ahia'],
    ['ṅ', 'n'],
    ['akwụ̀kwọ́', 'akwukwo'],
    ['İ', 'i'],
  ])('%s → %s', (input, expected) => {
    expect(fold(input)).toBe(expected);
  });

  it('gives the same key for precomposed and decomposed input', () => {
    expect(fold('ọ́')).toBe(fold('ọ́'));
  });

  it('is idempotent and never longer than its input', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'grapheme' }), (s) => {
        const f = fold(s);
        return fold(f) === f && f.normalize('NFD').length <= s.normalize('NFD').length;
      }),
    );
  });
});

describe('hasToneMarks', () => {
  it('detects tone marks but not dots below alone', () => {
    expect(hasToneMarks('ụ̀lọ́')).toBe(true);
    expect(hasToneMarks('ụlọ')).toBe(false);
  });
});
