// Strip drag probe: does a mouse drag move the strip after the arrow buttons'
// smooth scrollBy settled? Long settle -> drag -> read scrollLeft during + after.
// Also reports computed scroll-behavior (a lingering smooth animation is the suspect).
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const p = await (await browser.newContext({ viewport: { width: 1380, height: 900 } })).newPage();
  await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p.waitForTimeout(3000);
  await p.evaluate(() => document.getElementById('wall')?.scrollIntoView({ behavior: 'instant' }));
  await p.waitForTimeout(2200);

  const behavior = await p.evaluate(() => getComputedStyle(document.querySelector('.wall__strip')).scrollBehavior);

  // two arrow steps with a generous settle
  for (let i = 0; i < 2; i++) {
    await p.click('[aria-label="Next plates"]');
    await p.waitForTimeout(1500);
  }
  const sl0 = await p.evaluate(() => Math.round(document.querySelector('.wall__strip').scrollLeft));

  // instrument: log scrollLeft at every pointermove (native, capture)
  await p.evaluate(() => {
    const s = document.querySelector('.wall__strip');
    window.__moves = [];
    s.addEventListener('pointermove', () => {
      if (window.__moves.length < 24) window.__moves.push(Math.round(s.scrollLeft));
    }, true);
  });

  const box = await p.locator('.wall__strip').boundingBox();
  await p.mouse.move(box.x + 700, box.y + 200);
  await p.mouse.down();
  await p.mouse.move(box.x + 540, box.y + 200, { steps: 10 });
  const slDuring = await p.evaluate(() => Math.round(document.querySelector('.wall__strip').scrollLeft));
  await p.mouse.up();
  await p.waitForTimeout(900);
  const after = await p.evaluate(() => ({
    sl: Math.round(document.querySelector('.wall__strip').scrollLeft),
    snap: document.querySelector('.wall__strip').style.scrollSnapType,
    moves: window.__moves,
  }));

  console.log(JSON.stringify({ behavior, sl0, slDuring, ...after }, null, 1));
  await browser.close();
} catch (e) {
  console.error('FATAL', e);
  await browser.close();
  process.exit(1);
}
