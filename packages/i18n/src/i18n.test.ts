import { describe, expect, it } from 'vitest';
import { en, ig, resolveLocale, translator, type MessageKey } from './index.ts';

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('catalogues', () => {
  it('stores every string as NFC (never strip tone marks)', () => {
    for (const s of [...Object.values(en), ...Object.values(ig)])
      expect(s).toBe(s.normalize('NFC'));
  });

  it('keeps the same placeholders in every translation', () => {
    for (const [k, v] of Object.entries(ig))
      expect(placeholders(v!)).toEqual(placeholders(en[k as MessageKey]));
  });

  it('has no emoji in UI chrome (brand voice)', () => {
    for (const s of [...Object.values(en), ...Object.values(ig)])
      expect(s).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

describe('translator', () => {
  it('falls back to English key by key', () => {
    const t = translator('ig');
    expect(t('nav.oba')).toBe('Ọbá');
    expect(t('you.signOut')).toBe(en['you.signOut']);
  });

  it('fills placeholders and leaves unknown ones visible', () => {
    const t = translator('en');
    expect(t('today.greeting', { name: 'Ọbịageli' })).toBe('Nnọọ, Ọbịageli.');
    expect(t('today.greeting')).toBe('Nnọọ, {name}.');
  });

  it('resolves locales conservatively', () => {
    expect(resolveLocale('ig-NG')).toBe('ig');
    expect(resolveLocale('fr')).toBe('en');
    expect(resolveLocale(undefined)).toBe('en');
  });
});
