// hero-swap: the new aerial-dawn hero plate loads and matches the preload URL.
import { chromium } from 'playwright';

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1445, height: 912 } });
const t0 = Date.now();

await p.goto('http://127.0.0.1:4400/', { waitUntil: 'domcontentloaded', timeout: 60000 });
// wait for the hero image up to ~140s (fresh render limiter on first hit)
const img = await p.waitForFunction(() => {
  const i = document.querySelector('.hero__plate img, .plate__media img');
  return i && i.complete && i.naturalWidth > 0;
}, { timeout: 140000 });

const m = await p.evaluate(() => {
  const i = document.querySelector('.plate__media img');
  const link = document.querySelector('link[rel="preload"][as="image"]');
  const spec = [...document.querySelectorAll('.plate__spec span')].map((s) => s.textContent);
  return {
    imgW: i.naturalWidth, imgH: i.naturalHeight,
    srcMatchesPreload: !!link && link.href === i.currentSrc,
    spec,
  };
});
console.log('hero loaded in', ((Date.now() - t0) / 1000).toFixed(1) + 's', JSON.stringify(m));

await p.waitForTimeout(900);
await p.screenshot({ path: '.shots/feature/hero-dawn.png' });
await browser.close();
