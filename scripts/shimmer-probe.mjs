// One-shot: is the at-rest shimmer alive on the hero plate?
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
await page.waitForTimeout(6000); // loader + exit + shimmer delay (2s) into the 6s cycle
const out = await page.evaluate(() => {
  const plate = document.querySelector('.hero__plate');
  const noise = plate?.querySelector('.plate__noise');
  if (!plate || !noise) return 'no plate/noise';
  const cs = getComputedStyle(noise);
  return `resolved=${plate.getAttribute('data-resolved')} anim=${cs.animationName} dur=${cs.animationDuration} state=${cs.animationPlayState} opNow=${cs.opacity}`;
});
console.log(out);
await browser.close();
