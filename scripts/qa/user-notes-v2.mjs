// Verifies the user's four notes after rebuild:
// 1) navbar is NOT fixed (scrolls away), 2) reruns no longer duplicate history strips,
// 3) "Browse the wall" gone, 4) the corner Generate pill gone; plus menu regression.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch();
const out = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 1380, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));

  // 3 + 4: removals on home
  await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p.waitForTimeout(2800);
  out.removals = await p.evaluate(() => ({
    heroSecondary: document.querySelectorAll('.hero__secondary').length,
    heroCtaLinks: document.querySelectorAll('.hero__cta a').length,
    frameCta: document.querySelectorAll('.frame__cta').length,
    cornerRight: [...document.querySelectorAll('.frame__br > *')].map((el) => el.className),
  }));

  // 1: navbar scrolls away with the page
  out.navbar = await p.evaluate(() => {
    const f = document.querySelector('.frame');
    const at = { pos: getComputedStyle(f).position, top: Math.round(f.getBoundingClientRect().top) };
    return { at };
  });
  await p.evaluate(() => scrollTo(0, 800));
  await p.waitForTimeout(800);
  out.navbarScrolled = await p.evaluate(() => {
    const f = document.querySelector('.frame');
    const r = f.getBoundingClientRect();
    return { pos: getComputedStyle(f).position, top: Math.round(r.top), brandOffscreen: r.bottom <= 0 };
  });
  await p.screenshot({ path: '.shots/feature/navbar-scrolls.png' });

  // 2: dedupe — seed a polluted store, reload, then rerun the dancer strip twice
  await p.goto('http://127.0.0.1:4400/generate', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  await p.evaluate(() => {
    const base = JSON.parse(localStorage.getItem('deepart:v1'));
    const dancer = {
      id: 'h-dancer', prompt: 'a tall dancer in a lime archway, portrait, fine grain',
      modelId: 'flux', modelName: 'Flux', width: 896, height: 1120, seed: 777111,
      url: 'https://image.pollinations.ai/prompt/a%20tall%20dancer%20in%20a%20lime%20archway%2C%20portrait%2C%20fine%20grain?width=896&height=1120&seed=777111&model=flux',
      at: Date.now(),
    };
    base.history = [dancer, { ...dancer, id: 'x2', at: 2 }, { ...dancer, id: 'x3', at: 3 }]; // polluted: 3 copies
    localStorage.setItem('deepart:v1', JSON.stringify(base));
  });
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(3200);
  out.healOnLoad = await p.evaluate(() => {
    const { history } = JSON.parse(localStorage.getItem('deepart:v1'));
    return { count: history.length, urls: [...new Set(history.map((h) => h.url))].length };
  });
  for (const rerun of [1, 2]) {
    await p.evaluate(() => {
      [...document.querySelectorAll('button')].find((b) => /tall dancer/i.test(b.textContent || ''))?.click();
    });
    await p.waitForFunction(() => document.querySelector('.gen__stage')?.className.includes('--done'), null, { timeout: 30000 });
    await p.waitForTimeout(600);
  }
  out.afterReruns = await p.evaluate(() => {
    const { history } = JSON.parse(localStorage.getItem('deepart:v1'));
    const dancer = 'seed=777111';
    return { count: history.length, dancerCount: history.filter((h) => h.url.includes(dancer)).length };
  });

  // 5: menu overlay regression (brand-only top bar on phones; desktop still has nav)
  await p.evaluate(() => scrollTo(0, 0));
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await phone.newPage();
  await p2.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p2.waitForTimeout(3200);
  await p2.evaluate(() => scrollTo(0, 0));
  await p2.evaluate(() => {
    [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Menu')?.click();
  });
  await p2.waitForTimeout(700);
  out.menu = await p2.evaluate(() => {
    const m = document.getElementById('menu');
    const links = [...m.querySelectorAll('a')].map((a) => a.textContent.trim());
    return { open: !m.hidden, links };
  });
  await p2.screenshot({ path: '.shots/feature/menu-after-removals.png' });

  out.pageErrors = errors;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
} catch (e) {
  console.error('FATAL', e);
  console.log(JSON.stringify(out));
  await browser.close();
  process.exit(1);
}
