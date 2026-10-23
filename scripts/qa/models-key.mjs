// models-key: admin model form shows key/endpoint/model-id; a stored key flows into the
// render request URL (token=...) and respects the CSP (no console errors).
import { chromium } from 'playwright';

const browser = await chromium.launch();
const errs = [];

// A. admin Models tab renders the new fields.
const p = await browser.newPage({ viewport: { width: 1445, height: 912 } });
p.on('pageerror', (e) => errs.push('admin:' + String(e).slice(0, 100)));
await p.goto('http://127.0.0.1:4400/subhan', { waitUntil: 'load' });
await p.waitForTimeout(4000);
await p.evaluate(() => [...document.querySelectorAll('.adm__tab')].find((b) => b.textContent === 'Models')?.click());
await p.waitForTimeout(700);
const labels = await p.evaluate(() =>
  [...document.querySelectorAll('.adm__adder .adm__label')].map((l) => l.textContent),
);
console.log('A. adder labels:', JSON.stringify(labels));
const keyType = await p.evaluate(() => document.querySelector('.adm__adder input[type="password"]')?.type ?? 'MISSING');
console.log('A. key field is password-masked:', keyType === 'password');

// seed turbo with a key; enable it via the store so the sampler picks it first.
await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('deepart:v1'));
  const t = s.models.find((m) => m.slug === 'turbo');
  t.apiKey = 'TEST-KEY-123';
  t.enabled = true;
  const f = s.models.find((m) => m.slug === 'flux');
  f.enabled = false;
  localStorage.setItem('deepart:v1', JSON.stringify(s));
});

// B. generate page: turbo select + the request carries token=TEST-KEY-123.
const g = await browser.newPage({ viewport: { width: 1445, height: 912 } });
g.on('pageerror', (e) => errs.push('gen:' + String(e).slice(0, 100)));
let reqUrl = '';
g.on('request', (r) => { if (r.url().includes('image.pollinations.ai/prompt')) reqUrl = r.url(); });
await g.goto('http://127.0.0.1:4400/generate', { waitUntil: 'load' });
await g.waitForTimeout(3500);
// seed the store once hydration has written its key, then reload so hydrate() adopts it
await g.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('deepart:v1'));
  const t = s.models.find((m) => m.slug === 'turbo');
  t.apiKey = 'TEST-KEY-123'; t.enabled = true;
  s.models.find((m) => m.slug === 'flux').enabled = false;
  localStorage.setItem('deepart:v1', JSON.stringify(s));
});
await g.reload({ waitUntil: 'load' });
await g.waitForTimeout(3500);
await g.fill('textarea', 'a lighthouse in fog');
await g.evaluate(() => document.querySelector('form.gen__controls button[type="submit"]').click());
const matched = await g.waitForFunction(() => {
  const i = document.querySelector('.gen__stage img');
  return i && i.src.includes('token=TEST-KEY-123');
}, { timeout: 90000 }).then(() => true).catch(() => false);
const mask = await p.evaluate(() => {
  const k = document.querySelector('input[aria-label="API key"]');
  return k ? { type: k.type, value: k.value } : null;
});
await p.evaluate(() => [...document.querySelectorAll('.adm__tab')].find((b) => b.textContent === 'Models')?.click());
await p.waitForTimeout(700);
await p.screenshot({ path: '.shots/feature/models-key-form.png' });
console.log('B. turbo request carried the key:', matched, '| url snippet:', reqUrl.split('?')[1]?.includes('token=TEST-KEY-123'));
console.log('C. key masked in the admin list:', JSON.stringify(mask));
console.log('pageerrors:', errs.length, JSON.stringify(errs.slice(0, 4)));
await browser.close();
