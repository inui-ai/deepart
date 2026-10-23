'use client';
// The wall: a gallery of plates fed from the store. Click a plate to open the lightbox
// (focus lands on the close button, Escape closes, scrolling stops while it is open).
import { useEffect, useRef, useState } from 'react';
import { startScroll, stopScroll } from '@/engine';
import { retryableImgError } from '@/lib/img';
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
  const rootRef = useRef<HTMLElement>(null);
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

  // The wall queues its renders: two plates fetch at a time as they scroll into range,
  // so a first-ever visit paces its requests instead of racing the sampler's limiter.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let pending = 0;
    const waiting: (() => void)[] = [];
    const MAX = 2;
    const pump = () => {
      if (pending >= MAX || waiting.length === 0) return;
      pending += 1;
      waiting.shift()!();
    };
    const load = (img: HTMLImageElement) => {
      waiting.push(() => {
        const settle = () => { pending -= 1; pump(); };
        img.addEventListener('load', settle, { once: true });
        img.addEventListener('error', settle, { once: true });
        img.src = img.dataset.src ?? '';
      });
      pump();
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.unobserve(entry.target);
          const img = entry.target as HTMLImageElement;
          if (!img.src) load(img);
        }
      },
      { rootMargin: '480px 0px' },
    );
    root.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => {
      if (!img.src) io.observe(img);
    });
    return () => io.disconnect();
  }, [items]);

  const current = open != null ? items[open] : null;

  return (
    <section id="wall" className="wall" aria-labelledby="wall-title" ref={rootRef}>
      <header className="wall__head" data-reveal="up">
        <p className="wall__eyebrow">contact sheet</p>
        <h2 id="wall-title" className="wall__title">Plates that left the noise.</h2>
        <p className="wall__index" aria-label={`${items.length} plates on the wall`}>
          <span>{items.length}</span> plates &middot; seeded &middot; local only
        </p>
      </header>

      {items.length === 0 ? (
        <p className="wall__empty" data-reveal="fade">
          The wall is empty. Generate an image and use &ldquo;Add to the wall&rdquo;, or add plates in{' '}
          <a className="link" href="/admin">admin</a>.
        </p>
      ) : (
        <ul className="wall__sheet">
          {items.map((item, i) => (
            <li key={item.id} className="plate plate--wall wall__cell" data-resolve>
              <button
                type="button"
                className="plate__open"
                aria-label={`View ${item.title} full size`}
                onClick={() => setOpen(i)}
                data-cursor="View"
              >
                <span className="plate__media">
                  <img data-src={item.url} alt={item.title} decoding="async" width={768} height={768} onError={retryableImgError(3)} />
                  <span className="plate__noise" aria-hidden="true" />
                  <span className="plate__flash" aria-hidden="true" />
                </span>
              </button>
              <figcaption className="plate__caption">
                <p className="plate__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</p>
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
          <img src={current.url} alt={current.title} decoding="async" fetchPriority="high" onError={retryableImgError(3)} />
          <p className="plate__spec">{specOf(current, open ?? 0)}</p>
        </div>
      ) : null}
    </section>
  );
}
