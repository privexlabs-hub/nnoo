import { useMe } from '../api/me.ts';
import { useT } from '../i18n.tsx';
import { Card, Eyebrow } from '../ui/primitives.tsx';

/** Home. Honest empty states: there are no approved recordings or lessons yet. */
export function Today() {
  const t = useT();
  const me = useMe();
  const name = me.data?.displayName;
  return (
    <>
      <Eyebrow>{t('today.eyebrow')}</Eyebrow>
      <h1 className="page-title">
        {name ? t('today.greeting', { name }) : t('today.greetingAnon')}
      </h1>
      <p className="lede">{t('today.lede')}</p>
      <div className="grid-2">
        <Card>
          <Eyebrow>{t('nav.lessons')}</Eyebrow>
          <h2 className="h3">{t('today.lessonsEmptyTitle')}</h2>
          <p className="muted">{t('today.lessonsEmptyBody')}</p>
        </Card>
        <Card tone="plum">
          <Eyebrow>{t('nav.ikpe')}</Eyebrow>
          <h2 className="h3">{t('today.ikpeEmptyTitle')}</h2>
          <p>{t('today.ikpeEmptyBody')}</p>
          <p className="archival" lang="ig">
            {t('brand.principle')}
          </p>
        </Card>
      </div>
    </>
  );
}
