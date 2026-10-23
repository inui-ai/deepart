import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FooterGate } from '@/components/FooterGate';
import { Motion } from '@/components/Motion';
import { StoreSync } from '@/components/StoreSync';
import { Toaster } from '@/components/Toaster';
import { HERO_PROMPT, pollUrl, seedStore, site } from '@/data/site';
import { switzer, fragment } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | local image sampler`, template: `%s | ${site.name}` },
  description: site.description,
  alternates: { canonical: './' },
  openGraph: {
    type: 'website',
    siteName: site.name,
    images: ['/og.png'],
  },
  twitter: { card: 'summary_large_image' },
};

// Runs before first paint: hidden-until-revealed styles only apply when JS and motion are on.
const flags = `document.documentElement.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion')`;

// Warm-cache hint for the hero render: the seeded URL is a fixed key the sampler serves
// from its cache, so discovery starts at connection time, not image-parse time.
// Must match the exact URL the hero <img> requests below (1600x680 plate).
const heroPreload = pollUrl(HERO_PROMPT, seedStore.hero.seed, 1600, 680);

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: site.name,
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: site.description,
  url: site.url,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${switzer.variable} ${fragment.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href={heroPreload} fetchPriority="high" />
        <script dangerouslySetInnerHTML={{ __html: flags }} />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <div id="curtain" aria-hidden="true">
          <div className="curtain__panel">
            <span className="curtain__edge curtain__edge--a" />
            <span className="curtain__edge curtain__edge--b" />
          </div>
        </div>
        <div id="cursor" aria-hidden="true"><span data-cursor-label /></div>
        <div id="loader" role="status" aria-label="Loading">
          <div className="loader__inner">
            <span className="loader__name" data-loader-out>{site.name}</span>
            <span className="loader__count" data-loader-out data-loader-count>00/14</span>
          </div>
          <span className="loader__flash" aria-hidden="true" />
        </div>
        <Header />
        <main id="main" tabIndex={-1}>{children}</main>
        <FooterGate><Footer /></FooterGate>
        <StoreSync />
        <Toaster />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
        <Motion />
        <noscript>
          <p className="noscript">DeepArt needs JavaScript to sample images. The pieces that render are on the home page.</p>
        </noscript>
      </body>
    </html>
  );
}
