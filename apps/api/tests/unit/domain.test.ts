import { describe, expect, it } from 'vitest';
import {
  applyAsFacilitator,
  ikpeVoterBaseline,
  ohaPosterBaseline,
  readMe,
} from '../../src/modules/identity/domain/policies.ts';
import { amrForPath } from '../../src/modules/identity/infrastructure/auth.ts';
import { ANONYMOUS, hasRole, type AccountActor } from '../../src/platform/actor.ts';
import { fixedClock } from '../../src/platform/clock.ts';
import { backoffSeconds } from '../../src/platform/jobs/queue.ts';
import { createLogger } from '../../src/platform/logger.ts';

const NOW = new Date('2026-10-25T12:00:00Z');
const clock = fixedClock(NOW);
const ctx = { clock };
const DAY = 86_400_000;

function adult(over: Partial<AccountActor> = {}): AccountActor {
  return {
    kind: 'account',
    id: '0192f000-0000-7000-8000-000000000001',
    sessionId: '0192f000-0000-7000-8000-0000000000aa',
    status: 'active',
    ageBand: 'adult',
    identityLevel: 'basic',
    accountCreatedAt: new Date(NOW.getTime() - 30 * DAY),
    amr: ['otp'],
    roles: [{ role: 'learner', scopeType: 'global', scopeId: null }],
    ...over,
  };
}

describe('Ikpe voter baseline (01 §6 + Brief §22: 18+)', () => {
  it('allows an adult, verified, 7-day-old active account', () => {
    expect(
      ikpeVoterBaseline.rule(
        adult({ accountCreatedAt: new Date(NOW.getTime() - 7 * DAY) }),
        undefined,
        ctx,
      ).allow,
    ).toBe(true);
  });
  it('rejects an account aged 6d23h (07 §3)', () => {
    expect(
      ikpeVoterBaseline.rule(
        adult({ accountCreatedAt: new Date(NOW.getTime() - 7 * DAY + 3_600_000) }),
        undefined,
        ctx,
      ).allow,
    ).toBe(false);
  });
  it.each(['under_13', 'age_13_17', null] as const)('rejects age band %s', (ageBand) => {
    expect(ikpeVoterBaseline.rule(adult({ ageBand }), undefined, ctx).allow).toBe(false);
  });
  it('rejects identity level none', () => {
    expect(ikpeVoterBaseline.rule(adult({ identityLevel: 'none' }), undefined, ctx).allow).toBe(
      false,
    );
  });
  it('rejects suspended and anonymous actors with the right codes', () => {
    expect(ikpeVoterBaseline.rule(adult({ status: 'suspended' }), undefined, ctx)).toEqual({
      allow: false,
      code: 'identity.suspended',
      status: 403,
    });
    expect(ikpeVoterBaseline.rule(ANONYMOUS, undefined, ctx)).toEqual({
      allow: false,
      code: 'auth.unauthenticated',
      status: 401,
    });
  });
});

describe('other baselines', () => {
  it('minors never post in Ọha', () => {
    expect(ohaPosterBaseline.rule(adult({ ageBand: 'age_13_17' }), undefined, ctx).allow).toBe(
      false,
    );
    expect(ohaPosterBaseline.rule(adult(), undefined, ctx).allow).toBe(true);
  });
  it('facilitators cannot apply again; minors cannot apply', () => {
    expect(
      applyAsFacilitator.rule(
        adult({ roles: [{ role: 'facilitator', scopeType: 'hometown', scopeId: 'h' }] }),
        undefined,
        ctx,
      ).allow,
    ).toBe(false);
    expect(applyAsFacilitator.rule(adult({ ageBand: 'under_13' }), undefined, ctx).allow).toBe(
      false,
    );
    expect(applyAsFacilitator.rule(adult(), undefined, ctx).allow).toBe(true);
  });
  it('reading your own profile needs an active account', () => {
    expect(readMe.rule(ANONYMOUS, undefined, ctx).allow).toBe(false);
    expect(readMe.rule(adult(), undefined, ctx).allow).toBe(true);
  });
  it('hasRole respects scope', () => {
    const a = adult({ roles: [{ role: 'kin', scopeType: 'hometown', scopeId: 'nnewi' }] });
    expect(hasRole(a, 'kin', 'nnewi')).toBe(true);
    expect(hasRole(a, 'kin', 'owerri')).toBe(false);
    expect(hasRole(ANONYMOUS, 'kin')).toBe(false);
  });
});

describe('amrForPath', () => {
  it.each([
    ['/passkey/verify-authentication', 'passkey'],
    ['/phone-number/verify', 'otp'],
    ['/sign-in/email-otp', 'otp'],
    ['/sign-up/email', null],
    [undefined, null],
  ])('%s → %s', (path, expected) => expect(amrForPath(path)).toBe(expected));
});

describe('job backoff', () => {
  it('grows and is capped at one hour (±20% jitter)', () => {
    expect(backoffSeconds(1, () => 0.5)).toBe(10);
    expect(backoffSeconds(3, () => 0.5)).toBe(40);
    expect(backoffSeconds(30, () => 1)).toBeLessThanOrEqual(3600 * 1.2);
    expect(backoffSeconds(30, () => 0)).toBeGreaterThanOrEqual(3600 * 0.8);
  });
});

describe('logger', () => {
  it('redacts secret-looking fields', () => {
    const lines: string[] = [];
    const log = createLogger({ env: 'test' }, 'info', (l) => lines.push(l));
    log.info('x', {
      phoneNumber: '+2348000000000',
      refreshToken: 'abc',
      AUTH_SECRET: 's',
      route: '/v1/me',
    });
    const out = JSON.parse(lines[0]!);
    expect(out.phoneNumber).toBe('[redacted]');
    expect(out.refreshToken).toBe('[redacted]');
    expect(out.AUTH_SECRET).toBe('[redacted]');
    expect(out.route).toBe('/v1/me');
  });
});
