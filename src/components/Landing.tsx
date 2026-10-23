// The landing story, built on the reference's section grammar (color journey, glass
// promo, mixed trio, dark run panel, capability ladder, numbered pipeline, truth
// marquee, closing CTA) — with DeepArt's own voice and tokens, nothing borrowed.
import type { CSSProperties } from 'react';
import { HERO_PROMPT, pollUrl, seedStore, type GalleryItem } from '@/data/site';
import { PlateImage } from '@/components/PlateImage';

const seeded = seedStore.gallery as GalleryItem[];

function heroPlate() {
  return pollUrl(HERO_PROMPT, seedStore.hero.seed, 1000, 1200);
}

/* ---------------------------------------------------------------- lime interlude */
// A full-bleed lime breath between the hero and the pitch — glyph only, no sales.
export function BrandBand() {
  return (
    <section className="band" aria-label="DeepArt">
      <div className="band__glyph" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
      <p className="band__cap">one line &rarr; fourteen steps &rarr; a picture</p>
    </section>
  );
}

/* ---------------------------------------------------------------- sampler promo */
// Glass card parked over the media, the way the reference floats its product card.
export function SamplerPromo() {
  return (
    <section className="promo" aria-label="The sampler">
      <span className="promo__media" aria-hidden="true">
        <PlateImage src={heroPlate()} alt="" width={1000} height={1200} hidden />
      </span>
      <div className="promo__card" data-reveal="up">
        <p className="promo__kick">the sampler</p>
        <h2>Everything happens here.</h2>
        <p className="promo__body">
          Type a line, pick a model, watch the render step out of grain in real time.
          The page talks straight to the sampler endpoint &mdash; no account, nothing uploaded.
        </p>
        <a className="btn btn--solid" href="/generate">Open the sampler</a>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- the trio */
// Three cards that each carry a different material, like the reference trio:
// plain / checklist / dark impact.
export function TrioCards() {
  return (
    <section className="trio" aria-label="How the sampler is built">
      <article className="trio__item" data-reveal="fade">
        <div className="trio__card trio__card--plain" aria-hidden="true">
          <span className="trio__dot" />
          <p>Pictures begin as noise. Every plate states it.</p>
        </div>
        <h3>No account. No backend.</h3>
        <p>The page calls the sampler straight from this machine &mdash; settings, history and pins live in one local slate.</p>
      </article>
      <article className="trio__item" data-reveal="fade" data-delay="0.1">
        <div className="trio__card trio__card--rows" aria-hidden="true">
          <p className="trio__row"><span className="trio__mark" />Flux &mdash; on</p>
          <p className="trio__row"><span className="trio__mark trio__mark--off" />Turbo &mdash; off, free tier</p>
          <p className="trio__row"><span className="trio__mark" />Kontext &mdash; bring your own key</p>
        </div>
        <h3>Models, in the open.</h3>
        <p>Slugs, endpoints and the on/off switch sit in admin &mdash; the truth of what runs, visible on the page.</p>
      </article>
      <article className="trio__item" data-reveal="fade" data-delay="0.2">
        <div className="trio__card trio__card--ink" aria-hidden="true">
          <span className="trio__chip">RUNS IN STEPS</span>
          <p className="trio__big">14</p>
          <p className="trio__bigcap">denoise steps, noise &rarr; plate</p>
        </div>
        <h3>A run you can watch.</h3>
        <p>The stage resolves in visible steps with a typed readout &mdash; you are never handed a finished thing without its history.</p>
      </article>
    </section>
  );
}

/* ---------------------------------------------------------------- run panel */
// The dark full-bleed statement panel with two columns and one lime exit.
export function RunPanel() {
  return (
    <section className="run" aria-label="One line to a plate">
      <div className="run__inner" data-reveal="up">
        <div className="run__col">
          <h2>From prompt to plate in one line.</h2>
        </div>
        <div className="run__col">
          <h3>Repeated works, not one-offs.</h3>
          <p>Prompt, model, size, seed &mdash; the readout types the spec as the sampler runs. Every plate can be made twice: same seed, same dawn.</p>
          <a className="btn btn--solid" href="/generate">Open the sampler</a>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- ladder */
// Capability entries with full-width media between them, outcomes stated plainly.
const ROUNDS = [
  {
    title: 'A fixed wide stage',
    body: 'Every render sits on a fixed 16:9 plate. Portrait work letterboxes inside it &mdash; contained, never cropped, never stretched.',
    outcome: 'plate 864\u00d7486 \u00b7 contain, never crop',
    media: seeded[3], // dune at noon
    ar: '1200 / 675',
  },
  {
    title: 'Seeds that repeat',
    body: 'Pin a seed and the sampler hands you the same picture twice. Reruns are real work here, not happy accidents.',
    outcome: `seed ${seedStore.gallery[0].url.match(/seed=(\d+)/)?.[1] ?? 0} \u2192 same dawn, every rerun`,
    media: seeded[0], // harbor at dawn
    ar: '1000 / 1160',
  },
  {
    title: 'Local by default',
    body: 'History, reruns, downloads and wall pins write to one local slate. Nothing is sent to a server you did not type into.',
    outcome: 'localStorage \u00b7 deepart:v1 \u00b7 no account',
    media: seeded[1], // the long library
    ar: '1200 / 800',
  },
];

function dimsOf(item: GalleryItem) {
  const dims = item.url.match(/width=(\d+)&height=(\d+)/);
  return dims ? { w: +dims[1], h: +dims[2] } : { w: 768, h: 768 };
}

export function Ladder() {
  return (
    <section className="ladder" aria-label="What the sampler guarantees">
      {ROUNDS.map((r) => {
        const dims = dimsOf(r.media);
        return (
          <div className="ladder__entry" key={r.title}>
            <div className="ladder__text" data-reveal="fade">
              <h3>{r.title}</h3>
              <p>{r.body}</p>
              <p className="ladder__outcome"><span>the plate</span>{r.outcome}</p>
            </div>
            <figure
              className="ladder__media plate--ladder"
              data-resolve
              style={{ '--ar': r.ar } as React.CSSProperties}
            >
              <PlateImage src={r.media.url} alt={r.media.title} width={dims.w} height={dims.h} retries={2} />
            </figure>
          </div>
        );
      })}
    </section>
  );
}

/* ---------------------------------------------------------------- pipeline rows */
// Numbered rows in a tinted panel, the "same system every time" statement.
export function PipelineRows() {
  const rows = [
    ['01', 'Noise field', 'a random sheet of grain, yours to steer with the seed'],
    ['02', 'The sampler', 'fourteen visible denoise steps, typed into the readout'],
    ['03', 'The plate', 'the picture plus its spec, stamped in the margin'],
  ];
  return (
    <section className="pipe" aria-label="The pipeline">
      <div className="pipe__inner" data-reveal="up">
        <div className="pipe__intro">
          <h2>The same steps, every time.</h2>
          <p>Nothing random about the process &mdash; only the field is. The machine is legible: three stations, one direction.</p>
        </div>
        <ol className="pipe__rows">
          {rows.map(([num, name, line]) => (
            <li className="pipe__row" key={num}>
              <p className="pipe__name">{name}</p>
              <p className="pipe__line">{line}</p>
              <p className="pipe__num" aria-hidden="true">{num}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- truths marquee */
// A slow, honest marquee: the operating constraints stated as design material.
export function TruthsMarquee() {
  const truths = [
    'turbo is off \u2014 free tier',
    'one fresh render \u2248 every 45s',
    'renders carry a watermark',
    'everything stays on this machine',
    'seeds are yours to pin',
    'no account, ever',
  ];
  const strip = [...truths, ...truths];
  return (
    <section className="truths" aria-label="The sampler's truths">
      <p className="truths__head">the free tier, stated plainly</p>
      <div className="truths__track" aria-hidden="true">
        {strip.map((t, i) => (
          <p className="truths__item" key={`${t}-${i}`}>{t}</p>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- closing cta */
// Dark poster band, blurred plate behind, one circular lime exit.
export function CtaBand() {
  return (
    <section className="cta" aria-label="Generate now">
      <span className="cta__bg" aria-hidden="true">
        <PlateImage src={heroPlate()} alt="" width={1000} height={1200} hidden />
      </span>
      <div className="cta__inner" data-reveal="fade">
        <h2>Your next picture is one line away.</h2>
        <a className="cta__disc" href="/generate">
          <span aria-hidden="true" className="cta__discarrow">&rarr;</span>
          <span className="cta__disclabel">generate</span>
        </a>
      </div>
    </section>
  );
}
