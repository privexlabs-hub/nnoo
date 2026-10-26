/**
 * Igbo text rules (01 §2.4, INV-9, ADR-014).
 *
 * - Stored and displayed text is Unicode NFC. Tone marks and dotted vowels are
 *   content and are never stripped from stored or displayed text.
 * - `fold()` produces a search key only. It must stay byte-identical to the SQL
 *   function `igbo_fold()` (see apps/api/migrations), which a parity test checks.
 */

/**
 * Combining marks removed for search keys:
 * grave (low tone), acute (high tone), macron (downstep), dot above (ṅ), dot below (ị ọ ụ).
 */
export const FOLDED_COMBINING_MARKS = ['̀', '́', '̄', '̇', '̣'] as const;

const FOLD_PATTERN = new RegExp(`[${FOLDED_COMBINING_MARKS.join('')}]`, 'gu');

export function nfc(text: string): string {
  return text.normalize('NFC');
}

export function isNfc(text: string): boolean {
  return text === text.normalize('NFC');
}

export class IgboTextError extends Error {
  override name = 'IgboTextError';
}

/** Rejects non-NFC input instead of silently rewriting what a person typed. */
export function assertNfc(text: string, field = 'text'): string {
  if (!isNfc(text)) throw new IgboTextError(`${field} must be Unicode NFC`);
  return text;
}

/** Search key: lowercased, tone marks and dots removed. Never display this. */
export function fold(text: string): string {
  // Same order as SQL igbo_fold(): decompose, strip marks, lowercase, recompose. After the
  // marks are gone Igbo base letters are ASCII, so lowercasing does not depend on DB collation.
  return text.normalize('NFD').replace(FOLD_PATTERN, '').toLowerCase().normalize('NFC');
}

/** True when the text carries at least one tone mark (grave, acute or macron). */
export function hasToneMarks(text: string): boolean {
  return /[̀́̄]/u.test(text.normalize('NFD'));
}
