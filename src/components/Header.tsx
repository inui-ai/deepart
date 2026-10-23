'use client';
// The reference bar, three pieces on one row: page crumb (left), brand + burger in a
// black bar (center), the primary action (right). The whole header anchors to the page
// top and scrolls away (not sticky). Navigation lives in the ink overlay behind; the
// burger flips to a close mark while it is up.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { startScroll, stopScroll } from '@/engine';
import { site } from '@/data/site';

const NAV = [
  { label: 'Generate', href: '/generate' },
  { label: 'Gallery', href: '/#gallery' },
  { label: 'Admin', href: '/admin' },
] as const;

const CRUMB: Record<string, string> = { '/': 'Home', '/generate': 'Generate', '/admin': 'Admin' };

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
    <header className="frame" data-frame data-open={open || undefined}>
      <div className="frame__page">
        <Link href={pathname} className="crumb" aria-current="page">
          <span aria-hidden="true">‹</span>
          {CRUMB[pathname] || 'Home'}
          <span aria-hidden="true">›</span>
        </Link>
      </div>

      <div className="frame__bar">
        <Link href="/" className="brand" aria-label="DeepArt home">
          <span>
            deepart
            <i className="brand__mark" aria-hidden="true">꞉꞉</i>
          </span>
        </Link>
        <button
          ref={btn}
          type="button"
          className="bar__burger"
          aria-expanded={open}
          aria-controls="menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => { setOpen(!open); if (open) gsap.set(panel.current, { autoAlpha: 0 }); }}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      <div className="frame__cta">
        <Link href="/generate" className="barcta">
          {site.action}
          <i aria-hidden="true">❯</i>
        </Link>
      </div>

      <nav
        id="menu"
        hidden={!open}
        ref={panel}
        className="menu"
        aria-label="Menu"
      >
        {NAV.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            style={{ transitionDelay: `${i * 60}ms` }}
            className="menu__link"
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
