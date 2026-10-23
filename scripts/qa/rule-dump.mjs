// rule-dump: list every stylesheet rule matching .hero__row / .hero__sub / .hero__cta, with its media text.
import { chromium } from 'playwright';

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
await p.waitForTimeout(1500);

const out = await p.evaluate(() => {
  const find = /hero__(row|sub|cta)|home__strip/;
  const hits = [];
  const walk = (rules, mediaText) => {
    for (const r of rules) {
      if (r.type === 1 && find.test(r.selectorText)) {
        hits.push({ media: mediaText || '(base)', sel: r.selectorText, css: r.style.cssText.slice(0, 160) });
      } else if (r.type === 7 || r.media) {
        try { walk(r.cssRules, mediaText || r.media.mediaText); } catch {}
      }
    }
  };
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules, sheet.media.mediaText && sheet.media.mediaText); } catch (e) { hits.push({ err: String(e).slice(0, 80) }); }
  }
  return { hits: hits.filter((h) => /hero__/.test(h.sel || '')), strip: hits.filter((h) => /strip/.test(h.sel || '')) };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
