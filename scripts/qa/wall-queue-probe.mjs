// Wall queue fix check: frames load when the strip brings them into range.
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const p = await (await browser.newContext({ viewport: { width: 1380, height: 1500 } })).newPage();
  await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p.waitForTimeout(2800);
  await p.evaluate(() => document.getElementById('wall')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await p.waitForTimeout(3000);
  const mid = await p.evaluate(() => [...document.querySelectorAll('.wall__frame img')].map((i) => i.naturalWidth > 0 ? 1 : 0).filter(Boolean).length);
  await p.evaluate(() => { const s = document.querySelector('.wall__strip'); s.scrollLeft = s.scrollWidth; });
  await p.waitForTimeout(10000);
  const detail = await p.evaluate(() =>
    [...document.querySelectorAll('.wall__frame img')].map((i) => {
      const seed = (i.dataset.src || '').split('seed=')[1]?.split('&')[0] ?? '?';
      return `${seed}:${i.src ? 'src' : 'none'}/nw${i.naturalWidth}`;
    }).join(' '),
  );
  console.log(JSON.stringify({ loadedAtWallMid: mid, afterStripEnd: detail }));
  await browser.close();
} catch (e) {
  console.error('FATAL', e);
  await browser.close();
  process.exit(1);
}
