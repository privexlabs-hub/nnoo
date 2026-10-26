/**
 * Recording lifecycle (01 §5, docs/03 §4). Mirrors recording_status_transition in the database
 * (a unit test keeps the two identical); the DB trigger stops any path that skips this check.
 */
export type RecordingStatus =
  'draft' | 'in_review' | 'published' | 'returned' | 'withdrawn' | 'unpublished' | 'discarded';
export type Topic = 'story' | 'proverb' | 'song' | 'recipe' | 'craft' | 'place_lore';

export const TRANSITIONS: Readonly<Record<RecordingStatus, readonly RecordingStatus[]>> = {
  draft: ['in_review', 'discarded', 'withdrawn'],
  in_review: ['published', 'returned', 'withdrawn'],
  returned: ['in_review', 'withdrawn', 'discarded'],
  published: ['unpublished', 'withdrawn'],
  withdrawn: [],
  unpublished: [],
  discarded: [],
};

export const canTransition = (from: RecordingStatus, to: RecordingStatus) =>
  TRANSITIONS[from].includes(to);

/** Consent revoked before publication withdraws; after publication unpublishes (02 §5.4). */
export function statusOnRevocation(from: RecordingStatus): RecordingStatus | null {
  if (from === 'published') return 'withdrawn';
  return canTransition(from, 'withdrawn') ? 'withdrawn' : null;
}

/** Recordings that may still receive media and metadata from the facilitator. */
export const isOpenForCapture = (s: RecordingStatus) => s === 'draft' || s === 'returned';
