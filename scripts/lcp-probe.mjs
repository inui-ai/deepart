// One-shot probe: entries that Chromium reports as LCP candidates, in order.
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4400/';
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true, hasTouch: true, deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__lcp = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      const t = e.element ? `${e.element.tagName.toLowerCase()}.${[...e.element.classList].join('.')}` : '(removed)';
      window.__lcp.push(`${Math.round(e.startTime)}ms ${(e.size / 1000).toFixed(0)}k ${t} text="${(e.element?.textContent ?? '').trim().slice(0, 30)}"`);
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
});
await page.emulateMedia({ reducedMotion: 'no-preference' });
// same throttling the shoot uses
const client = await ctx.newCDPSession(page);
await client.send('Network.enable');
await client.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: 750 * 1024 });
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
const probe = [`t,style,rect`];
for (let i = 0; i < 12; i++) {
  const row = await page.evaluate(() => {
    const h = document.querySelector('.hero__title');
    if (!h) return 'no h1';
    const cs = getComputedStyle(h);
    const r = h.getBoundingClientRect();
    return `${performance.now().toFixed(0)}ms vis=${cs.visibility} op=${cs.opacity} disp=${cs.display} rect=${Math.round(r.width)}x${Math.round(r.height)} font=${cs.fontFamily.slice(0, 24)}`;
  });
  console.log(row);
  await page.waitForTimeout(400);
}
await page.waitForTimeout(7500);
const rows = await page.evaluate(() => window.__lcp);
console.log(`lcp trail: ${url}`);
for (const r of rows) console.log(r);
await browser.close();
