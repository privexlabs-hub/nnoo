// The only file other modules may import from `identity` (04 §3).
export { createActorLoader, type ActorLoader } from './application/actors.ts';
export { createAuth, type Auth } from './infrastructure/auth.ts';
export { createTokenService, type TokenService } from './infrastructure/tokens.ts';
export { FakeInbox, type EmailPort, type SmsPort } from './infrastructure/ports.ts';
export { identityRoutes } from './http/routes.ts';
export { grantRole, type GrantRole } from './application/roles.ts';
