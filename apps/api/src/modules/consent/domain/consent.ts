/**
 * Consent rules (01 §8, ADR-031). Pure. "The voice belongs to the elder": narrowing and
 * withdrawal take effect at once and anyone with standing may record them; widening needs
 * the elder present (or a steward, only up to what the elder pre-authorised).
 */
export type Tier = 'oha' | 'umunna' | 'nso';

/** How open a tier is: Ọha (public) > Umunna (kin only) > Nsọ (metadata only). */
export const OPENNESS: Record<Tier, number> = { nso: 0, umunna: 1, oha: 2 };

export type Terms = {
  tier: Tier;
  umunnaScope: readonly string[] | null;
  allowArchive: boolean;
  allowLessons: boolean;
  allowSocial: boolean;
  allowPhoto: boolean;
  allowMachineAssist: boolean;
};

export type TermsProblem =
  'umunna_scope_required' | 'umunna_scope_only_for_umunna' | 'nso_restricted' | 'scope_too_large';

/** Returns the first problem with a set of terms, or null when they are valid. */
export function termsProblem(t: Terms): TermsProblem | null {
  if (t.tier === 'umunna' && (!t.umunnaScope || t.umunnaScope.length === 0))
    return 'umunna_scope_required';
  if (t.tier !== 'umunna' && t.umunnaScope && t.umunnaScope.length > 0)
    return 'umunna_scope_only_for_umunna';
  if (t.umunnaScope && t.umunnaScope.length > 3) return 'scope_too_large'; // a person has up to 3 hometowns (01 §7)
  // Nsọ is metadata only: never lessons, social media or machine processing.
  if (t.tier === 'nso' && (t.allowLessons || t.allowSocial || t.allowMachineAssist))
    return 'nso_restricted';
  return null;
}

const PERMISSIONS = [
  'allowArchive',
  'allowLessons',
  'allowSocial',
  'allowPhoto',
  'allowMachineAssist',
] as const;

export type Change = 'same' | 'narrowing' | 'widening' | 'amending';

/**
 * Classifies a change of terms. Anything that lets more people hear, or more uses happen,
 * counts as widening, even if something else narrows at the same time.
 */
export function classify(prev: Terms, next: Terms): Change {
  let wider = false;
  let narrower = false;

  const d = OPENNESS[next.tier] - OPENNESS[prev.tier];
  if (d > 0) wider = true;
  if (d < 0) narrower = true;
  if (prev.tier === 'umunna' && next.tier === 'umunna') {
    const before = new Set(prev.umunnaScope ?? []);
    const after = new Set(next.umunnaScope ?? []);
    if ([...after].some((h) => !before.has(h))) wider = true;
    if ([...before].some((h) => !after.has(h))) narrower = true;
  }
  for (const p of PERMISSIONS) {
    if (!prev[p] && next[p]) wider = true;
    if (prev[p] && !next[p]) narrower = true;
  }
  if (wider) return 'widening';
  if (narrower) return 'narrowing';
  return 'same';
}

/**
 * A steward may widen only the tier, and only up to the elder's pre-authorisation; they never
 * switch on a use the elder did not grant (01 §3: "widen consent beyond what the elder granted").
 */
export function stewardMayWiden(prev: Terms, next: Terms, preAuthorised: Tier | null): boolean {
  if (!preAuthorised) return false;
  if (OPENNESS[next.tier] > OPENNESS[preAuthorised]) return false;
  return PERMISSIONS.every((p) => !(next[p] && !prev[p]));
}

/** When the elder has died and named no steward, consent is frozen: it can only narrow (01 §8). */
export const frozen = (elderDeceased: boolean, hasSteward: boolean) => elderDeceased && !hasSteward;

/** Whether audio may exist in storage at all for these terms (INV-2). */
export const audioAllowed = (t: Pick<Terms, 'tier'>) => t.tier !== 'nso';
