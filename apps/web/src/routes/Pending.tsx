import type { MessageKey } from '@nnoo/i18n';
import { useT } from '../i18n.tsx';
import { Eyebrow } from '../ui/primitives.tsx';

/** A section that is not open yet. It says so plainly instead of showing invented content. */
export function Pending({ title, purpose }: { title: MessageKey; purpose: MessageKey }) {
  const t = useT();
  return (
    <>
      <Eyebrow>{t('pending.eyebrow')}</Eyebrow>
      <h1 className="page-title">{t(title)}</h1>
      <p className="lede">{t(purpose)}</p>
      <p className="muted">{t('pending.body')}</p>
    </>
  );
}
