'use client';
// The corner frame: brand + primary nav along the top — it scrolls away with the page,
// so nothing ever prints over content. The Menu pill stays a fixed corner utility.
// On phones the top bar is brand only; navigation lives in the menu overlay.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { startScroll, stopScroll } from '@/engine';

const NAV = [
  { label: 'Generate', href: '/generate' },
  { label: 'Wall', href: '/#wall' },
  { label: 'Admin', href: '/admin' },
] as const;

export function Header() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  // Escape closes the menu; focus handoff loops between the links while open.
  useEffect(() => {
    if (!open) return;
    stopScroll();
    const alt = panel.current?.querySelector('a[href]');
    (alt as HTMLElement)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); }
      if (e.key !== 'Tab' || !panel.current) return;
      const els = [...panel.current.querySelectorAll<HTMLElement>('a[href]')];
      if (!els.length) return;
      const first = els[0]; const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); startScroll(); };
  }, [open]);

  return (
    <header className="frame" data-frame>
      <div className="frame__tl">
        <Link href="/" className="brand" aria-label="DeepArt home">
          <span>DeepArt<i className="brand__dot" aria-hidden="true" /></span>
        </Link>
      </div>
      <nav className="frame__tr nav" aria-label="Primary">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav__link roll ${pathname === item.href ? 'is-current' : ''}`}
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            <span>{item.label}</span>
            <span aria-hidden="true">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="frame__br">
        <button
          ref={btn}
          type="button"
          className="frame__menu"
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => { setOpen(!open); if (open) gsap.set(panel.current, { autoAlpha: 0 }); }}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      <nav
        id="menu"
        hidden={!open}
        ref={panel}
        className="menu"
        aria-label="Menu"
      >
        {NAV.map((item, i) => (
          <Link key={item.href} href={item.href} style={{ transitionDelay: `${i * 60}ms` }} className="menu__link">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
