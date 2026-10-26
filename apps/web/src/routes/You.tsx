import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import type { MessageKey } from '@nnoo/i18n';
import { ApiError } from '../api/client.ts';
import { useMe, useUpdateMe } from '../api/me.ts';
import { deletePasskey, listPasskeys, registerPasskey } from '../auth/ceremony.ts';
import { signOut } from '../auth/session.ts';
import { useT } from '../i18n.tsx';
import { messageFor } from '../ui/errors.ts';
import { Button, Card, Eyebrow, Notice } from '../ui/primitives.tsx';

export function You() {
  const t = useT();
  const me = useMe();
  if (me.isPending) return <p className="muted">{t('loading')}</p>;
  if (me.isError || !me.data) return <Notice kind="error">{t(messageFor(me.error))}</Notice>;
  const m = me.data;
  return (
    <>
      <Eyebrow>{t('you.eyebrow')}</Eyebrow>
      <h1 className="page-title">{m.displayName ?? t('you.unnamed')}</h1>
      <p className="lede">
        {t('you.identity')}: {t(`you.identity.${m.identityLevel}` as MessageKey)}
      </p>
      <div className="stack">
        {m.capabilities.canEditProfile && <Profile current={m.displayName ?? ''} />}
        <Passkeys />
        <div>
          <Button variant="secondary" onClick={() => void signOut()}>
            {t('you.signOut')}
          </Button>
        </div>
      </div>
    </>
  );
}

function Profile({ current }: { current: string }) {
  const t = useT();
  const [name, setName] = useState(current);
  const update = useUpdateMe();
  useEffect(() => setName(current), [current]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const displayName = name.normalize('NFC').trim(); // keep tone marks; store NFC
    if (displayName && displayName !== current) update.mutate({ displayName });
  };
  return (
    <Card>
      <h2 className="h3">{t('you.profile')}</h2>
      <form onSubmit={submit} className="row">
        <label className="field">
          <span className="field__label">{t('you.displayName')}</span>
          <input
            className="field__input"
            name="displayName"
            autoComplete="name"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <Button type="submit" busy={update.isPending}>
          {update.isPending ? t('you.saving') : t('you.save')}
        </Button>
      </form>
      {update.isSuccess && <Notice kind="ok">{t('you.saved')}</Notice>}
      {update.isError && <Notice kind="error">{t(messageFor(update.error))}</Notice>}
    </Card>
  );
}

function Passkeys() {
  const t = useT();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['passkeys'], queryFn: listPasskeys });
  const add = useMutation({
    mutationFn: () => registerPasskey(`${navigator.platform || 'This device'}`.slice(0, 60)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['passkeys'] }),
  });
  const remove = useMutation({
    mutationFn: deletePasskey,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['passkeys'] }),
  });
  const needsFreshSignIn =
    list.data === null || (add.error instanceof ApiError && add.error.status === 401);
  const supported = typeof window.PublicKeyCredential === 'function';

  return (
    <Card>
      <h2 className="h3">{t('you.passkeys')}</h2>
      <p className="muted">{t('you.passkeysBody')}</p>
      {list.data && list.data.length === 0 && <p>{t('you.passkeysNone')}</p>}
      {list.data && list.data.length > 0 && (
        <ul className="list">
          {list.data.map((p) => (
            <li key={p.id} className="list__row">
              <span>{p.name ?? p.id.slice(0, 8)}</span>
              <span className="muted">{p.createdAt.toLocaleDateString()}</span>
              <Button variant="ghost" busy={remove.isPending} onClick={() => remove.mutate(p.id)}>
                {t('you.removePasskey')}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {needsFreshSignIn ? (
        <Notice kind="error">{t('you.passkeyNeedsFreshSignIn')}</Notice>
      ) : (
        supported && (
          <Button busy={add.isPending} onClick={() => add.mutate()}>
            {add.isPending ? t('you.addingPasskey') : t('you.addPasskey')}
          </Button>
        )
      )}
      {add.isSuccess && <Notice kind="ok">{t('you.passkeyAdded')}</Notice>}
      {add.isError && !needsFreshSignIn && <Notice kind="error">{t('you.passkeyFailed')}</Notice>}
    </Card>
  );
}
