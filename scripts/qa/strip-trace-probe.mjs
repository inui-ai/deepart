// Where do pointer events go after two arrow clicks? Log the event target chain at
// document capture level during a drag, plus what sits at the drag point.
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const p = await (await browser.newContext({ viewport: { width: 1380, height: 900 } })).newPage();
  await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p.waitForTimeout(3000);
  await p.evaluate(() => document.getElementById('wall')?.scrollIntoView({ behavior: 'instant' }));
  await p.waitForTimeout(2200);

  for (let i = 0; i < 2; i++) {
    await p.click('[aria-label="Next plates"]');
    await p.waitForTimeout(1200);
  }

  const probe = await p.evaluate(() => {
    const at = (x, y) => {
      const el = document.elementFromPoint(x, y);
      return el ? (el.className.baseVal ?? el.className ?? el.tagName) + '<' + el.tagName : 'none';
    };
    return { at700: at(700, 694), atArrow: at(60, 55) };
  });

  await p.evaluate(() => {
    window.__trace = [];
    const log = (tag) => (e) => {
      if (window.__trace.length < 30) {
        const chain = [];
        let n = e.target;
        for (let i = 0; n && i < 4; i++, n = n.parentElement) chain.push((n.className && n.className.baseVal !== undefined ? n.className.baseVal : n.className) || n.tagName);
        window.__trace.push([tag, e.clientX | 0, e.clientY | 0, chain.join('|')]);
      }
    };
    for (const t of ['pointerdown', 'pointermove', 'pointerup']) document.addEventListener(t, log(t.charAt(0) + t.slice(2, 4)), true);
  });

  const box = await p.locator('.wall__strip').boundingBox();
  await p.mouse.move(box.x + 700, box.y + 200);
  await p.mouse.down();
  await p.mouse.move(box.x + 540, box.y + 200, { steps: 6 });
  await p.mouse.up();
  await p.waitForTimeout(400);
  const trace = await p.evaluate(() => ({ trace: window.__trace, sl: Math.round(document.querySelector('.wall__strip').scrollLeft) }));

  console.log(JSON.stringify({ probe, ...trace }, null, 1));
  await browser.close();
} catch (e) {
  console.error('FATAL', e);
  await browser.close();
  process.exit(1);
}
