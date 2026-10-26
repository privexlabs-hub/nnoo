export default {
  name: 'consent',
  owns: ['consent_record'],
  dependsOn: ['archive', 'audit'],
  emits: ['ConsentCaptured', 'ConsentNarrowed', 'ConsentWidened', 'ConsentRevoked'],
  consumes: [],
} as const;
