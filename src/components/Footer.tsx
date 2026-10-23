import Link from 'next/link';
import { site } from '@/data/site';

export function Footer() {
  return (
    <footer className="footer">
      <p className="footer__word">{site.name}</p>
      <div className="footer__row">
        <nav aria-label="Footer" className="footer__links">
          {[
            { label: 'Generate', href: '/generate' },
            { label: 'The gallery', href: '/#gallery' },
          ].map((item) => (
            <Link key={item.href} className="roll footer__link" href={item.href}>
              <span>{item.label}</span>
              <span aria-hidden="true">{item.label}</span>
            </Link>
          ))}
        </nav>
        <p className="footer__colophon">Switzer &amp; Fragment Mono. Renders by Pollinations.</p>
      </div>
      <div className="footer__small">
        <p>No login. Everything stays in your browser.</p>
        <p>&copy; {site.year} {site.name}</p>
      </div>
    </footer>
  );
}
