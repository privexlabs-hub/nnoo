import { Link, Outlet } from '@tanstack/react-router';
import type { MessageKey } from '@nnoo/i18n';
import mark from '@nnoo/design-tokens/assets/logo/mark-clay.svg';
import { useMe } from '../api/me.ts';
import { useT } from '../i18n.tsx';
import { Eyebrow } from '../ui/primitives.tsx';
import { Icon, type IconName } from '../ui/Icon.tsx';

type To = '/' | '/lessons' | '/oba' | '/ikpe' | '/oha' | '/you';
const NAV: { to: To; label: MessageKey; sub?: MessageKey; icon: IconName }[] = [
  { to: '/', label: 'nav.today', icon: 'home' },
  { to: '/lessons', label: 'nav.lessons', icon: 'book' },
  { to: '/oba', label: 'nav.oba', sub: 'nav.obaSub', icon: 'archive' },
  { to: '/ikpe', label: 'nav.ikpe', sub: 'nav.ikpeSub', icon: 'users' },
  { to: '/oha', label: 'nav.oha', sub: 'nav.ohaSub', icon: 'users' },
  { to: '/you', label: 'nav.you', icon: 'user' },
];

function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((p) => [...p][0]!.toUpperCase())
      .join('') || '·'
  );
}

/** Desktop: left nav · stage · contextual rail (docs/04 §web). Narrow screens stack. */
export function Shell() {
  const t = useT();
  const me = useMe();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img src={mark} width={36} height={36} alt="" className="brand__mark" />
          <div>
            <div className="brand__name">{t('brand.name')}</div>
            <div className="brand__tagline">{t('brand.tagline')}</div>
          </div>
        </div>
        <nav aria-label={t('nav.main')}>
          <ul className="nav">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="nav__item" activeOptions={{ exact: n.to === '/' }}>
                  <span className="nav__icon">
                    <Icon name={n.icon} size={16} />
                  </span>
                  <span className="nav__text">
                    <span className="nav__label">{t(n.label)}</span>
                    {n.sub && <span className="nav__sub">{t(n.sub)}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {me.data && (
          <Link to="/you" className="who">
            <span className="who__avatar" aria-hidden="true">
              {initials(me.data.displayName)}
            </span>
            <span className="who__name">{me.data.displayName ?? t('you.unnamed')}</span>
          </Link>
        )}
      </aside>

      <main className="stage" id="main">
        <Outlet />
      </main>

      <aside className="rail" aria-label={t('rail.principleEyebrow')}>
        <div className="card card--ink">
          <Eyebrow>{t('rail.principleEyebrow')}</Eyebrow>
          <p className="rail__principle" lang="ig">
            {t('brand.principle')}
          </p>
          <p className="rail__gloss">{t('brand.principleGloss')}</p>
        </div>
        <div className="card">
          <Eyebrow>{t('rail.weekEyebrow')}</Eyebrow>
          <p className="muted">{t('rail.weekEmpty')}</p>
        </div>
      </aside>
    </div>
  );
}
