/**
 * The four-day Igbo market week (01 §13, 03 §8). Pure: no clock, no local time.
 *
 * The anchor (a date known to be a given market day, per community variant) is
 * governance-approved data stored in `calendar_anchor`. It is always passed in;
 * this package never assumes one.
 */
export const MARKET_DAYS = ['eke', 'orie', 'afo', 'nkwo'] as const;
export type MarketDay = (typeof MARKET_DAYS)[number];

export const CALENDAR_TIME_ZONE = 'Africa/Lagos';
export const ALGO_VERSION = 'market-day@1';

export type CalendarAnchor = {
  /** ISO calendar date (YYYY-MM-DD), interpreted in Africa/Lagos. */
  date: string;
  day: MarketDay;
};

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function epochDay(isoDate: string): number {
  const m = ISO_DATE.exec(isoDate);
  if (!m) throw new RangeError(`not an ISO date: ${isoDate}`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(y, mo - 1, d);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
    throw new RangeError(`not a real date: ${isoDate}`);
  }
  return Math.round(ms / MS_PER_DAY);
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Market day for a Lagos calendar date. O(1). */
export function marketDay(anchor: CalendarAnchor, isoDate: string): MarketDay {
  const offset = epochDay(isoDate) - epochDay(anchor.date);
  const index = mod(MARKET_DAYS.indexOf(anchor.day) + offset, MARKET_DAYS.length);
  return MARKET_DAYS[index]!;
}

/** The Lagos calendar date for an instant. Callers pass the instant from an injected clock. */
export function lagosDate(instant: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CALENDAR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
