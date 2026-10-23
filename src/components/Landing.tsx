// The landing story, built on the reference's section grammar (dark run panel,
// closing CTA) — with DeepArt's own voice and tokens, nothing borrowed.
import { HERO_PROMPT, pollUrl, seedStore } from '@/data/site';
import { PlateImage } from '@/components/PlateImage';

function heroPlate() {
  return pollUrl(HERO_PROMPT, seedStore.hero.seed, 1000, 1200);
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
          <p>Prompt, model, size, seed: the readout types the spec as the sampler runs. Every plate can be made twice: same seed, same dawn.</p>
          <a className="btn btn--solid" href="/generate">Open the sampler</a>
        </div>
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
