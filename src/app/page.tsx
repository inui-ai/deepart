import { HeroFromStore } from '@/components/Hero';
import { AdSlot } from '@/components/AdSlot';
import { Wall } from '@/components/Wall';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pictures out of noise',
  description:
    'Type a few words, pick a model and watch the render resolve in steps. DeepArt runs in your browser: no login, no account, nothing leaves your machine.',
};

export default function Home() {
  return (
    <>
      <HeroFromStore />
      <div className="home__strip">
        <AdSlot placement="home-strip" />
      </div>
      <section className="process" aria-label="How a picture is made" data-reveal="up">
        <ol className="process__list">
          <li className="process__step">
            <p className="process__num" aria-hidden="true">01</p>
            <h3>Words in</h3>
            <p>Type one line — any picture you can describe. Optional seed to steer the noise.</p>
          </li>
          <li className="process__step">
            <p className="process__num" aria-hidden="true">02</p>
            <h3>The sampler runs</h3>
            <p>Flux denoises a random field, step 00/14 to 14/14, right here in your browser.</p>
          </li>
          <li className="process__step">
            <p className="process__num" aria-hidden="true">03</p>
            <h3>Plate out</h3>
            <p>A finished picture with its spec stamped in the margin. Pin it to the wall.</p>
          </li>
        </ol>
      </section>
      <Wall />
    </>
  );
}
