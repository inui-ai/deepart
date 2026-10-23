// reduce-check: emulate prefers-reduced-motion and see if reveals ever show content.
import { chromium } from 'playwright';

const browser = await chromium.launch();
for (const rm of ['no-preference', 'reduce']) {
  const p = await browser.newPage({ viewport: { width: 1445, height: 912 }, reducedMotion: rm });
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 100)));
  await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p.waitForTimeout(2600);
  // scroll straight to the ladder like a user
  await p.evaluate(() => document.querySelector('.ladder').scrollIntoView({ block: 'start', behavior: 'instant' }));
  await p.waitForTimeout(1400);
  const m = await p.evaluate(() => {
    const probe = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return 'missing';
      const cs = getComputedStyle(el);
      return `op=${cs.opacity} vis=${cs.visibility} html.motion=${document.documentElement.classList.contains('motion')}`;
    };
    return {
      runH2: probe('.run__col h2'),
      ladderH3_1: probe('.ladder__text h3'),
      runH2Text: document.querySelector('.run__col h2')?.textContent.slice(0, 30),
      cssMotion: [...document.styleSheets[0].cssRules].length,
    };
  });
  console.log(`reducedMotion=${rm}`, JSON.stringify({ ...m, errors }, null, 1));
  await p.close();
}
await browser.close();
