import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListPartsCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/** Private buckets (ADR-020). Keys are opaque `<kind>/<uuidv7>`. */
export const BUCKETS = [
  'media-uploads',
  'media-masters',
  'media-derivatives',
  'consent-evidence',
] as const;
export type Bucket = (typeof BUCKETS)[number];

/**
 * Storage port (02 §8). Behaviour verified against Neon Object Storage (ADR-032): presigned
 * part URLs work; Content-Type is NOT enforced on presigned PUT (never trust it); deleting an
 * object makes outstanding presigned GETs fail at once.
 */
export interface StoragePort {
  createMultipart(bucket: Bucket, key: string, contentType: string): Promise<string>;
  presignPart(
    bucket: Bucket,
    key: string,
    uploadId: string,
    partNumber: number,
    seconds: number,
  ): Promise<string>;
  listParts(
    bucket: Bucket,
    key: string,
    uploadId: string,
  ): Promise<{ partNumber: number; etag: string; size: number }[]>;
  completeMultipart(
    bucket: Bucket,
    key: string,
    uploadId: string,
    parts: { partNumber: number; etag: string }[],
  ): Promise<void>;
  abortMultipart(bucket: Bucket, key: string, uploadId: string): Promise<void>;
  /** Size in bytes, or null when the object does not exist. */
  head(bucket: Bucket, key: string): Promise<number | null>;
  delete(bucket: Bucket, key: string): Promise<void>;
  presignGet(bucket: Bucket, key: string, seconds: number): Promise<string>;
  presignPut(bucket: Bucket, key: string, contentType: string, seconds: number): Promise<string>;
}

export type S3Config = {
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
};

const notFound = (e: unknown) => {
  const status = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
  return status === 404 || (e as Error).name === 'NotFound' || (e as Error).name === 'NoSuchKey';
};

/** Neon Object Storage through the AWS SDK (path-style, SigV4). Credentials stay server-side. */
export function createS3Storage(cfg: S3Config): StoragePort {
  const s3 = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  });
  return {
    async createMultipart(Bucket, Key, ContentType) {
      const r = await s3.send(new CreateMultipartUploadCommand({ Bucket, Key, ContentType }));
      if (!r.UploadId) throw new Error('storage: no UploadId');
      return r.UploadId;
    },
    presignPart: (Bucket, Key, UploadId, PartNumber, expiresIn) =>
      getSignedUrl(s3, new UploadPartCommand({ Bucket, Key, UploadId, PartNumber }), { expiresIn }),
    async listParts(Bucket, Key, UploadId) {
      const out: { partNumber: number; etag: string; size: number }[] = [];
      let marker: string | undefined;
      do {
        const r = await s3.send(
          new ListPartsCommand({ Bucket, Key, UploadId, PartNumberMarker: marker }),
        );
        for (const p of r.Parts ?? [])
          out.push({ partNumber: p.PartNumber!, etag: p.ETag!, size: p.Size ?? 0 });
        marker = r.IsTruncated ? r.NextPartNumberMarker : undefined;
      } while (marker);
      return out;
    },
    async completeMultipart(Bucket, Key, UploadId, parts) {
      await s3.send(
        new CompleteMultipartUploadCommand({
          Bucket,
          Key,
          UploadId,
          MultipartUpload: {
            Parts: parts.map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
          },
        }),
      );
    },
    async abortMultipart(Bucket, Key, UploadId) {
      await s3.send(new AbortMultipartUploadCommand({ Bucket, Key, UploadId })).catch((e) => {
        if (!notFound(e)) throw e;
      });
    },
    async head(Bucket, Key) {
      try {
        const r = await s3.send(new HeadObjectCommand({ Bucket, Key }));
        return r.ContentLength ?? 0;
      } catch (e) {
        if (notFound(e)) return null;
        throw e;
      }
    },
    async delete(Bucket, Key) {
      await s3.send(new DeleteObjectCommand({ Bucket, Key }));
    },
    presignGet: (Bucket, Key, expiresIn) =>
      getSignedUrl(s3, new GetObjectCommand({ Bucket, Key }), { expiresIn }),
    presignPut: (Bucket, Key, ContentType, expiresIn) =>
      getSignedUrl(s3, new PutObjectCommand({ Bucket, Key, ContentType }), { expiresIn }),
  };
}

/**
 * In-memory storage for tests and local development without buckets. Refused outside
 * local/test at boot. "Presigned" URLs are fake://… strings; tests upload parts with putPart().
 */
export class FakeStorage implements StoragePort {
  readonly objects = new Map<string, number>(); // `${bucket}/${key}` → size
  private readonly uploads = new Map<
    string,
    { bucket: Bucket; key: string; parts: Map<number, number> }
  >();
  private seq = 0;

  async createMultipart(bucket: Bucket, key: string): Promise<string> {
    const id = `up-${++this.seq}`;
    this.uploads.set(id, { bucket, key, parts: new Map() });
    return id;
  }
  async presignPart(
    bucket: Bucket,
    key: string,
    uploadId: string,
    partNumber: number,
  ): Promise<string> {
    return `fake://${bucket}/${key}?uploadId=${uploadId}&partNumber=${partNumber}`;
  }
  /** Test helper: what a device's PUT to a part URL does. */
  putPart(uploadId: string, partNumber: number, size: number): string {
    const u = this.uploads.get(uploadId);
    if (!u) throw new Error('NoSuchUpload');
    u.parts.set(partNumber, size);
    return `"etag-${uploadId}-${partNumber}"`;
  }
  async listParts(_b: Bucket, _k: string, uploadId: string) {
    const u = this.uploads.get(uploadId);
    if (!u) throw Object.assign(new Error('NoSuchUpload'), { $metadata: { httpStatusCode: 404 } });
    return [...u.parts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([partNumber, size]) => ({
        partNumber,
        etag: `"etag-${uploadId}-${partNumber}"`,
        size,
      }));
  }
  async completeMultipart(
    bucket: Bucket,
    key: string,
    uploadId: string,
    parts: { partNumber: number; etag: string }[],
  ) {
    const u = this.uploads.get(uploadId);
    if (!u) throw new Error('NoSuchUpload');
    let size = 0;
    for (const p of parts) {
      if (p.etag !== `"etag-${uploadId}-${p.partNumber}"` || !u.parts.has(p.partNumber))
        throw new Error('InvalidPart');
      size += u.parts.get(p.partNumber)!;
    }
    this.objects.set(`${bucket}/${key}`, size);
    this.uploads.delete(uploadId);
  }
  async abortMultipart(_b: Bucket, _k: string, uploadId: string) {
    this.uploads.delete(uploadId);
  }
  async head(bucket: Bucket, key: string) {
    return this.objects.get(`${bucket}/${key}`) ?? null;
  }
  async delete(bucket: Bucket, key: string) {
    this.objects.delete(`${bucket}/${key}`);
  }
  async presignGet(bucket: Bucket, key: string) {
    return `fake://${bucket}/${key}?get`;
  }
  async presignPut(bucket: Bucket, key: string) {
    return `fake://${bucket}/${key}?put`;
  }
  /** Test helper: an object put directly (e.g. by the audio worker). */
  putObject(bucket: Bucket, key: string, size: number) {
    this.objects.set(`${bucket}/${key}`, size);
  }
}
