'use client';
// The wall: a gallery of plates fed from the store. Click a plate to open the lightbox
// (focus lands on the close button, Escape closes, scrolling stops while it is open).
import { useEffect, useRef, useState } from 'react';
import { startScroll, stopScroll } from '@/engine';
import type { GalleryItem } from '@/data/site';
import { useStore } from '@/lib/store';

function specOf(item: GalleryItem, index: number) {
  const model = item.url.includes('model=turbo') ? 'turbo' : 'flux';
  const dims = item.url.match(/width=(\d+)&height=(\d+)/);
  const size = dims ? `${dims[1]}\u00d7${dims[2]}` : 'plate';
  const seed = item.url.match(/seed=(\d+)/)?.[1] ?? String(index);
  return `${item.tag} \u00b7 ${model} \u00b7 ${size} \u00b7 seed ${seed}`;
}

export function Wall() {
  const s = useStore();
  const items = s.gallery;
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open == null) return;
    stopScroll();
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); startScroll(); };
  }, [open]);

  const current = open != null ? items[open] : null;

  return (
    <section id="wall" className="wall" aria-labelledby="wall-title">
      <header className="wall__head" data-reveal="up">
        <h2 id="wall-title" className="wall__title">The wall</h2>
        <p className="wall__meta" aria-label={`${items.length} plates on the wall`}>
          <span>{items.length}</span> plates
        </p>
      </header>

      {items.length === 0 ? (
        <p className="wall__empty" data-reveal="fade">
          The wall is empty. Generate an image and use &ldquo;Add to the wall&rdquo;, or add plates in{' '}
          <a className="link" href="/admin">admin</a>.
        </p>
      ) : (
        <ul className="wall__grid">
          {items.map((item, i) => (
            <li key={item.id} className="plate plate--wall" data-resolve>
              <button
                type="button"
                className="plate__open"
                aria-label={`View ${item.title} full size`}
                onClick={() => setOpen(i)}
                data-cursor="View"
              >
                <span className="plate__media">
                  <img src={item.url} alt={item.title} loading="lazy" decoding="async" width={768} height={768} />
                  <span className="plate__noise" aria-hidden="true" />
                  <span className="plate__flash" aria-hidden="true" />
                </span>
              </button>
              <figcaption className="plate__caption">
                <p className="plate__title">{item.title}</p>
                <p className="plate__spec">{specOf(item, i)}</p>
              </figcaption>
            </li>
          ))}
        </ul>
      )}

      {current ? (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={current.title}>
          <button ref={closeRef} type="button" className="lightbox__close" onClick={() => setOpen(null)}>
            Close
          </button>
          <img src={current.url} alt={current.title} decoding="async" fetchPriority="high" />
          <p className="plate__spec">{specOf(current, open ?? 0)}</p>
        </div>
      ) : null}
    </section>
  );
}
