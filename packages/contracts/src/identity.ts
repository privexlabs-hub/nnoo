import { z } from 'zod';

const nfc = (s: string) => s === s.normalize('NFC');

/** What the signed-in person may do. Computed by the server with the same can() used to enforce. */
export const MeCapabilities = z.object({
  canEditProfile: z.boolean(),
  canVoteInIkpe: z.boolean(),
  canPostInOha: z.boolean(),
  canApplyAsFacilitator: z.boolean(),
});

export const MeView = z.object({
  id: z.uuid(),
  displayName: z.string().nullable(),
  uiLocale: z.string(),
  ageBand: z.enum(['under_13', 'age_13_17', 'adult']).nullable(),
  identityLevel: z.enum(['none', 'basic', 'in_person']),
  capabilities: MeCapabilities,
});
export type MeView = z.infer<typeof MeView>;

export const UpdateMeBody = z
  .object({
    displayName: z.string().trim().min(1).max(120).refine(nfc, 'must be Unicode NFC'),
    uiLocale: z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/),
  })
  .partial()
  .strict()
  .refine((b) => Object.keys(b).length > 0, 'nothing to update');
export type UpdateMeBody = z.infer<typeof UpdateMeBody>;

export const CreateSessionBody = z
  .object({
    platform: z.enum(['ios', 'android', 'web']),
    deviceId: z.uuid().optional(),
    deviceLabel: z.string().trim().max(80).optional(),
    /** Mobile keeps the refresh token in secure storage; web receives an httpOnly cookie instead. */
    refreshTokenTransport: z.enum(['body', 'cookie']).default('body'),
  })
  .strict();
export type CreateSessionBody = z.infer<typeof CreateSessionBody>;

export const RefreshSessionBody = z
  .object({ refreshToken: z.string().min(40).max(200).optional() })
  .strict();

export const SessionView = z.object({
  sessionId: z.uuid(),
  deviceId: z.uuid(),
  accessToken: z.string(),
  accessTokenExpiresAt: z.string().datetime(),
  refreshToken: z.string().optional(),
  refreshTokenExpiresAt: z.string().datetime(),
});
export type SessionView = z.infer<typeof SessionView>;

export const SignedOutView = z.object({ signedOut: z.literal(true) });
