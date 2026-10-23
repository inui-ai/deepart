'use client';
// Atelier hero, per the reference: a centered two-voice statement (the store headline
// lands washed, an ink echo carries the verbs), then the render lands as a wide plate
// with a glass card parked on it. The card carries the promise the old corner type had.
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { HERO_URL, site, type HeroContent } from '@/data/site';
import { useStore } from '@/lib/store';

const W = 1600;
const H = 680; // 21:9 poster frame; the file covers through object-fit, no distortion
// matched to the actual file public/hero-flock.jpg (the re-encoded reference, see assets/)
const IW = 2400;
const IH = 1340;

export function Hero({ hero }: { hero: HeroContent }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <h1 id="hero-title" className="hero__title">
        <span className="hero__line hero__line--a">{hero.headline}</span>
        <span className="hero__line hero__line--b">Type, render, keep and repeat.</span>
      </h1>
      <figure className="plate hero__plate" data-resolve data-intro style={{ '--ar': `${W} / ${H}` } as CSSProperties}>
        <div className="plate__media">
          <img
            src={HERO_URL}
            alt="Reference plate: dawn over dark green rolling hills with a flock of white birds"
            width={IW}
            height={IH}
            fetchPriority="high"
            decoding="async"
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
          <span>reference</span>
          <span>{IW}&times;{IH}</span>
          <span>kept local</span>
        </figcaption>
      </figure>
    </section>
  );
}

export function HeroFromStore() {
  const s = useStore();
  return <Hero hero={s.hero} />;
}
