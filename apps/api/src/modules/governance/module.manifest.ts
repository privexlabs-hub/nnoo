export default {
  name: 'governance',
  owns: ['governance_event'],
  dependsOn: ['identity', 'audit'],
  emits: [],
  consumes: [],
} as const;
