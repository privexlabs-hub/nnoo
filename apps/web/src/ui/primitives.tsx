import type { ButtonHTMLAttributes, ReactNode } from 'react';

export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="eyebrow">{children}</p>
);

export const Card = ({ children, tone }: { children: ReactNode; tone?: 'plum' | 'ink' }) => (
  <section className={tone ? `card card--${tone}` : 'card'}>{children}</section>
);

export function Button({
  variant = 'primary',
  busy,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      className={`btn btn--${variant}`}
      aria-busy={busy || undefined}
      disabled={busy || rest.disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Polite status line for screen readers and sighted users alike. */
export const Notice = ({ kind, children }: { kind: 'error' | 'ok'; children: ReactNode }) => (
  <p className={`notice notice--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
    {children}
  </p>
);
