'use client';
// Atelier hero, per the reference: a centered two-voice statement (the store headline
// lands washed, an ink echo carries the verbs), then the render lands as a wide plate
// with a glass card parked on it. The card carries the promise the old corner type had.
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { HERO_PROMPT, pollUrl, site, type HeroContent } from '@/data/site';
import { retryableImgError } from '@/lib/img';
import { useStore } from '@/lib/store';

const W = 1600;
const H = 680; // 21:9 poster ratio, the intended hero crop, near-zero crop on render

export function Hero({ hero }: { hero: HeroContent }) {
  const src = pollUrl(HERO_PROMPT, hero.seed, W, H);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <h1 id="hero-title" className="hero__title">
        <span className="hero__line hero__line--a">{hero.headline}</span>
        <span className="hero__line hero__line--b">Type, render, keep and repeat.</span>
      </h1>
      <figure className="plate hero__plate" data-resolve data-intro style={{ '--ar': `${W} / ${H}` } as CSSProperties}>
        <div className="plate__media">
          <img
            src={src}
            alt="Cinematic dawn over the seeded hills: one of the DeepArt plates"
            width={W}
            height={H}
            fetchPriority="high"
            decoding="async"
            onError={retryableImgError(3)}
          />
          <div className="plate__noise" aria-hidden="true" />
          <div className="plate__flash" aria-hidden="true" />
          <div className="hero__card" data-reveal="fade" data-intro data-delay="0.4">
            <p className="hero__cardTitle"><b>deepart</b> The open image sampler.</p>
            <p className="hero__cardBody">
              Type a line, pick a model and watch the picture resolve from grain in
              fourteen visible steps. No account, nothing uploaded: everything stays
              on this machine.
            </p>
            <Link href="/generate" className="barcta hero__cardCta">
              {site.action}
              <i aria-hidden="true">❯</i>
            </Link>
            <p className="hero__cardMeta">unlimited · free · no account · no credits</p>
          </div>
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
