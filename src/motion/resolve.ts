// The resolve driver: the concept's one motion system. Every image on the site arrives by
// resolving out of noise, in steps - the diffusion sample's own grammar. A plate carries
//   [data-resolve]            wire on scroll (or in the page intro with data-intro)
//   .plate__noise             the noise overlay (CSS, fractal-noise data URI)
//   .plate__flash             the lime hairline that fires when the sample lands
// The signature moment on /generate calls resolveStage() imperatively: more steps, and a
// mono readout that types itself after the image lands.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ease, isMobile, prefersReducedMotion } from '@/engine';

gsap.registerPlugin(ScrollTrigger);

type ResolveOpts = { steps?: number; blur?: number } | undefined;

/** Animate one plate from noise to focus. Returns the timeline (paused) so callers can slot
 *  it into an intro; other callers call .play() themselves. */
export function resolveIn(plate: HTMLElement, all: ResolveOpts = undefined) {
  const steps = Math.max(2, all?.steps ?? 3);
  const blur = all?.blur ?? (isMobile() ? 0 : 6);
  const img = plate.querySelector<HTMLElement>('img');
  const noise = plate.querySelector<HTMLElement>('.plate__noise');
  const flash = plate.querySelector<HTMLElement>('.plate__flash');

  const done = () => { plate.setAttribute('data-resolved', 'true'); };
  if (prefersReducedMotion()) {
    gsap.set(noise, { autoAlpha: 0 });
    if (img) gsap.set(img, { filter: 'none', scale: 1 });
    done();
    return gsap.timeline({ paused: true });
  }
  plate.setAttribute('data-resolved', 'false');
  const tl = gsap.timeline({ paused: true, onComplete: done });
  tl.saveRevert && tl.saveRevert();
  if (img) {
    gsap.set(img, { filter: blur > 0 ? `blur(${blur}px)` : 'none', scale: blur > 0 ? 1.035 : 1 });
    if (blur > 0) tl.to(img, { filter: 'blur(0px)', duration: 1.15, ease: ease.out }, 0.1);
    tl.to(img, { scale: 1, duration: 1.3, ease: ease.out }, 0.1);
  }
  if (noise) {
    gsap.set(noise, { autoAlpha: 1 });
    // discrete steps: 3 beats of the overlay fading, like a sampler publishing partial denoises
    steps > 3 ? tl.to(noise, { autoAlpha: 0, duration: 0.85, ease: `steps(${steps - 2})` }, 0.25)
              : tl.to(noise, { autoAlpha: 0, duration: 0.8, ease: `steps(${steps})` }, 0.15);
  }
  if (flash) {
    tl.fromTo(flash, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.3, ease: ease.soft }, '>-0.1')
      .to(flash, { autoAlpha: 0, duration: 0.5, ease: ease.soft });
  }
  return tl;
}

/** Wire every [data-resolve] inside root. data-intro plates join the page intro; the rest
 *  resolve once on scroll enter. Queue-fed plates hold their resolve until their img
 *  actually lands (the hatch reads as sampling in the meantime; a 6 s cap keeps it moving). */
function playWhenLoaded(plate: HTMLElement, tl: gsap.core.Timeline) {
  const img = plate.querySelector<HTMLImageElement>('img');
  if (!img || (img.complete && img.naturalWidth > 0)) { tl.play(); return; }
  const go = () => { clearTimeout(cap); tl.play(); };
  const cap = setTimeout(go, 6000);
  img.addEventListener('load', go, { once: true });
  img.addEventListener('error', go, { once: true });
}

export function initResolves(root: ParentNode = document, intro?: gsap.core.Timeline) {
  if (prefersReducedMotion()) return;
  root.querySelectorAll<HTMLElement>('[data-resolve]').forEach((plate) => {
    if (plate.dataset.resolveWired) return;
    plate.dataset.resolveWired = '1';
    const tl = resolveIn(plate);
    if (plate.hasAttribute('data-intro') && intro) playWhenLoaded(plate, tl);
    else {
      ScrollTrigger.create({
        trigger: plate,
        start: 'top 88%',
        once: true,
        onEnter: () => playWhenLoaded(plate, tl),
      });
    }
  });
}

/** The signature moment: the /generate result stage. More steps than a scroll resolve,
 *  then the mono readout types itself. */
export function resolveStage(stage: HTMLElement, readout: HTMLElement | null, text: string) {
  const tl = resolveIn(stage, { steps: 5, blur: isMobile() ? 0 : 5 });
  if (readout && text) typeReadout(readout, text, 0.9);
  tl.play();
  return tl;
}

/** Typewriter for the mono readout; real text stays in the DOM (aria-label). */
export function typeReadout(el: HTMLElement, final: string, duration = 0.9) {
  el.setAttribute('aria-label', final);
  const o = { p: 0 };
  return gsap.to(o, {
    p: 1,
    duration,
    ease: 'none',
    onUpdate: () => {
      const n = Math.min(final.length, Math.floor(o.p * final.length) + 1);
      const next = final.slice(0, n);
      if (el.textContent !== next) el.textContent = next;
    },
    onComplete: () => { el.textContent = final; },
  });
}
