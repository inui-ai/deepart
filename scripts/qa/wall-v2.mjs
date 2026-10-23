// Wall redesign verification: placement ladder, IO loading, lightbox regression, screens.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch();
const out = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 1380, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 100)));

  await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p.waitForTimeout(3200);
  await p.evaluate(() => document.getElementById('wall')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
  await p.waitForTimeout(2600); // resolve paints in range
  out.sheet = await p.evaluate(() => {
    const sheet = document.querySelector('.wall__sheet');
    const cells = [...sheet.querySelectorAll('.wall__cell')];
    const sr = sheet.getBoundingClientRect();
    return {
      cells: cells.length,
      cols: cells.map((c) => getComputedStyle(c).gridColumnStart + '/' + getComputedStyle(c).gridColumnEnd),
      dys: cells.map((c) => getComputedStyle(c).translate),
      overlaps: (() => {
        const r = cells.map((c) => c.getBoundingClientRect());
        const dirty = [];
        for (let i = 0; i < r.length; i++) {
          for (let j = i + 1; j < r.length; j++) {
            const a = r[i], b = r[j];
            const hit = !(a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1);
            if (hit) dirty.push([i + 1, j + 1]);
          }
        }
        return dirty;
      })(),
      sheetW: Math.round(sr.width),
    };
  });
  const shot = await p.screenshot({ fullPage: true });
  writeFileSync(new URL('../../.shots/feature/wall-v2.png', import.meta.url), shot);

  // lightbox regression on the new cells
  await p.evaluate(() => document.querySelector('.wall__cell .plate__open')?.click());
  await p.waitForTimeout(400);
  out.lightbox = await p.evaluate(() => {
    const lb = document.querySelector('.lightbox');
    return { open: !!lb, focused: document.activeElement?.className || document.activeElement?.tagName };
  });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  out.lightboxClosed = await p.evaluate(() => !document.querySelector('.lightbox'));

  // phone: full-width poster stack
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await phone.newPage();
  await p2.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p2.waitForTimeout(3200);
  await p2.evaluate(() => {
    document.getElementById('wall')?.scrollIntoView({ behavior: 'instant' });
  });
  await p2.waitForTimeout(1800);
  const mshot = await p2.screenshot();
  writeFileSync(new URL('../../.shots/feature/wall-v2-phone.png', import.meta.url), mshot);
  out.phone = await p2.evaluate(() => {
    const cells = [...document.querySelectorAll('.wall__sheet > li')];
    const r = cells[0]?.getBoundingClientRect();
    const r2 = cells[1]?.getBoundingClientRect();
    return {
      cellW: Math.round(r?.width ?? 0),
      stacked: Math.round(r?.left ?? 0) === Math.round(r2?.left ?? 0) && Math.round((r?.bottom ?? 0)) < Math.round(r2?.top ?? 0),
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  out.pageErrors = errors;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
} catch (e) {
  console.error('FATAL', e);
  console.log(JSON.stringify(out));
  await browser.close();
  process.exit(1);
}
