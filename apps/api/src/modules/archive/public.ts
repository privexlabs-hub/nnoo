// The only file other modules may import from `archive` (04 §3).
export {
  applyRevocation,
  lockRecordingForConsent,
  recordingForMedia,
  tierOf,
  type RecordingForConsent,
  type RecordingForMedia,
} from './application/recordings.ts';
export { archiveRoutes } from './http/routes.ts';
