// reveal-live: hunt missing copy — load like a user, scroll slowly, catch invisible text.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1445, height: 912 } });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e).slice(0, 140)));
p.on('console', (c) => { if (c.type() === 'error') errors.push('console: ' + c.text().slice(0, 140)); });
await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
await p.waitForTimeout(3200);

const scan = async (label) => {
  const out = await p.evaluate(() => {
    const sel = '.hero__line--a,.hero__line--b,.hero__cardTitle,.hero__cardBody,.hero__cardMeta,.gal__kicker,.gal__line,.gal__cap b,.footer__colophon';
    const bad = [];
    for (const el of document.querySelectorAll(sel)) {
      const cs = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      const above = b.bottom > 0 && b.top < innerHeight; // in viewport
      const hidden = cs.opacity === '0' || cs.visibility === 'hidden' || (cs.display === 'none' && !el.closest('.truths__track'));
      bad.push({
        cls: el.className.split(' ')[0] || el.tagName,
        text: el.textContent.trim().slice(0, 26),
        hidden,
        inview: above,
        op: cs.opacity,
        vis: cs.visibility,
      });
    }
    return bad;
  });
  const problems = out.filter((o) => o.hidden && o.inview);
  console.log(`--- ${label} --- problemsInView: ${problems.length}`);
  problems.forEach((x) => console.log(JSON.stringify(x)));
  return problems;
};

await scan('top @0');
// slow user-like scroll to the wall, pausing
await p.evaluate(async () => {
  const total = document.body.scrollHeight;
  for (let y = 0; y <= total; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 160)); }
});
await p.waitForTimeout(1500);
await scan('after scroll to bottom');
const shot = await p.screenshot({ fullPage: true });
writeFileSync(new URL('../../.shots/feature/reveal-live.png', import.meta.url), shot);
console.log('errors:', errors);
await browser.close();
