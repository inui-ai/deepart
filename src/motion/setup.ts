// Global motion for DeepArt: runs once on the client, before the first page initializes.
// Loader = the sampler counting its steps. Page transition = an ink wipe with a lime leading
// edge (the "sample flash"). The resolve driver is wired per page from setup's onPage.
import { gsap } from 'gsap';
import { ease, onScroll, onPage, setLoaderExit, setLoaderFormat, setTransition } from '@/engine';
import { startIdle } from './idle';
import { initResolves } from './resolve';
import { buttonFill } from './buttons';

export function setupMotion() {
  // Loader counter: a diffusion run counts its denoising steps, 00/14 → 14/14.
  setLoaderFormat((p) => `${String(Math.round((p / 100) * 14)).padStart(2, '0')}/14`);

  setLoaderExit((root) => {
    const count = root.querySelector('[data-loader-count]');
    const name = root.querySelector('[data-loader-out]:not([data-loader-count])');
    const flash = root.querySelector('.loader__flash');
    return gsap.timeline()
      .to(count, { yPercent: -110, duration: 0.5, ease: ease.inOut })
      .to(name as Element, { yPercent: -110, duration: 0.6, ease: ease.inOut }, '<0.08')
      .set(flash as Element, { scaleX: 1, transformOrigin: 'left center', duration: 0.01 })
      .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: ease.inOut }, '-=0.05')
      .to(flash as Element, { scaleX: 0.2, duration: 0.9, ease: ease.inOut }, '<');
  });

  // Page transition: an ink panel with a lime hairline edge wipes up, then lifts off.
  setTransition({
    leave: (c) => {
      const panel = c.querySelector('.curtain__panel') as HTMLElement;
      const edge = c.querySelector('.curtain__edge--a') as HTMLElement;
      return gsap.timeline()
        .set(c, { autoAlpha: 1 })
        .set(panel, { yPercent: 100 })
        .to(edge, { yPercent: 100, duration: 0.01 })
        .fromTo(edge, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: ease.inOut })
        .to(panel, { yPercent: 0, duration: 0.65, ease: ease.inOut }, '<0.12');
    },
    enter: (c) => {
      const panel = c.querySelector('.curtain__panel') as HTMLElement;
      const edge = c.querySelector('.curtain__edge--b') as HTMLElement;
      return gsap.timeline()
        .set(edge, { yPercent: 0 })
        .to(panel, { yPercent: -100, duration: 0.75, ease: ease.inOut })
        .to(edge, { yPercent: -100, duration: 0.6, ease: ease.inOut }, '<0.12')
        .set(c, { autoAlpha: 0 })
        .set(panel, { yPercent: 100 });
    },
  });

  // Wire the resolve driver on every page: plates join the intro or a scroll trigger.
  onPage(({ intro }) => {
    initResolves(document, intro);
  });

  // Primary buttons flood with ink from the pointer (one treatment, registered once).
  buttonFill();

  // The frame steps aside while scrolling down and returns on scroll up.
  let last = 0;
  onScroll(({ y }) => {
    if (Math.abs(y - last) < 4) return;
    document.documentElement.classList.toggle('frame-away', y > 160 && y > last);
    last = y;
  });

  startIdle();
}
