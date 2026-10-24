import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FooterGate } from '@/components/FooterGate';
import { Motion } from '@/components/Motion';
import { StoreSync } from '@/components/StoreSync';
import { Toaster } from '@/components/Toaster';
import { HERO_URL, site } from '@/data/site';
import { switzer, fragment } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | local image sampler`, template: `%s | ${site.name}` },
  description: site.description,
  keywords: [
    'AI image sampler', 'text to image', 'compare AI image models', 'browser AI art',
    'flux', 'turbo', 'openai images api', 'openai-compatible image generator', 'no login image generator',
  ],
  applicationName: site.name,
  category: 'AI image generation',
  alternates: { canonical: './' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  openGraph: {
    type: 'website',
    siteName: site.name,
    description: site.description,
    images: ['/og.png'],
  },
  twitter: { card: 'summary_large_image' },
};

// Runs before first paint: hidden-until-revealed styles only apply when JS and motion are on.
const flags = `document.documentElement.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('motion')`;

// Warm-cache hint for the hero plate: the owner's reference file served from /public.
// Must match the exact URL the hero <img> requests (same string from site.ts).
const heroPreload = HERO_URL;

// Three graphs: the site, the application, and (on the landing) the FAQ. Visible text
// doubles as the schema content, which keeps the structured data honest for crawlers
// and answer engines instead of stuffing invisible claims.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: site.name,
      url: site.url,
      description: site.description,
    },
    {
      '@type': 'WebApplication',
      name: site.name,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Any, in a web browser',
      url: site.url,
      description: site.description,
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'One prompt, side-by-side renders from every installed image model',
        'Free and unlimited: no login, no account',
        'Built-in free Flux and Turbo models',
        'Bring your own key: extend it with any OpenAI-compatible images endpoint',
        'Images and exports stay in your browser',
      ],
    },
  ],
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
