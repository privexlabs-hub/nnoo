export default {
  name: 'archive',
  owns: [
    'elder_profile',
    'recording',
    'recording_status_transition',
    'recording_revision',
    'recording_note',
  ],
  dependsOn: ['community', 'audit'],
  emits: ['RecordingDiscarded'],
  consumes: [],
} as const;
