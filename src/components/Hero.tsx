'use client';
// Statement hero: the headline owns the whole width, the sampler's spec line sits as a
// mono counter-run, and the render lands full-bleed under the fold like a plate in the
// press. Joins the page intro and resolves from noise once the loader is done.
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { pollUrl, site, type HeroContent } from '@/data/site';
import { retryableImgError } from '@/lib/img';
import { useStore } from '@/lib/store';

const W = 1600;
const H = 680; // 21:9 poster ratio — the intended hero crop, near-zero crop on render

export function Hero({ hero }: { hero: HeroContent }) {
  const src = pollUrl('wide harbor at night under lime green fog, long exposure, dark water, fine grain', hero.seed, W, H);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <header className="hero__head">
        <p className="hero__eyebrow" data-reveal="fade" data-intro data-delay="0.2">{hero.eyebrow}</p>
        <p className="hero__meta" data-reveal="fade" data-intro data-delay="0.2">unlimited free image generation</p>
      </header>
      <h1 id="hero-title" className="hero__title">{hero.headline}</h1>
      <div className="hero__row">
        <p className="hero__sub" data-reveal="fade" data-intro data-delay="0.35">
          {hero.sub}
        </p>
        <div className="hero__cta" data-reveal="fade" data-intro data-delay="0.5">
          <Link href="/generate" className="btn btn--solid" data-fill>
            <span className="btn__fill" aria-hidden="true" />
            {site.action}
          </Link>
          <p className="hero__steps">no account &middot; no credits &middot; type and render</p>
        </div>
      </div>
      <figure className="plate hero__plate" data-resolve data-intro style={{ '--ar': `${W} / ${H}` } as CSSProperties}>
        <div className="plate__media">
          <img
            src={src}
            alt="A fogged harbor under lime light, one of the seeded renders"
            width={W}
            height={H}
            fetchPriority="high"
            decoding="async"
            onError={retryableImgError(3)}
          />
          <div className="plate__noise" aria-hidden="true" />
          <div className="plate__flash" aria-hidden="true" />
        </div>
        <figcaption className="plate__spec">
          <span>flux</span>
          <span>{W}&times;{H}</span>
          <span>seed {hero.seed}</span>
        </figcaption>
      </figure>
    </section>
  );
}

export function HeroFromStore() {
  const s = useStore();
  return <Hero hero={s.hero} />;
}
