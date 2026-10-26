// The only file other modules may import from `media` (04 §3).
export {
  createS3Storage,
  FakeStorage,
  BUCKETS,
  type Bucket,
  type StoragePort,
} from './infrastructure/storage.ts';
export { mediaRoutes, mediaInternalRoutes } from './http/routes.ts';
export { mediaJobs, mediaConsumes } from './jobs.ts';
