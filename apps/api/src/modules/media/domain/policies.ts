import {
  ALLOW,
  definePolicy,
  deny,
  isFacilitatorOf,
  requireActiveAccount,
  requireStepUp,
} from '../../../platform/policy.ts';
import type { UploadKind } from './upload.ts';

export type UploadResource = {
  kind: UploadKind;
  recording: {
    facilitatorId: string;
    hometownId: string;
    status: string;
    tier: 'oha' | 'umunna' | 'nso' | null;
  };
  /** Uploading a new statement to change consent on someone else's recording (approved §5). */
  forConsentChange: boolean;
};

/**
 * media.upload (06 §3, docs/plans/phase-1 §5): the recording's facilitator; tier ≠ Nsọ for audio;
 * session audio only after an active consent whose evidence has uploaded. Consent evidence may be
 * uploaded first (it precedes the consent record) and, for a consent change, by any facilitator
 * allowed to make that change (checked by the consent use case).
 */
export const uploadMedia = definePolicy<UploadResource>({
  action: 'media.upload',
  description:
    "The recording's facilitator, in a passkey session; never audio for Nsọ; session audio only after consent evidence.",
  rule: (actor, r) => {
    const base = requireStepUp(actor);
    if (!base.allow || actor.kind !== 'account') return base;
    if (r.kind === 'audio_raw') {
      if (r.recording.tier === 'nso') return deny('media.tier_forbidden'); // INV-2, layer 1 of 3
      if (actor.id !== r.recording.facilitatorId) return deny('authz.denied');
      if (r.recording.status !== 'draft') return deny('media.recording_closed');
      // tier is set exactly when a consent is active, and a consent exists only with uploaded
      // evidence (consent triggers): so this also means "the spoken statement arrived first".
      if (r.recording.tier === null) return deny('media.consent_required');
      return ALLOW;
    }
    // A new spoken statement to narrow or withdraw consent: any facilitator of the hometown (approved
    // §5). Whether they may make that change is decided again when the change is submitted.
    if (r.forConsentChange) {
      return r.kind === 'consent_evidence' && isFacilitatorOf(actor, r.recording.hometownId)
        ? ALLOW
        : deny('authz.denied');
    }
    if (actor.id !== r.recording.facilitatorId) return deny('authz.denied');
    return r.recording.status === 'draft' ? ALLOW : deny('media.recording_closed');
  },
});

export const readOwnUpload = definePolicy<{ createdBy: string | null }>({
  action: 'media.upload.read_own',
  description: 'Whoever created the upload.',
  rule: (actor, r) => {
    const base = requireActiveAccount(actor);
    if (!base.allow || actor.kind !== 'account') return base;
    return actor.id === r.createdBy ? ALLOW : deny('media.not_found', 403);
  },
});
