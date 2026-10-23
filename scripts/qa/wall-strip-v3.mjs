// Wall strip v3: arrows step frames, counter/progress follow, drag suppresses clicks,
// lightbox still opens from the strip, phone scrolls natively.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch();
const out = {};
try {
  // Desktop viewport is tall on purpose: the deck must fit in view so Playwright's
  // click never auto-scrolls (native scroll desyncs the page's smooth-scroll engine
  // and then every drag coordinate lands on the wrong element).
  const ctx = await browser.newContext({ viewport: { width: 1380, height: 1500 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 100)));

  await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p.waitForTimeout(3200);
  await p.evaluate(() => document.getElementById('wall')?.scrollIntoView({ behavior: 'instant' }));
  await p.waitForTimeout(2600);

  out.initial = await p.evaluate(() => {
    const strip = document.querySelector('.wall__strip');
    const frames = [...document.querySelectorAll('.wall__frame')];
    return {
      frames: frames.length,
      scrollable: strip.scrollWidth > strip.clientWidth + 2,
      counter: document.querySelector('.wall__count b')?.textContent,
      nextDisabled: document.querySelector('[aria-label="Next plates"]')?.disabled,
      mediaHeights: [...new Set(frames.map((f) => Math.round(f.querySelector('.plate__media').getBoundingClientRect().height)))],
      step: document.querySelector('.hero__steps')?.textContent?.trim(),
      titleSize: getComputedStyle(document.querySelector('.hero__title')).fontSize,
    };
  });

  // arrows: two clicks → counter 03, progress moved, prev enabled
  for (let i = 0; i < 2; i++) {
    await p.click('[aria-label="Next plates"]');
    await p.waitForTimeout(900);
  }
  out.afterNexts = await p.evaluate(() => ({
    counter: document.querySelector('.wall__count b')?.textContent,
    scrollLeft: Math.round(document.querySelector('.wall__strip').scrollLeft),
    prevDisabled: document.querySelector('[aria-label="Previous plates"]')?.disabled,
    progressScale: document.querySelector('.wall__progress span')?.style.transform,
  }));
  const stripShot = await p.screenshot();
  writeFileSync(new URL('../../.shots/feature/wall-strip.png', import.meta.url), stripShot);

  // drag 200px → strip must move; a real drag suppresses the click (no lightbox)
  const stripBox = await p.locator('.wall__strip').boundingBox();
  await p.mouse.move(stripBox.x + 700, stripBox.y + 200);
  await p.mouse.down();
  await p.mouse.move(stripBox.x + 500, stripBox.y + 200, { steps: 10 });
  await p.mouse.up();
  await p.waitForTimeout(400);
  out.afterDrag = await p.evaluate(() => ({
    lightboxOpen: !!document.querySelector('.lightbox'),
    scrollLeft: Math.round(document.querySelector('.wall__strip').scrollLeft),
    snap: document.querySelector('.wall__strip').style.scrollSnapType,
  }));
  out.afterDrag.moved = out.afterDrag.scrollLeft > out.afterNexts.scrollLeft + 100;

  // plain click on the frame in view → lightbox opens, Escape closes
  await p.locator('.wall__frame .plate__open').nth(2).click({ position: { x: 120, y: 140 }, force: true });
  await p.waitForTimeout(420);
  out.lightbox = await p.evaluate(() => ({ open: !!document.querySelector('.lightbox'), focused: document.activeElement?.className }));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  out.lightboxClosed = await p.evaluate(() => !document.querySelector('.lightbox'));

  // keyboard on the strip
  await p.focus('.wall__strip');
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(800);
  out.keyboardStep = await p.evaluate(() => ({
    counter: document.querySelector('.wall__count b')?.textContent,
  }));

  // full-loaded strip screenshot
  await p.evaluate(() => {
    const s = document.querySelector('.wall__strip');
    s.scrollLeft = s.scrollWidth;
  });
  await p.waitForTimeout(3500);
  await p.evaluate(() => {
    document.getElementById('wall')?.scrollIntoView({ behavior: 'instant' });
  });
  const endShot = await p.screenshot();
  writeFileSync(new URL('../../.shots/feature/wall-strip-end.png', import.meta.url), endShot);

  // phone: strip is native scroll; counter present
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await phone.newPage();
  await p2.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p2.waitForTimeout(3200);
  await p2.evaluate(() => document.getElementById('wall')?.scrollIntoView({ behavior: 'instant' }));
  await p2.waitForTimeout(2200);
  const phoneShot = await p2.screenshot();
  writeFileSync(new URL('../../.shots/feature/wall-strip-phone.png', import.meta.url), phoneShot);
  out.phone = await p2.evaluate(() => {
    const strip = document.querySelector('.wall__strip');
    return {
      scrollable: strip.scrollWidth > strip.clientWidth + 2,
      frameW: Math.round(document.querySelector('.wall__frame .plate__media').getBoundingClientRect().width),
      overflowPageX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      counter: document.querySelector('.wall__count b')?.textContent,
    };
  });

  out.pageErrors = errors;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
} catch (e) {
  console.error('FATAL', e);
  console.log(JSON.stringify(out));
  await browser.close();
  process.exit(1);
}
