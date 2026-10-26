export default {
  name: 'community',
  owns: [
    'state',
    'lga',
    'hometown',
    'dialect',
    'hometown_dialect',
    'facilitator_application',
    'facilitator_signoff',
  ],
  dependsOn: ['identity', 'audit'],
  emits: [],
  consumes: [],
} as const;
