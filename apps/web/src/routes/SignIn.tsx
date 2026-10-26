import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client.ts';
import {
  E164,
  normalisePhone,
  sendEmailCode,
  sendPhoneCode,
  signInWithPasskey,
  verifyEmailCode,
  verifyPhoneCode,
} from '../auth/ceremony.ts';
import { exchangeCeremony } from '../auth/session.ts';
import { useT } from '../i18n.tsx';
import { messageFor } from '../ui/errors.ts';
import { Button, Notice } from '../ui/primitives.tsx';
import type { MessageKey } from '@nnoo/i18n';

type Channel = 'phone' | 'email';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const t = useT();
  const [channel, setChannel] = useState<Channel>('phone');
  const [destination, setDestination] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  const run = async (work: () => Promise<void>, onFail: (e: unknown) => MessageKey) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (e) {
      setError(onFail(e));
    } finally {
      setBusy(false);
    }
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    const to = channel === 'phone' ? normalisePhone(destination) : destination.trim().toLowerCase();
    if (channel === 'phone' && !E164.test(to)) return setError('signIn.invalidPhone');
    if (channel === 'email' && !EMAIL.test(to)) return setError('signIn.invalidEmail');
    void run(async () => {
      await (channel === 'phone' ? sendPhoneCode(to) : sendEmailCode(to));
      setSentTo(to);
      setCode('');
    }, messageFor);
  };

  const verify = (e: FormEvent) => {
    e.preventDefault();
    if (!sentTo) return;
    void run(
      async () => {
        await (channel === 'phone' ? verifyPhoneCode(sentTo, code) : verifyEmailCode(sentTo, code));
        await exchangeCeremony();
        onSignedIn();
      },
      (err) =>
        err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 429
          ? 'signIn.invalidCode'
          : messageFor(err),
    );
  };

  const passkey = () =>
    void run(
      async () => {
        await signInWithPasskey();
        await exchangeCeremony();
        onSignedIn();
      },
      () => 'signIn.passkeyFailed',
    );

  return (
    <main className="signin" id="main">
      <div className="signin__panel">
        <h1 className="page-title">{t('signIn.title')}</h1>
        <p className="lede">{t('signIn.lede')}</p>

        {!sentTo ? (
          <form onSubmit={send} noValidate>
            <div className="segmented" role="radiogroup" aria-label={t('signIn.title')}>
              {(['phone', 'email'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={channel === c}
                  className="segmented__option"
                  onClick={() => (setChannel(c), setDestination(''), setError(null))}
                >
                  {t(c === 'phone' ? 'signIn.byPhone' : 'signIn.byEmail')}
                </button>
              ))}
            </div>
            <label className="field">
              <span className="field__label">
                {t(channel === 'phone' ? 'signIn.phoneLabel' : 'signIn.emailLabel')}
              </span>
              <input
                className="field__input"
                name={channel}
                type={channel === 'phone' ? 'tel' : 'email'}
                autoComplete={channel === 'phone' ? 'tel' : 'email'}
                inputMode={channel === 'phone' ? 'tel' : 'email'}
                placeholder={channel === 'phone' ? t('signIn.phoneHint') : undefined}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </label>
            {error && <Notice kind="error">{t(error)}</Notice>}
            <Button type="submit" busy={busy}>
              {busy ? t('signIn.sending') : t('signIn.sendCode')}
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} noValidate>
            <p className="muted">{t('signIn.codeSentTo', { destination: sentTo })}</p>
            <label className="field">
              <span className="field__label">{t('signIn.codeLabel')}</span>
              <input
                className="field__input field__input--code"
                name="code"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
              />
            </label>
            {error && <Notice kind="error">{t(error)}</Notice>}
            <Button type="submit" busy={busy} disabled={code.length !== 6}>
              {busy ? t('signIn.verifying') : t('signIn.verify')}
            </Button>
            <Button variant="ghost" onClick={() => (setSentTo(null), setError(null))}>
              {t('signIn.changeDestination')}
            </Button>
          </form>
        )}

        {!sentTo && typeof window.PublicKeyCredential === 'function' && (
          <div className="signin__alt">
            <Button variant="secondary" onClick={passkey} disabled={busy}>
              {t('signIn.withPasskey')}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
