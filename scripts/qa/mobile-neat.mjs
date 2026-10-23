// mobile-neat: tidy check at phone widths across all pages.
// Per page + width: overflow, small tap targets, key measurements, full-page shot.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
mkdirSync(new URL('../../.shots/feature/', import.meta.url), { recursive: true });

const browser = await chromium.launch();
const pages = [
  ['/', 'home'],
  ['/generate', 'generate'],
  ['/subhan', 'admin'],
  ['/__no-such-page-mobile', '404'],
];
const widths = [[390, 844], [360, 760]];

for (const w of widths) {
  for (const [path, label] of pages) {
    const tag = `${label}-${w[0]}`;
    const p = await browser.newPage({ viewport: { width: w[0], height: w[1] } });
    const errs = [];
    p.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
    await p.goto('http://127.0.0.1:4400' + path, { waitUntil: 'load' }).catch(() => {});
    await p.waitForTimeout(3400);
    await p.evaluate(async () => {
      const t = document.body.scrollHeight;
      for (let y = 0; y <= t; y += 420) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
      scrollTo(0, 0);
    });
    await p.waitForTimeout(600);
    const m = await p.evaluate(() => {
      const bar = document.querySelector('.frame__bar');
      const cta = document.querySelector('.frame__cta .barcta');
      const r = (el) => el ? el.getBoundingClientRect() : null;
      const barR = r(bar), ctaR = r(cta);
      let card = document.querySelector('.hero__card');
      if (card && card.getBoundingClientRect().height < 4) {
        card = card.closest('.hero__card'); // reveal may have moved it
      }
      return {
        overflowX: document.documentElement.scrollWidth > innerWidth + 1,
        bar: barR ? { x: Math.round(barR.left), w: Math.round(barR.width), h: Math.round(barR.height) } : null,
        cta: ctaR ? { x: Math.round(ctaR.left), w: Math.round(ctaR.width) } : null,
        villains: [...(barR ? [barR] : []), ...(ctaR ? [ctaR] : [])].some((b) => b.left < -1 || b.right > innerWidth + 1),
        cardW: card ? Math.round(card.getBoundingClientRect().width) : null,
        headline: Math.round(parseFloat(getComputedStyle(document.querySelector('.hero__title, .gen__h1, .admin h1, .lost__title') || document.body).fontSize)),
        footer: !!document.querySelector('footer'),
      };
    });
    await p.screenshot({ path: new URL(`../../.shots/feature/mob-${tag}.png`, import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''), fullPage: true });
    console.log(tag, JSON.stringify({ ...m, errs: errs.length }));
    await p.close();
  }
}
await browser.close();
