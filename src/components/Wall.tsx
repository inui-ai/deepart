'use client';
// The wall: a horizontal screening strip of plates fed from the store. Scroll or drag it
// like a film leader; arrows and the keyboard step frame by frame. Click a plate to open
// the lightbox (focus lands on Close, Escape closes, scrolling stops while it is open).
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as KbdEvent } from 'react';
import { startScroll, stopScroll } from '@/engine';
import { retryableImgError } from '@/lib/img';
import type { GalleryItem } from '@/data/site';
import { useStore } from '@/lib/store';

function dimsOf(item: GalleryItem) {
  const dims = item.url.match(/width=(\d+)&height=(\d+)/);
  return dims ? { w: +dims[1], h: +dims[2] } : { w: 768, h: 768 };
}

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
  const stripRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const countRef = useRef<HTMLElement>(null);  const progressRef = useRef<HTMLSpanElement>(null);
  const drag = useRef({ down: false, x: 0, left: 0, dist: 0 });
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

  // The film-leader readout: counter, progress line and arrow states follow the scroll.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || items.length === 0) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const stripRect = strip.getBoundingClientRect();
      const frames = [...strip.querySelectorAll<HTMLElement>('.wall__frame')];
      // the frame straddling the left edge is the one being read
      const sl = strip.scrollLeft;
      let nearest = 0;
      frames.forEach((f, i) => {
        const virtualLeft = f.getBoundingClientRect().left - stripRect.left + sl;
        if (virtualLeft <= sl + 4) nearest = i;
      });
      if (countRef.current) countRef.current.textContent = String(nearest + 1).padStart(2, '0');
      const max = strip.scrollWidth - strip.clientWidth;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? strip.scrollLeft / max : 1})`;
      if (prevRef.current) prevRef.current.disabled = strip.scrollLeft <= 2;
      if (nextRef.current) nextRef.current.disabled = strip.scrollLeft >= max - 2;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    strip.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { strip.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [items]);

  const step = (dir: number) => {
    const strip = stripRef.current;
    if (!strip) return;
    const frames = [...strip.querySelectorAll<HTMLElement>('.wall__frame')];
    const sample = frames[0];
    const gap = frames.length > 1 ? Math.round(frames[1].getBoundingClientRect().left - sample.getBoundingClientRect().right) : 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    strip.scrollBy({ left: dir * (sample.getBoundingClientRect().width + gap), behavior: reduced ? 'auto' : 'smooth' });
  };

  // Keyboard support while the strip itself carries focus.
  const onStripKey = (e: KbdEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  };

  // Drag to scrub (mouse): suspend the snap while the hand pulls the strip, restore on
  // release, and suppress the trailing click on a real drag so plates stay tappable.
  // Wired natively: pointermove must stream even while buttons/images try to start a drag
  // or the browser re-snaps.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || items.length === 0) return;
    const st = drag.current;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      st.down = true; st.x = e.clientX; st.left = strip.scrollLeft; st.dist = 0;
      strip.style.scrollSnapType = 'none';
    };
    const move = (e: PointerEvent) => {
      if (!st.down) return;
      const dx = e.clientX - st.x;
      st.dist = Math.abs(dx);
      if (dx !== 0) strip.scrollLeft = st.left - dx;
    };
    const up = (e: PointerEvent) => {
      if (!st.down) return;
      // hand-dragged strips stay unsnapped (predictable); toggling snap back mid-session
      // makes the browser yank the strip to a snap point, undoing the scrub
      if (st.dist <= 6) strip.style.scrollSnapType = '';
      if (st.dist > 6) {
        const t = e.target as HTMLElement;
        t.addEventListener('click', (ev) => ev.stopPropagation(), { capture: true, once: true });
      }
      st.down = false;
    };
    const noGhost = (e: DragEvent) => { e.preventDefault(); };
    strip.addEventListener('pointerdown', down);
    strip.addEventListener('pointermove', move);
    strip.addEventListener('pointerup', up);
    strip.addEventListener('pointerleave', up);
    strip.addEventListener('dragstart', noGhost);
    return () => {
      strip.removeEventListener('pointerdown', down);
      strip.removeEventListener('pointermove', move);
      strip.removeEventListener('pointerup', up);
      strip.removeEventListener('pointerleave', up);
      strip.removeEventListener('dragstart', noGhost);
    };
  }, [items]);

  const current = open != null ? items[open] : null;

  return (
    <section id="wall" className="wall" aria-labelledby="wall-title" ref={rootRef}>
      <header className="wall__head" data-reveal="up">
        <p className="wall__eyebrow">screening strip</p>
        <h2 id="wall-title" className="wall__title">Plates that left the noise.</h2>
        <p className="wall__index" aria-label={`${items.length} plates on the wall`}>
          seeded &middot; local only &middot; scroll sideways
        </p>
      </header>

      {items.length === 0 ? (
        <p className="wall__empty" data-reveal="fade">
          The wall is empty. Generate an image and use &ldquo;Add to the wall&rdquo;, or add plates in{' '}
          <a className="link" href="/admin">admin</a>.
        </p>
      ) : (
        <div className="wall__deck">
          <div
            className="wall__strip"
            role="region"
            aria-label={`Plates, horizontal strip, ${items.length} frames`}
            tabIndex={0}
            ref={stripRef}
            onKeyDown={onStripKey}
          >
            {items.map((item, i) => {
              const { w, h } = dimsOf(item);
              return (
                <figure
                  key={item.id}
                  className="plate plate--wall wall__frame"
                  data-resolve
                  style={{ '--ar': `${w} / ${h}` } as CSSProperties}
                >
                  <button
                    type="button"
                    className="plate__open"
                    aria-label={`View ${item.title} full size`}
                    onClick={() => { if (drag.current.dist <= 6) setOpen(i); }}
                    data-cursor="View"
                  >
                    <span className="plate__media">
                      <img data-src={item.url} alt={item.title} decoding="async" width={w} height={h} onError={retryableImgError(3)} />
                      <span className="plate__noise" aria-hidden="true" />
                      <span className="plate__flash" aria-hidden="true" />
                    </span>
                  </button>
                  <figcaption className="wall__tag">
                    <p className="plate__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</p>
                    <div className="wall__tag2">
                      <p className="plate__title">{item.title}</p>
                      <p className="plate__spec">{specOf(item, i)}</p>
                    </div>
                  </figcaption>
                </figure>
              );
            })}
          </div>
          <div className="wall__ctrl">
            <button ref={prevRef} type="button" className="wall__arrow" aria-label="Previous plates" onClick={() => step(-1)}>&larr;</button>
            <button ref={nextRef} type="button" className="wall__arrow" aria-label="Next plates" onClick={() => step(1)}>&rarr;</button>
            <p className="wall__progress" aria-hidden="true"><span ref={progressRef} /></p>
            <p className="wall__count" aria-hidden="true">
              <b ref={countRef}>01</b>/{String(items.length).padStart(2, '0')}
            </p>
          </div>
        </div>
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
