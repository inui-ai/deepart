// models-key: admin model form shows key/endpoint/model-id; a stored key flows into the
// render request URL (token=...) and respects the CSP (no console errors). Section D runs
// the OpenAI-compatible kind against the /api/gen relay (mocked network layer), section E
// hits the real local relay (referencing api.openai.com with an invalid key for a 401).
import { chromium } from 'playwright';
import zlib from 'node:zlib';

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
await p.screenshot({ path: '.shots/feature/models-key-form.png' });

// D. openai kind: POST JSON + Authorization Bearer; a b64_json answer is canvas-downscaled
// to a jpeg data URL (localStorage quota safety) and the run completes through onImgLoad.
let CT;
function crc32(buf) {
  if (!CT) {
    CT = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CT[n] = c >>> 0; }
  }
  let c = 0xffffffff;
  for (const b of buf) c = CT[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function eightByEight() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(8, 0); ihdr.writeUInt32BE(8, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit truecolor RGB
  const row = Buffer.alloc(1 + 3 * 8);
  row[0] = 0; // filter none
  for (let x = 0; x < 8; x++) { row[1 + x * 3] = 60; row[2 + x * 3] = 210; row[3 + x * 3] = 20; }
  const raw = Buffer.concat(Array.from({ length: 8 }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]).toString('base64');
}
const PNG_8x8 = eightByEight();

const o = await browser.newPage({ viewport: { width: 1445, height: 912 } });
o.on('pageerror', (e) => errs.push('openai:' + String(e).slice(0, 100)));
const conErrs = [];
o.on('console', (m) => { if (m.type() === 'error') conErrs.push(String(m.text()).slice(0, 90)); });
const post = { path: null, endpoint: null, key: null, model: null, size: null, prompt: null };
await o.route('**/api/gen', async (route) => {
  const req = route.request();
  if (req.method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'authorization, content-type' } });
    return;
  }
  post.path = new URL(req.url()).pathname;
  const body = req.postDataJSON();
  post.endpoint = body.endpoint;
  post.key = body.apiKey;
  post.model = body.model;
  post.size = body.size;
  post.prompt = typeof body.prompt === 'string' && body.prompt.length > 3;
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [{ b64_json: PNG_8x8 }] }),
  });
});
await o.goto('http://127.0.0.1:4400/generate', { waitUntil: 'load' });
await o.waitForTimeout(3500);
await o.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('deepart:v1'));
  const gi = s.models.find((m) => m.slug === 'gpt-image-1');
  gi.kind = 'openai'; gi.apiKey = 'TEST-KEY-123'; gi.enabled = true;
  s.models.forEach((m) => { if (m.slug !== 'gpt-image-1') m.enabled = false; });
  localStorage.setItem('deepart:v1', JSON.stringify(s));
});
await o.reload({ waitUntil: 'load' });
await o.waitForTimeout(3500);
await o.fill('textarea', 'a fog lighthouse');
await o.evaluate(() => document.querySelector('form.gen__controls button[type="submit"]').click());
const oDone = await o.waitForFunction(() => {
  const i = document.querySelector('.gen__stage img');
  return i && i.src.startsWith('data:image/jpeg');
}, { timeout: 60000 }).then(() => true).catch(() => false);
const oSpec = await o.evaluate(() => document.querySelector('.plate__spec.gen__readout')?.textContent ?? '');
const oLen = await o.evaluate(() => document.querySelector('.gen__stage img')?.src.length ?? 0);
console.log('D. relay request path:', post.path);
console.log('D. relay body (endpoint/key/model/size/prompt):', JSON.stringify({ endpoint: post.endpoint, key: post.key, model: post.model, size: post.size, prompt: post.prompt }));
console.log('D. b64 -> jpeg data URL done:', oDone, '| data url len:', oLen, '| spec:', oSpec.slice(0, 36));
console.log('D. console errors (CSP etc):', conErrs.length, JSON.stringify(conErrs.slice(0, 4)));
await o.screenshot({ path: '.shots/feature/models-openai.png' });

// E. the real relay: same-origin handler calls the provider server-side; an invalid key
// must surface the provider's OWN status and message (401 with OpenAI's error text).
const er = await fetch('http://127.0.0.1:4400/api/gen', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ endpoint: 'https://api.openai.com/v1/images/generations', apiKey: 'sk-invalid-local-probe', model: 'gpt-image-1', prompt: 'a probe lighthouse', size: '1024x1024' }),
});
const ej = await er.json().catch(() => ({}));
const eMsg = typeof ej?.error?.message === 'string' ? ej.error.message.slice(0, 80) : '';
console.log('E. live relay status:', er.status, '| message:', eMsg);
const eb = await fetch('http://127.0.0.1:4400/api/gen', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ endpoint: 'http://127.0.0.1:9/v1/images/generations', model: 'm', prompt: 'x', size: '1024x1024' }),
});
console.log('E. ssrf guard on loopback endpoint:', eb.status, eb.status === 400 ? '(blocked)' : '(NOT BLOCKED)');

console.log('pageerrors:', errs.length, JSON.stringify(errs.slice(0, 4)));
await browser.close();
