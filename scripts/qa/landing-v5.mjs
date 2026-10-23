// landing-v5: structural probe of the reworked landing (hero + gallery deck).
// Checks: order, two-voice headline colors, glass card, burger/menu, gallery grid,
// captions, spec lines, overflow on desktop + phone, page errors.
import { chromium } from 'playwright';

const browser = await chromium.launch();
const out = { pageErrors: [] };
const p = await browser.newPage({ viewport: { width: 1445, height: 912 } });
p.on('pageerror', (e) => out.pageErrors.push(String(e).slice(0, 140)));
await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
await p.waitForTimeout(3400);

out.order = await p.evaluate(() =>
  [...document.querySelectorAll('main > *')].map((el) => el.className.split(' ')[0] || el.tagName),
);

out.hero = await p.evaluate(() => {
  const a = document.querySelector('.hero__line--a');
  const b = document.querySelector('.hero__line--b');
  const card = document.querySelector('.hero__card');
  const spec = document.querySelector('.hero__plate .plate__spec');
  const img = document.querySelector('.hero__plate img');
  return {
    a: a?.textContent?.trim().slice(0, 40),
    aColor: a ? getComputedStyle(a).color : null,
    b: b?.textContent?.trim().slice(0, 40),
    bColor: b ? getComputedStyle(b).color : null,
    cardTitle: card?.querySelector('.hero__cardTitle')?.textContent?.slice(0, 40),
    cardCta: card?.querySelector('.barcta')?.getAttribute('href'),
    cardMeta: card?.querySelector('.hero__cardMeta')?.textContent?.trim(),
    spec: spec ? [...spec.children].map((s) => s.textContent) : null,
    imgLoaded: img ? img.naturalWidth > 0 : false,
    cardOpacity: card ? getComputedStyle(card).opacity : null,
  };
});

// burger opens the ink overlay, the bar stays visible above it
out.menu = await p.evaluate(async () => {
  const btn = document.querySelector('.bar__burger');
  btn.click();
  await new Promise((r) => setTimeout(r, 450));
  const menu = document.querySelector('#menu');
  const bar = document.querySelector('.frame__bar');
  const frame = document.querySelector('.frame');
  const r1 = menu.getBoundingClientRect();
  const r2 = bar.getBoundingClientRect();
  const zi = getComputedStyle(frame).zIndex;
  const links = [...menu.querySelectorAll('a')].map((a) => a.textContent);
  btn.click(); // close again
  await new Promise((r) => setTimeout(r, 250));
  return { hidden: menu.hidden, links, barOverMenu: r2.bottom > 0 && getComputedStyle(bar).zIndex, zi };
});

out.gal = await p.evaluate(() => {
  const figs = [...document.querySelectorAll('.gal__fig')];
  return {
    count: figs.length,
    cols: figs.slice(0, 4).map((f) => f.style.gridColumn || getComputedStyle(f).gridColumnStart),
    caps: figs.map((f) => f.querySelector('.gal__cap b')?.textContent),
    specs: figs.map((f) => f.querySelector('.gal__cap span')?.textContent),
    imgsLoaded: figs.every((f) => (f.querySelector('img')?.naturalWidth ?? 0) > 0),
    kicker: document.querySelector('.gal__kicker')?.textContent?.trim(),
  };
});

out.overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
phone.on('pageerror', (e) => out.phoneErrors === undefined && (out.phoneErrors = []));
await phone.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
await phone.waitForTimeout(2600);
out.phone = await phone.evaluate(() => ({
  overflow: document.documentElement.scrollWidth > innerWidth + 1,
  crumbHidden: getComputedStyle(document.querySelector('.frame__page')).display,
  barVisible: !!document.querySelector('.frame__bar')?.getBoundingClientRect().width,
  heroAr: getComputedStyle(document.querySelector('.hero__plate .plate__media')).aspectRatio,
}));
console.log(JSON.stringify(out, null, 1));
await browser.close();
