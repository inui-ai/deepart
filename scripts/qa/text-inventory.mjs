// text-inventory: hunt genuinely empty/missing visible copy across pages + widths.
import { chromium } from 'playwright';

const browser = await chromium.launch();

const INVENTORY = {
  '/': ['.hero__eyebrow', '.hero__meta', '.hero__title', '.hero__sub', '.hero__steps', '.run__col h2', '.run__col h3', '.ladder__text h3', '.ladder__outcome', '.pipe__intro h2', '.pipe__name', '.pipe__line', '.pipe__num', '.truths__head .truths__item', '.wall__kick', '.wall__head h2', '.wall__spec span', '.wall__counter', '.cta__inner h2', 'footer a', 'footer .foot__brand'],
  '/generate': ['.stage__head h1', '.prompt textarea, .prompt input, .prompt', '.gen__spec', '.readout', '.gen__status'],
  '/subhan': ['.admin h1, .admin__head h1', '.admin form label', '.admin table, .admin__panel'],
  '/404': ['h1', 'p'],
};

const waitFor = { '/': 2600, '/generate': 1500, '/subhan': 1500, '/404': 900 };

const results = {};
for (const w of [[1445, 912], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w[0], height: w[1] } });
  const p = await ctx.newPage();
  for (const path of ['/', '/generate', '/subhan', '/404']) {
    await p.goto('http://127.0.0.1:4400' + path, { waitUntil: 'load' }).catch(() => {});
    await p.waitForTimeout(waitFor[path]);
    const report = await p.evaluate((sels) => {
      const body = document.body;
      const texts = [];
      // walk ALL visible text-bearing leaf nodes; flag suspicious empties on copy blocks
      for (const sel of sels) {
        for (const el of document.querySelectorAll(sel)) {
          const cs = getComputedStyle(el);
          const hidden = cs.opacity === '0' || cs.visibility === 'hidden' || cs.display === 'none';
          const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
          texts.push({ sel, hidden, txt: txt.slice(0, 30), empty: txt.length === 0 });
        }
      }
      return { title: document.title, present: texts.filter(Boolean), missing: texts.filter((t) => !t) };
    }, INVENTORY[path]);
    results[`${w[0]}${path}`] = {
      empty: report.present.filter((t) => t.empty).map((t) => t.sel),
      hidden: report.present.filter((t) => t.hidden).map((t) => `${t.sel}:${t.txt}`),
      missing: report.present.length, // count
    };
  }
  await ctx.close();
}
console.log(JSON.stringify(results, null, 1));
await browser.close();
