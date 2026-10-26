import { identity } from '@nnoo/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authed } from '../auth/session.ts';
import { parse } from './client.ts';

export const meKey = ['me'] as const;

export const useMe = (enabled = true) =>
  useQuery({
    queryKey: meKey,
    queryFn: async ({ signal }) => parse(await authed('/v1/me', { signal }), identity.MeView),
    enabled,
  });

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: identity.UpdateMeBody) =>
      parse(await authed('/v1/me', { method: 'PATCH', json: body }), identity.MeView),
    onSuccess: (me) => qc.setQueryData(meKey, me),
  });
}
