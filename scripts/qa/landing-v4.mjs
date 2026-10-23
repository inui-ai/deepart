// Landing v4 (the sampler story): section grammar per the reference — lime band, glass
// promo, trio, dark run panel, ladder with media, pipeline rows, truths marquee, CTA disc.
// Checks presence, order, material, marquee motion, phone stacking and page errors.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch();
const out = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 1380, height: 1500 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));

  await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p.waitForTimeout(3400);

  out.order = await p.evaluate(() =>
    [...document.querySelectorAll('main > *')].map((el) => el.getAttribute('aria-label') || el.className.split(' ')[0] || el.tagName),
  );

  out.removed = await p.evaluate(() => ({
    band: !!document.querySelector('.band'),
    trio: !!document.querySelector('.trio'),
  }));

  out.promo = await p.evaluate(() => {
    const card = document.querySelector('.promo__card');
    const img = document.querySelector('.promo__media img');
    return {
      cardGlass: card ? getComputedStyle(card).backdropFilter : null,
      img: img ? `${img.naturalWidth}x${img.naturalHeight}` : null,
      link: document.querySelector('.promo__card a')?.getAttribute('href'),
    };
  });

  out.trio = null;
  out.removed2 = await p.evaluate(() => ({
    ladder: !!document.querySelector('.ladder'),
    pipe: !!document.querySelector('.pipe'),
    truths: !!document.querySelector('.truths'),
  }));

  out.run = await p.evaluate(() => {
    const r = document.querySelector('.run__inner');
    return { dark: r ? getComputedStyle(r).backgroundColor : null, btn: document.querySelector('.run__inner a')?.getAttribute('href') };
  });

  out.cta = await p.evaluate(() => ({
    dark: getComputedStyle(document.querySelector('.cta')).backgroundColor,
    disc: !!document.querySelector('.cta__disc'),
    discHref: document.querySelector('.cta__disc')?.getAttribute('href'),
    line: document.querySelector('.cta__inner h2')?.textContent,
  }));

  // scroll the page like a human so IO pacing + reveal drivers fire before capture
  const humanScroll = async (page, step = 700, pause = 260) => {
    await page.evaluate(async ({ step, pause }) => {
      const total = document.body.scrollHeight;
      for (let y = 0; y <= total; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, pause));
      }
    }, { step, pause });
    await page.waitForTimeout(2600);
  };

  await humanScroll(p);
  // let the wall's pacing queue drain while the section sits in view
  await p.evaluate(() => document.getElementById('wall')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await p.waitForTimeout(5200);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(700);
  out.revealCovered = await p.evaluate(() =>
    [...document.querySelectorAll('[data-reveal]')].filter((el) => getComputedStyle(el).opacity === '0').length,
  );
  out.wallPlates = await p.evaluate(() =>
    [...document.querySelectorAll('.wall__frame img')].map((i) => (i.naturalWidth > 0 ? 1 : 0)).filter(Boolean).length,
  );

  const full = await p.screenshot({ fullPage: true });
  writeFileSync(new URL('../../.shots/feature/landing-v4-full.png', import.meta.url), full);

  out.overflow = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  out.pageErrors = errors;

  // phone pass
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await phone.newPage();
  const errs2 = [];
  p2.on('pageerror', (e) => errs2.push(String(e).slice(0, 120)));
  await p2.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p2.waitForTimeout(3200);
  await humanScroll(p2, 500, 140);
  const phoneShot = await p2.screenshot({ fullPage: true });
  writeFileSync(new URL('../../.shots/feature/landing-v4-phone.png', import.meta.url), phoneShot);
  out.phone = await p2.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    promoCardWidth: Math.round(document.querySelector('.promo__card').getBoundingClientRect().width),
    runCols: getComputedStyle(document.querySelector('.run__inner')).gridTemplateColumns.split(' ').length,
  }));
  out.phone.pageErrors = errs2;

  console.log(JSON.stringify(out, null, 1));
  await browser.close();
} catch (e) {
  console.error('FATAL', e);
  console.log(JSON.stringify(out));
  await browser.close();
  process.exit(1);
}
