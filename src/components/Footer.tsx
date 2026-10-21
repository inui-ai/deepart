import Link from 'next/link';
import { site } from '@/data/site';

export function Footer() {
  return (
    <footer className="footer">
      <p className="footer__word">{site.name}</p>
      <div className="footer__row">
        <nav aria-label="Footer" className="footer__links">
          <Link href="/generate">Generate</Link>
          <Link href="/#wall">The wall</Link>
          <Link href="/admin">Admin</Link>
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
