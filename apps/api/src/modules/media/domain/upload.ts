/**
 * Upload rules (docs/neon/05 §3, 06 §5). Pure. Formats here are what a client may *declare*;
 * Neon does not enforce Content-Type (ADR-032), so the audio worker re-probes every file.
 */
export type UploadKind = 'audio_raw' | 'consent_evidence' | 'consent_signature';

export const PART_SIZE = 8 * 1024 * 1024; // 8 MiB
export const MAX_PARTS = 10_000;

const AUDIO = [
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/mp4',
  'audio/aac',
  'audio/ogg',
  'audio/opus',
];

export const UPLOAD_RULES: Record<
  UploadKind,
  { mimes: readonly string[]; maxBytes: number; bucket: 'media-uploads' | 'consent-evidence' }
> = {
  // 48 kHz mono 24-bit PCM is ~8.6 MB/min: 2 GiB holds a long session with room to spare.
  audio_raw: { mimes: AUDIO, maxBytes: 2 * 1024 ** 3, bucket: 'media-uploads' },
  consent_evidence: { mimes: AUDIO, maxBytes: 200 * 1024 ** 2, bucket: 'consent-evidence' },
  consent_signature: {
    mimes: ['image/jpeg', 'image/png'],
    maxBytes: 15 * 1024 ** 2,
    bucket: 'consent-evidence',
  },
};

export type UploadProblem = 'mime_not_allowed' | 'too_large' | 'empty' | 'bad_sha256';

export function uploadProblem(
  kind: UploadKind,
  mime: string,
  bytes: number,
  sha256Hex: string,
): UploadProblem | null {
  const rule = UPLOAD_RULES[kind];
  if (!rule.mimes.includes(mime)) return 'mime_not_allowed';
  if (bytes <= 0) return 'empty';
  if (bytes > rule.maxBytes) return 'too_large';
  if (!/^[0-9a-f]{64}$/.test(sha256Hex)) return 'bad_sha256';
  return null;
}

/** Number of parts for a file; every part is PART_SIZE except the last. */
export function partCount(bytes: number, partSize = PART_SIZE): number {
  return Math.max(1, Math.ceil(bytes / partSize));
}

/** Opaque storage key: no names, places or titles (05 §1). */
export const storageKey = (kind: string, id: string) => `${kind}/${id}`;
