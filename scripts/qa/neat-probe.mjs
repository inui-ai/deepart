// neat-probe: alignment / positioning audit for the trimmed home page.
// Screenshots at 1920 / 1445 / 390 + programmatic alignment metrics.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4400/';
mkdirSync(new URL('../../.shots/feature/', import.meta.url), { recursive: true });

const browser = await chromium.launch();

const settle = async (p) => {
  await p.waitForTimeout(2600);
  await p.evaluate(async () => {
    const total = document.body.scrollHeight;
    for (let y = 0; y <= total; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 180)); }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(1800);
};

async function check(width, height, scale = 1) {
  const p = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
  await p.goto(BASE, { waitUntil: 'load' });
  await settle(p);

  const m = await p.evaluate(() => {
    const r = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: Math.round(b.left + scrollX), y: Math.round(b.top + scrollY), w: Math.round(b.width), right: Math.round(b.right + scrollX), h: Math.round(b.height) };
    };
    const out = { viewport: innerWidth };

    out.strip = r('.home__strip');
    out.stripInner = (() => {
      const a = document.querySelector('.home__strip a, .home__strip img, .home__strip [data-ad]');
      if (!a) return null;
      const b = a.getBoundingClientRect();
      return { w: Math.round(b.width), h: Math.round(b.height), visible: b.height > 4 };
    })();

    // hero: eyebrow/left-top block vs mono right — same top?
    out.eyebrow = r('.hero__eyebrow');
    out.meta = r('.hero__meta');
    out.title = r('.hero__title');
    out.sub = r('.hero__sub');
    out.cta = r('.hero__cta');
    out.steps = r('.hero__steps');
    out.plate = r('.hero__plate .plate__media');

    // run panel: block vs its columns
    out.run = r('.run');
    out.runInner = r('.run__inner');
    out.runH2 = r('.run__inner h2');
    out.runBtn = r('.run__inner .btn');

    // wall
    out.wall = r('.wall');
    out.wallHead = r('.wall__head');
    out.wallKick = r('.wall__kick');
    out.wallBar = r('.wall__bar');
    out.wallProg = r('.wall__prog');
    out.wallArrows = r('.wall__arrows');
    out.wallCounter = r('.wall__counter');
    // first frame left edge vs head left edge (gutter alignment)
    out.frame1 = r('.wall__frame');

    // cta
    out.cta = r('.cta');
    out.ctaH2 = r('.cta__inner h2');
    out.ctaDisc = r('.cta__disc');

    // footer
    out.footBrand = r('.foot__brand');
    out.footNav = r('.foot__nav');
    out.footMeta = r('.foot__meta');

    // steps collision with sub (desktop)
    if (out.steps && out.sub) out.stepsGapSub = out.steps.x - out.sub.right;
    return out;
  });

  const shot = await p.screenshot({ fullPage: true });
  writeFileSync(new URL(`../../.shots/feature/neat-${width}.png`, import.meta.url), shot);
  console.log(`--- ${width}x${height} ---`);
  console.log(JSON.stringify({ ...m, errors }, null, 1));
  await p.close();
}

await check(1920, 1080);
await check(1445, 912);
await check(390, 844);

await browser.close();
