// Hydration probe: does React #418 fire with and without a populated store?
// A: fresh context (empty storage) — matches the QA crawl conditions.
// B: populated context (deepart:v1 injected before load) — matches real users.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const STORE = readFileSync('.shots/feature/store.json', 'utf8');
const PAGES = ['/', '/generate', '/admin'];
const browser = await chromium.launch();
const out = { A: {}, B: {} };

for (const ctxLabel of ['A', 'B']) {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = await ctx.newPage();
  if (ctxLabel === 'B') {
    await page.addInitScript((s) => { try { localStorage.setItem('deepart:v1', s); } catch {} }, STORE);
  }
  for (const p of PAGES) {
    const errors = [];
    const onConsole = (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)); };
    page.on('console', onConsole);
    await page.goto('http://127.0.0.1:4400' + p, { waitUntil: 'load' });
    await page.evaluate(() => new Promise((r) => setTimeout(r, 2500)));
    page.off('console', onConsole);
    out[ctxLabel][p === '/' ? 'home' : p.slice(1)] = errors;
  }
  await ctx.close();
}

console.log(JSON.stringify(out, null, 2));
await browser.close();
