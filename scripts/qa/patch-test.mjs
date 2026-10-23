// patch-test: isolate what constrains hero__sub to 182px on the phone.
import { chromium } from 'playwright';

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
await p.waitForTimeout(3000);

const before = await p.evaluate(() => {
  const sub = document.querySelector('.hero__sub');
  const cs = getComputedStyle(sub);
  return {
    inline: sub.style.cssText,
    w: Math.round(sub.getBoundingClientRect().width),
    width: cs.width, maxW: cs.maxWidth, minW: cs.minWidth, display: cs.display, overflow: cs.overflow,
    transform: cs.transform, contain: cs.contain, float: cs.cssFloat,
  };
});

const mid = await p.evaluate(() => {
  const sub = document.querySelector('.hero__sub');
  sub.style.maxWidth = 'none';
  sub.style.width = '358px';
  const w = Math.round(sub.getBoundingClientRect().width);
  sub.style.removeProperty('max-width');
  sub.style.removeProperty('width');
  return { patchedW: w };
});

const colsPatch = await p.evaluate(() => {
  const row = document.querySelector('.hero__row');
  row.style.display = 'block';
  const subW = Math.round(document.querySelector('.hero__sub').getBoundingClientRect().width);
  row.style.removeProperty('display');
  return { blockW: subW };
});

const tracks = await p.evaluate(() => {
  const row = document.querySelector('.hero__row');
  const sub = document.querySelector('.hero__sub');
  const subRow = getComputedStyle(sub).gridRow, subCol = getComputedStyle(sub).gridColumn;
  sub.style.gridArea = 'auto'; // clear any placement
  sub.style.gridColumn = '1';
  const single = Math.round(sub.getBoundingClientRect().width);
  sub.style.removeProperty('grid-column');
  return { subRow, subCol, singleColW: single, anim: getComputedStyle(row).gridTemplateColumns.slice(0, 40) };
});

console.log(JSON.stringify({ before, mid, colsPatch, tracks }, null, 1));
await browser.close();
