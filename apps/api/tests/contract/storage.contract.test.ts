/**
 * Contract test of our S3 adapter against real Neon Object Storage (ADR-032). Opt-in: needs a
 * branch's storage credentials in the environment (never production):
 *   neon env pull --branch dev/<you> --service object-storage --file .local/storage.env
 *   set -a; . .local/storage.env; set +a; pnpm --filter @nnoo/api test:contract
 */
import { randomBytes } from 'node:crypto';
import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';
import { createS3Storage } from '../../src/modules/media/public.ts';

const env = process.env;
const configured = !!(
  env.AWS_ACCESS_KEY_ID &&
  env.AWS_SECRET_ACCESS_KEY &&
  env.AWS_ENDPOINT_URL_S3 &&
  env.AWS_REGION
);

describe.skipIf(!configured)('S3 adapter on Neon Object Storage', () => {
  const s = configured
    ? createS3Storage({
        region: env.AWS_REGION!,
        endpoint: env.AWS_ENDPOINT_URL_S3!,
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      })
    : (undefined as never);

  it('multipart via presigned part URLs → list → complete → head → presigned GET → delete', async () => {
    const key = `audio_raw/${uuidv7()}`;
    const part1 = randomBytes(8 * 1024 * 1024);
    const part2 = randomBytes(1024);
    const uploadId = await s.createMultipart('media-uploads', key, 'audio/wav');

    const url1 = await s.presignPart('media-uploads', key, uploadId, 1, 600);
    const r1 = await fetch(url1, { method: 'PUT', body: part1 });
    expect(r1.status).toBe(200);
    // Interrupted here: resume asks which parts are stored.
    expect((await s.listParts('media-uploads', key, uploadId)).map((p) => p.partNumber)).toEqual([
      1,
    ]);
    const url2 = await s.presignPart('media-uploads', key, uploadId, 2, 600);
    const r2 = await fetch(url2, { method: 'PUT', body: part2 });
    const parts = [
      { partNumber: 1, etag: r1.headers.get('etag')! },
      { partNumber: 2, etag: r2.headers.get('etag')! },
    ];
    await s.completeMultipart('media-uploads', key, uploadId, parts);
    expect(await s.head('media-uploads', key)).toBe(part1.length + part2.length);

    const get = await s.presignGet('media-uploads', key, 60);
    expect((await fetch(get)).status).toBe(200);
    expect((await fetch(`${env.AWS_ENDPOINT_URL_S3}/media-uploads/${key}`)).status).toBe(403); // private

    await s.delete('media-uploads', key);
    expect(await s.head('media-uploads', key)).toBeNull();
    expect((await fetch(get)).status).toBe(404); // outstanding URL dies at once (INV-7)
  });

  it('aborting a multipart upload is safe to repeat', async () => {
    const key = `audio_raw/${uuidv7()}`;
    const id = await s.createMultipart('media-uploads', key, 'audio/wav');
    await s.abortMultipart('media-uploads', key, id);
    await s.abortMultipart('media-uploads', key, id);
  });

  it('a presigned PUT works for worker outputs, and every bucket is private', async () => {
    for (const bucket of ['media-masters', 'media-derivatives', 'consent-evidence'] as const) {
      const key = `peaks/${uuidv7()}`;
      const put = await s.presignPut(bucket, key, 'application/json', 60);
      expect(
        (
          await fetch(put, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: '[]',
          })
        ).status,
      ).toBe(200);
      expect((await fetch(`${env.AWS_ENDPOINT_URL_S3}/${bucket}/${key}`)).status).toBe(403);
      await s.delete(bucket, key);
    }
  });
});
