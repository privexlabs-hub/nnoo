import type { MessageKey } from './en.ts';

// Igbo. Only strings fixed by the brand sources are filled in; every other key falls back to
// English until a native speaker writes it (not machine-translated). Keep tone marks; NFC only.
export const ig: Partial<Record<MessageKey, string>> = {
  'brand.name': 'Nnọọ',
  'brand.principle': 'Igbo enwe eze.',
  'nav.oba': 'Ọbá',
  'nav.ikpe': 'Ikpe',
  'nav.oha': 'Ọha',
  'today.greetingAnon': 'Nnọọ.',
};
