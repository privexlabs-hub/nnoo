import { describe, expect, it } from 'vitest';
import { PART_SIZE, partCount, uploadProblem } from './upload.ts';

const sha = 'a'.repeat(64);

describe('upload rules', () => {
  it('plans parts of 8 MiB', () => {
    expect(partCount(1)).toBe(1);
    expect(partCount(PART_SIZE)).toBe(1);
    expect(partCount(PART_SIZE + 1)).toBe(2);
    expect(partCount(30 * 60 * 48_000 * 3)).toBe(31); // a 30-minute 48 kHz 24-bit mono session
  });
  it('accepts declared audio formats and refuses others', () => {
    expect(uploadProblem('audio_raw', 'audio/wav', 10, sha)).toBeNull();
    expect(uploadProblem('audio_raw', 'video/mp4', 10, sha)).toBe('mime_not_allowed');
    expect(uploadProblem('consent_signature', 'audio/wav', 10, sha)).toBe('mime_not_allowed');
  });
  it('enforces size limits and a real SHA-256', () => {
    expect(uploadProblem('audio_raw', 'audio/wav', 0, sha)).toBe('empty');
    expect(uploadProblem('consent_evidence', 'audio/wav', 300 * 1024 ** 2, sha)).toBe('too_large');
    expect(uploadProblem('audio_raw', 'audio/wav', 10, 'xyz')).toBe('bad_sha256');
  });
});
