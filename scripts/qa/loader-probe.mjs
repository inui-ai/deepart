// Loader-gate probe v2: measure in-page when the gate lifts (is-loaded + loader hidden),
// then reload to prove the repeat-visit skip makes the second load instant.
import { chromium } from 'playwright';

const INIT = `
  window.__gate = null;
  const tick = () => {
    const root = document.getElementById('loader');
    const gone = !root || root.hidden || getComputedStyle(root).visibility === 'hidden';
    if (gone && document.documentElement.classList.contains('is-loaded')) {
      window.__gate = performance.now();
      clearInterval(iv);
    }
  };
  const iv = setInterval(tick, 50);
  setTimeout(() => clearInterval(iv), 9000);
`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
const page = await ctx.newPage();
await page.addInitScript(INIT);
const out = {};
for (const run of ['first', 'repeat']) {
  const t0 = Date.now();
  await page.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  const gate = await page.evaluate(() => new Promise((r) => {
    const t = setInterval(() => { if (window.__gate > 0) { clearInterval(t); r(Math.round(window.__gate)); } }, 40);
    setTimeout(() => { clearInterval(t); r(-1); }, 9500);
  }));
  out[run] = { gateAtMs: gate, loaderCount: await page.evaluate(() => document.querySelector('[data-loader-count]')?.textContent ?? null) };
  if (run === 'first') await page.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
}
console.log(JSON.stringify(out));
await browser.close();
