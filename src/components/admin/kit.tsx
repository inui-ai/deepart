'use client';
// Small shared controls for the admin instrument. Quiet, mono-headered, keyboard friendly.
import type { ReactNode } from 'react';

export function AdminField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="adm__field">
      <p className="adm__label">{label}</p>
      {hint ? <p className="adm__hint">{hint}</p> : null}
      {children}
    </div>
  );
}

export function Row({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={`adm__row${className ? ` ${className}` : ''}`}>{children}</div>;
}

export function Stack({ children }: { children: ReactNode }) {
  return <div className="adm__stack">{children}</div>;
}

export function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`chip ${on ? 'chip--on' : ''}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

export function QuietBtn({ children, ...rest }: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="adm__btn" {...rest}>
      {children}
    </button>
  );
}
