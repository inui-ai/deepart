'use client';
// Split-frame hero: type on the left column lines, the live render as the right half.
// The hero plate joins the page intro and resolves from noise once the loader is done.
import Link from 'next/link';
import { pollUrl, site, type HeroContent } from '@/data/site';
import { retryableImgError } from '@/lib/img';
import { useStore } from '@/lib/store';

export function Hero({ hero }: { hero: HeroContent }) {
  const src = pollUrl('lime green light through fog over a dark harbor, long exposure, fine grain', hero.seed, 1000, 1200);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__copy">
        <p className="hero__eyebrow" data-reveal="fade" data-intro data-delay="0.2">{hero.eyebrow}</p>
        <h1 id="hero-title" className="hero__title">
          {hero.headline}
        </h1>
        <p className="hero__sub" data-reveal="fade" data-intro data-delay="0.35">
          {hero.sub}
        </p>
        <div className="hero__cta" data-reveal="fade" data-intro data-delay="0.5">
          <Link href="/generate" className="btn btn--solid" data-fill>
            <span className="btn__fill" aria-hidden="true" />
            {site.action}
          </Link>
        </div>
      </div>
      <figure className="plate hero__plate" data-resolve data-intro>
        <div className="plate__media plate__media--tall">
          <img src={src} alt="A fogged harbor under lime light, one of the seeded renders" width={1000} height={1200} fetchPriority="high" decoding="async" onError={retryableImgError(3)} />
          <div className="plate__noise" aria-hidden="true" />
          <div className="plate__flash" aria-hidden="true" />
        </div>
        <figcaption className="plate__spec">
          <span>flux</span>
          <span>1000&times;1200</span>
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
