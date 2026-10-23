// hero-render: poll the plate URL until a real render replaces rate-limit placeholder.
// Placeholder detection: sample mean RGB on canvas — the pollinations placeholder is yellow.
import { chromium } from 'playwright';
import { HERO_PROMPT, pollUrl, seedStore } from '../../src/data/site.ts';

const url = pollUrl(HERO_PROMPT, seedStore.hero.seed, 1600, 680);
console.log('plate url:', url.slice(0, 120) + '...');

const browser = await chromium.launch();
for (let i = 1; i <= 7; i++) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 500 } });
  const p = await ctx.newPage();
  try {
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForFunction(() => { const i = document.querySelector('img'); return i && i.complete && i.naturalWidth > 0; }, { timeout: 90000 });
    const sample = await p.evaluate(() => new Promise((res) => {
      const i = document.querySelector('img');
      const c = document.createElement('canvas');
      c.width = 40; c.height = Math.max(1, Math.round(40 * (i.naturalHeight / i.naturalWidth)));
      const x = c.getContext('2d');
      x.drawImage(i, 0, 0, c.width, c.height);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let r = 0, g = 0, b = 0, n = d.length / 4;
      for (let k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; }
      res({ w: i.naturalWidth, h: i.naturalHeight, r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) });
    }));
    const placeholder = sample.r > 175 && sample.g > 135 && sample.b < 115 && sample.b < sample.g - 40;
    console.log(`attempt ${i}: ${JSON.stringify(sample)} ${placeholder ? '-> placeholder, retry in 50s' : '-> REAL RENDER'}`);
    if (!placeholder) { await ctx.close(); console.log('OK'); await browser.close(); process.exit(0); }
  } catch (e) {
    console.log(`attempt ${i}: ${String(e).slice(0, 80)} retry in 50s`);
  }
  await ctx.close();
  await new Promise((r) => setTimeout(r, 50000));
}
await browser.close();
console.log('STILL PLACEHOLDER AFTER 7 ATTEMPTS');
process.exit(1);
