import { en, type MessageKey } from './en.ts';
import { ig } from './ig.ts';

export { en, ig, type MessageKey };

export const LOCALES = ['en', 'ig'] as const;
export type Locale = (typeof LOCALES)[number];

const catalogues: Record<Locale, Partial<Record<MessageKey, string>>> = { en, ig };

/** Picks a supported locale from a BCP 47 tag ("ig-NG" → "ig"); anything else is English. */
export function resolveLocale(tag: string | null | undefined): Locale {
  const base = (tag ?? '').toLowerCase().split('-')[0];
  return (LOCALES as readonly string[]).includes(base ?? '') ? (base as Locale) : 'en';
}

export type Translate = (key: MessageKey, vars?: Record<string, string>) => string;

/** `{name}` placeholders are replaced; values are inserted as text, never as markup. */
export function translator(locale: Locale): Translate {
  const cat = catalogues[locale];
  return (key, vars) => {
    const template = cat[key] ?? en[key];
    return vars ? template.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m) : template;
  };
}
