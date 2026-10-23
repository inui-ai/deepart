// narrow-check: why is the phone sub narrow, and why is the ad strip empty?
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch();

const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e).slice(0, 140)));
p.on('console', (c) => { if (c.type() === 'error') errors.push('console: ' + c.text().slice(0, 140)); });
await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
await p.waitForTimeout(3000);

const out = await p.evaluate(() => {
  const row = document.querySelector('.hero__row');
  const sub = document.querySelector('.hero__sub');
  const strip = document.querySelector('.home__strip');
  const slot = document.querySelector('.home__strip > *');
  return {
    rowCols: row ? getComputedStyle(row).gridTemplateColumns : null,
    rowColsCount: row ? getComputedStyle(row).gridTemplateColumns.split(' ').length : null,
    subCol: sub ? getComputedStyle(sub).gridColumn : null,
    subW: sub ? Math.round(sub.getBoundingClientRect().width) : null,
    stripHTML: strip ? strip.innerHTML.slice(0, 300) : null,
    stripChildCount: strip ? strip.children.length : null,
    slotTag: slot ? slot.tagName + '.' + slot.className : null,
    slotBound: slot ? (() => { const b = slot.getBoundingClientRect(); return `${Math.round(b.width)}x${Math.round(b.height)}`; })() : null,
    lsSlot: (() => {
      try { return JSON.parse(localStorage.getItem('deepart:v1')).ads.slice(0, 6); } catch { return null; }
    })(),
  };
});
console.log(JSON.stringify(out, null, 1));
console.log('errors:', errors);
await browser.close();
