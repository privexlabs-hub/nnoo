import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { classify, frozen, stewardMayWiden, termsProblem, type Terms } from './consent.ts';

const base: Terms = {
  tier: 'oha',
  umunnaScope: null,
  allowArchive: true,
  allowLessons: true,
  allowSocial: false,
  allowPhoto: false,
  allowMachineAssist: false,
};
const H1 = '0192f000-0000-7000-8000-000000000101';
const H2 = '0192f000-0000-7000-8000-000000000102';

describe('terms', () => {
  it('requires an Umunna scope for Umunna and only then', () => {
    expect(termsProblem({ ...base, tier: 'umunna' })).toBe('umunna_scope_required');
    expect(termsProblem({ ...base, tier: 'umunna', umunnaScope: [H1] })).toBeNull();
    expect(termsProblem({ ...base, umunnaScope: [H1] })).toBe('umunna_scope_only_for_umunna');
  });
  it('keeps Nsọ out of lessons, social media and machines', () => {
    expect(termsProblem({ ...base, tier: 'nso' })).toBe('nso_restricted');
    expect(termsProblem({ ...base, tier: 'nso', allowLessons: false })).toBeNull();
    expect(
      termsProblem({ ...base, tier: 'nso', allowLessons: false, allowMachineAssist: true }),
    ).toBe('nso_restricted');
  });
});

describe('classify', () => {
  it('Ọha → Umunna is narrowing (S-04); Umunna → Ọha is widening', () => {
    const umunna = { ...base, tier: 'umunna' as const, umunnaScope: [H1] };
    expect(classify(base, umunna)).toBe('narrowing');
    expect(classify(umunna, base)).toBe('widening');
  });
  it('any narrowing to Nsọ is narrowing', () => {
    expect(classify(base, { ...base, tier: 'nso', allowLessons: false })).toBe('narrowing');
  });
  it('adding a hometown to the Umunna scope is widening; removing one is narrowing', () => {
    const one = { ...base, tier: 'umunna' as const, umunnaScope: [H1] };
    const two = { ...one, umunnaScope: [H1, H2] };
    expect(classify(one, two)).toBe('widening');
    expect(classify(two, one)).toBe('narrowing');
  });
  it('switching on any use is widening, even alongside a narrowing', () => {
    expect(classify(base, { ...base, allowLessons: false, allowSocial: true })).toBe('widening');
  });
  it('identical terms are "same"', () => {
    expect(classify(base, { ...base })).toBe('same');
  });
  it('is anti-symmetric: if a→b narrows then b→a widens', () => {
    const terms = fc
      .record({
        tier: fc.constantFrom('oha' as const, 'umunna' as const, 'nso' as const),
        allowArchive: fc.boolean(),
        allowLessons: fc.boolean(),
        allowSocial: fc.boolean(),
        allowPhoto: fc.boolean(),
        allowMachineAssist: fc.boolean(),
      })
      .map((t) => ({ ...t, umunnaScope: t.tier === 'umunna' ? [H1] : null }));
    fc.assert(
      fc.property(terms, terms, (a, b) => {
        const ab = classify(a, b);
        if (ab === 'narrowing') return classify(b, a) === 'widening';
        return true;
      }),
    );
  });
});

describe('stewards', () => {
  it('may widen the tier only up to the pre-authorisation', () => {
    const nso = { ...base, tier: 'nso' as const, allowLessons: false };
    const umunna = { ...base, tier: 'umunna' as const, umunnaScope: [H1], allowLessons: false };
    expect(stewardMayWiden(nso, umunna, 'umunna')).toBe(true);
    expect(stewardMayWiden(nso, { ...base, allowLessons: false }, 'umunna')).toBe(false);
    expect(stewardMayWiden(nso, umunna, null)).toBe(false);
  });
  it('never switch on a use the elder did not grant', () => {
    const prev = { ...base, allowSocial: false };
    expect(stewardMayWiden(prev, { ...prev, allowSocial: true }, 'oha')).toBe(false);
  });
  it('consent freezes when the elder has died without a steward', () => {
    expect(frozen(true, false)).toBe(true);
    expect(frozen(true, true)).toBe(false);
    expect(frozen(false, false)).toBe(false);
  });
});
