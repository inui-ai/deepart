// The gallery: every seeded plate the sampler has already finished, laid out as a deck.
// Editorial alternating grid (7/5 on the 12-col rail), each plate carries its own spec
// line, mono captions. Proof, not buttons: static figures.
import type { CSSProperties } from 'react';
import { seedStore, type GalleryItem } from '@/data/site';
import { PlateImage } from '@/components/PlateImage';

const plates = seedStore.gallery as (GalleryItem & { w: number; h: number; seed: number })[];
const ord = (i: number) => String(i + 1).padStart(2, '0');

export function Gallery() {
  return (
    <section className="gal" id="gallery" aria-labelledby="gal-title">
      <header className="gal__head" data-reveal="up">
        <p className="gal__kicker">the gallery · eight seeds pinned</p>
        <h2 id="gal-title" className="gal__title">
          <span className="gal__line gal__line--a">Plates that already left the noise.</span>
          <span className="gal__line gal__line--b">Every one began as a typed line.</span>
        </h2>
      </header>
      <div className="gal__grid">
        {plates.map((p, i) => (
          <figure className="gal__fig" key={p.id}>
            <span
              className="gal__media"
              style={{ '--ar': `${p.w} / ${p.h}` } as CSSProperties}
            >
              <PlateImage
                src={p.url}
                alt={`${p.title}, a seeded DeepArt render`}
                width={p.w}
                height={p.h}
              />
            </span>
            <figcaption className="gal__cap">
              <b>{ord(i)} · {p.title}</b>
              <span>{p.tag} · flux · {p.w}&times;{p.h} · seed {p.seed}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
