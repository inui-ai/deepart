// deep-narrow: structure-level diagnosis of .hero__row on the phone.
import { chromium } from 'playwright';

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
await p.waitForTimeout(3000);

const out = await p.evaluate(() => {
  const row = document.querySelector('.hero__row');
  const hero = document.querySelector('.hero');
  const cs = row ? getComputedStyle(row) : null;
  const csHero = getComputedStyle(hero);
  const kids = [...(row?.children ?? [])].map((el) => {
    const b = el.getBoundingClientRect();
    return { cls: el.className, x: Math.round(b.x), w: Math.round(b.width), colStart: getComputedStyle(el).gridColumnStart, colEnd: getComputedStyle(el).gridColumnEnd };
  });
  return {
    heroCols: csHero.gridTemplateColumns,
    heroDisplay: csHero.display,
    rowW: row ? Math.round(row.getBoundingClientRect().width) : null,
    rowPad: cs?.paddingLeft + ' / ' + cs?.paddingRight,
    rowTemplate: cs?.gridTemplateColumns,
    rowTemplateRaw: cs?.gridTemplate,
    kids,
    subContains: row?.querySelector('.hero__sub') ? 'in row' : 'MISSING',
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
