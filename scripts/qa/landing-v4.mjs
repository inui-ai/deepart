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

  out.band = await p.evaluate(() => {
    const b = document.querySelector('.band');
    const cap = document.querySelector('.band__cap')?.textContent?.trim();
    return { lime: b && getComputedStyle(b).backgroundColor, cap };
  });

  out.promo = await p.evaluate(() => {
    const card = document.querySelector('.promo__card');
    const img = document.querySelector('.promo__media img');
    return {
      cardGlass: card ? getComputedStyle(card).backdropFilter : null,
      img: img ? `${img.naturalWidth}x${img.naturalHeight}` : null,
      link: document.querySelector('.promo__card a')?.getAttribute('href'),
    };
  });

  out.trio = await p.evaluate(() => ({
    cards: document.querySelectorAll('.trio__card').length,
    big: document.querySelector('.trio__big')?.textContent,
    rows: document.querySelectorAll('.trio__row').length,
    ink: (() => { const c = document.querySelector('.trio__card--ink'); return c ? getComputedStyle(c).backgroundColor : null; })(),
  }));

  out.run = await p.evaluate(() => {
    const r = document.querySelector('.run__inner');
    return { dark: r ? getComputedStyle(r).backgroundColor : null, btn: document.querySelector('.run__inner a')?.getAttribute('href') };
  });

  out.ladder = await p.evaluate(() => ({
    entries: document.querySelectorAll('.ladder__entry').length,
    outcomes: [...document.querySelectorAll('.ladder__outcome')].map((o) => o.textContent.replace('the plate', '').trim()),
    mediaInit: [...document.querySelectorAll('.ladder__media img')].map((i) => i.naturalWidth),
  }));

  out.pipe = await p.evaluate(() => ({
    rows: document.querySelectorAll('.pipe__row').length,
    nums: [...document.querySelectorAll('.pipe__num')].map((n) => n.textContent),
    gradient: getComputedStyle(document.querySelector('.pipe__inner')).backgroundImage.slice(0, 40),
  }));

  out.truths = await p.evaluate(() => {
    const t = document.querySelector('.truths__track');
    const cs = getComputedStyle(t);
    return { items: t.children.length, animated: cs.animationName, dur: cs.animationDuration };
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
    trioCols: getComputedStyle(document.querySelector('.trio')).gridTemplateColumns.split(' ').length,
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
