import { resolveLocale, translator, type Translate } from '@nnoo/i18n';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

const Ctx = createContext<Translate>(translator('en'));

export function I18nProvider({
  locale,
  children,
}: {
  locale?: string | null;
  children: ReactNode;
}) {
  const t = useMemo(() => translator(resolveLocale(locale ?? navigator.language)), [locale]);
  return <Ctx.Provider value={t}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);
