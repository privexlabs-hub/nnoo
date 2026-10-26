import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { lagosDate, MARKET_DAYS, marketDay, type CalendarAnchor } from './index.ts';

// Test anchor only — real anchors come from governance-approved calendar_anchor rows.
const anchor: CalendarAnchor = { date: '2026-01-01', day: 'eke' };

describe('marketDay', () => {
  it('cycles every four days in order', () => {
    expect(
      ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05'].map((d) =>
        marketDay(anchor, d),
      ),
    ).toEqual(['eke', 'orie', 'afo', 'nkwo', 'eke']);
  });

  it('works before the anchor (positive modulo)', () => {
    expect(marketDay(anchor, '2025-12-31')).toBe('nkwo');
    expect(marketDay(anchor, '2025-12-28')).toBe('eke');
  });

  it('crosses leap days correctly', () => {
    const leap: CalendarAnchor = { date: '2028-02-28', day: 'orie' };
    expect(marketDay(leap, '2028-02-29')).toBe('afo');
    expect(marketDay(leap, '2028-03-01')).toBe('nkwo');
  });

  it('rejects impossible dates', () => {
    expect(() => marketDay(anchor, '2026-02-30')).toThrow(RangeError);
    expect(() => marketDay(anchor, '26-1-1')).toThrow(RangeError);
  });

  it('is periodic with period 4 and independent of which anchor in the same cycle is used', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000, max: 100_000 }),
        fc.integer({ min: 0, max: 50 }),
        (offset, k) => {
          const d = new Date(Date.UTC(2026, 0, 1) + offset * 86_400_000).toISOString().slice(0, 10);
          const d4 = new Date(Date.UTC(2026, 0, 1) + (offset + 4 * k) * 86_400_000)
            .toISOString()
            .slice(0, 10);
          const shifted: CalendarAnchor = { date: '2026-01-02', day: 'orie' };
          return (
            marketDay(anchor, d) === marketDay(anchor, d4) &&
            marketDay(anchor, d) === marketDay(shifted, d)
          );
        },
      ),
    );
  });

  it('only returns known days', () => {
    expect(MARKET_DAYS).toContain(marketDay(anchor, '2030-07-15'));
  });
});

describe('lagosDate', () => {
  it('uses Lagos time (UTC+1), not the host timezone', () => {
    expect(lagosDate(new Date('2026-03-01T22:59:59Z'))).toBe('2026-03-01');
    expect(lagosDate(new Date('2026-03-01T23:00:00Z'))).toBe('2026-03-02');
  });
});
