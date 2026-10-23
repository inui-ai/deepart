// audit: crawl the public pages from / and report weight + hard-fail checks.
// Writes .shots-final/audit.txt (plain UTF-8): crawl size, the heaviest page's
// transfer breakdown, and every FAIL/WARN the checks found. 0/0 is the ship bar.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const ORIGIN = 'http://127.0.0.1:4400';
const the = { fail: [], warn: [] };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1445, height: 912 } });

page.on('pageerror', (e) => the.fail.push(`pageerror: ${String(e).slice(0, 120)}`));
page.on('console', (m) => {
  if (m.type() === 'error') the.warn.push(`console error: ${String(m.text()).slice(0, 120)}`);
});

const pages = [];
const queue = ['/'];
const seen = new Set();

while (queue.length && seen.size < 4) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);
  const types = new Map();
  const pending = [];
  const onResp = (r) => {
    const ct = (r.headers()['content-type'] ?? '').toLowerCase();
    let t = 'type:other';
    if (ct.includes('text/html')) t = 'type:html';
    else if (ct.includes('javascript')) t = 'type:js';
    else if (ct.includes('css')) t = 'type:css';
    else if (ct.includes('font')) t = 'type:font';
    else if (ct.startsWith('image/')) t = 'type:img';
    const key = `${t}:${r.url().slice(0, 90)}`;
    pending.push(
      r.body()
        .then((b) => { types.set(key, b.length); })
        .catch(() => {}),
    );
  };
  page.on('response', onResp);
  try {
    await page.goto(ORIGIN + path, { waitUntil: 'networkidle', timeout: 60000 });
  } catch {
    the.fail.push(`nav timeout on ${path}`);
  }
  page.off('response', onResp);
  await Promise.allSettled(pending);  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (overflow) the.fail.push(`${path}: horizontal overflow`);
  const badImgs = await page.evaluate(() =>
    [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc.slice(0, 80)),
  );
  if (badImgs.length) the.fail.push(`${path}: ${badImgs.length} broken image(s) ${JSON.stringify(badImgs.slice(0, 3))}`);
  const small = await page.evaluate(() => {
    const els = [...document.querySelectorAll('button, a, input, [role="radio"], [aria-label]')].filter(
      (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; },
    );
    return els.filter((el) => { const r = el.getBoundingClientRect(); return r.width < 24 || r.height < 24; }).length;
  });
  if (small > 0) the.warn.push(`${path}: ${small} interactive target(s) under 24 px`);
  const total = Math.round([...types.values()].reduce((a, b) => a + b, 0) / 1024);
  const kb = (t) => {
    const sum = [...types.entries()].filter(([k]) => k.startsWith(t)).reduce((a, [, b]) => a + b, 0);
    return Math.round(sum / 1024);
  };
  pages.push({
    path,
    total,
    breakdown: `html ${kb('type:html')} | JS ${kb('type:js')} (gz) | CSS ${kb('type:css')} (gz) | fonts ${kb('type:font')} | images ${kb('type:img')} | other ${kb('type:other')}`,
  });
  mkdirSync('.shots-final', { recursive: true });
  await page.screenshot({ path: `.shots-final/crawl-audit${path === '/' ? '-home' : path.replace(/\//g, '-')}.png`, fullPage: true });
  const hrefs = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
  for (const a of hrefs) {
    if (!a) continue;
    const u = new URL(a, ORIGIN);
    if (u.origin === ORIGIN && !u.pathname.includes('.') && !seen.has(u.pathname)) queue.push(u.pathname);
  }
}
await browser.close();

const heaviest = pages.slice().sort((a, b) => b.total - a.total)[0] ?? { path: '?', total: 0, breakdown: '' };
const lines = [
  `${pages.length} pages crawled from ${ORIGIN}/ : ${pages.map((p) => p.path).join(' ')}`,
  `heaviest page ${heaviest.path}: ~${heaviest.total} KB | ${heaviest.breakdown}`,
  `checks: pageerrors, console errors, horizontal overflow, broken images, 24 px targets (body sizes raw bytes)`,
  `${the.fail.length} FAIL, ${the.warn.length} WARN`,
  ...the.fail.map((f) => `FAIL ${f}`),
  ...the.warn.map((w) => `WARN ${w}`),
];
writeFileSync('.shots-final/audit.txt', lines.join('\n') + '\n', 'utf8');
console.log(lines.join('\n'));
