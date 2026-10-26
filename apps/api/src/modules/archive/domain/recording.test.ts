import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  canTransition,
  statusOnRevocation,
  TRANSITIONS,
  type RecordingStatus,
} from './recording.ts';

describe('recording state machine', () => {
  it('matches the transitions seeded in the database migration exactly', () => {
    const sql = readFileSync(
      new URL('../../../../migrations/0004_custom_capture_rules.sql', import.meta.url),
      'utf8',
    );
    const block = sql.slice(
      sql.indexOf('INSERT INTO recording_status_transition'),
      sql.indexOf('CREATE FUNCTION recording_status_guard'),
    );
    const seeded = [...block.matchAll(/\('([a-z_]+)', '([a-z_]+)'\)/g)]
      .map((m) => `${m[1]}>${m[2]}`)
      .sort();
    const domain = Object.entries(TRANSITIONS)
      .flatMap(([f, ts]) => ts.map((t) => `${f}>${t}`))
      .sort();
    expect(seeded).toEqual(domain);
  });

  it('terminal states have no way out', () => {
    for (const s of ['withdrawn', 'unpublished', 'discarded'] as RecordingStatus[])
      expect(TRANSITIONS[s]).toEqual([]);
  });

  it('a draft can never jump straight to published (INV-1)', () => {
    expect(canTransition('draft', 'published')).toBe(false);
  });

  it('revocation withdraws from every non-terminal state', () => {
    for (const s of ['draft', 'in_review', 'returned', 'published'] as RecordingStatus[])
      expect(statusOnRevocation(s)).toBe('withdrawn');
    expect(statusOnRevocation('discarded')).toBeNull();
  });
});
