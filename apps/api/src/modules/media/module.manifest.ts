export default {
  name: 'media',
  owns: ['media_asset', 'upload_session'],
  dependsOn: ['archive', 'audit'],
  emits: ['DerivativesReady'],
  consumes: ['ConsentRevoked', 'ConsentNarrowed', 'RecordingDiscarded'],
} as const;
