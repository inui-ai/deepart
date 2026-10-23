// Hero v3 at the user's real viewport (1920x1080): statement stays high and left,
// plate lands full-bleed, no dead-zone split, no page overflow.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch();
try {
  const p = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
  await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p.waitForTimeout(4200);

  const hero = await p.evaluate(() => {
    const t = document.querySelector('.hero__title');
    const plate = document.querySelector('.hero__plate');
    const sub = document.querySelector('.hero__sub');
    const cta = document.querySelector('.hero__cta');
    const r = (el) => el ? el.getBoundingClientRect() : null;
    return {
      titleSize: getComputedStyle(t).fontSize,
      titleTop: Math.round(r(t).top),
      titleLines: Math.round(r(t).height / parseFloat(getComputedStyle(t).lineHeight)),
      plateBox: r(plate) ? { w: Math.round(r(plate).width), x: Math.round(r(plate).x), y: Math.round(r(plate).y) } : null,
      plateRight: Math.round(r(plate).right),
      viewport: { w: innerWidth },
      ctaX: Math.round(r(cta).x),
      imgLoaded: document.querySelector('.hero__plate img')?.naturalWidth ?? 0,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  const shot = await p.screenshot();
  writeFileSync(new URL('../../.shots/feature/hero-v3-1920.png', import.meta.url), shot);

  // phone
  const p2 = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p2.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p2.waitForTimeout(3400);
  const phoneShot = await p2.screenshot();
  writeFileSync(new URL('../../.shots/feature/hero-v3-phone.png', import.meta.url), phoneShot);

  console.log(JSON.stringify({ hero, errors, overflow2: await p2.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) }));
  await browser.close();
} catch (e) {
  console.error('FATAL', e);
  await browser.close();
  process.exit(1);
}
