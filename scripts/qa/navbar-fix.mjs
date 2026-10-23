// navbar-fix: menu overlay focus ring + cross-page gallery hash jump.
import { chromium } from 'playwright';

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1445, height: 912 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));

// A. menu overlay: links hug their text, focus ring not full width.
await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
await p.waitForTimeout(3600);
await p.evaluate(() => document.querySelector('.bar__burger').click());
await p.waitForTimeout(700);
const linkBox = await p.evaluate(() => {
  const l = document.querySelector('.menu__link');
  const r = l.getBoundingClientRect();
  return { x: Math.round(r.left), w: Math.round(r.width), vw: innerWidth };
});
console.log('A. menu link box:', JSON.stringify(linkBox), 'hugs text:', linkBox.w < linkBox.vw * 0.5);
await p.screenshot({ path: '.shots/feature/menu-fixed.png' });

// B. same-page Gallery click: Lenis anchors smooth-scrolls to #gallery.
await p.keyboard.press('Escape'); // close
await p.waitForTimeout(400);
const g = await p.evaluate(() => document.querySelector('#gallery').getBoundingClientRect().top + scrollY);
await p.evaluate(() => document.querySelector('.bar__burger').click());
await p.waitForTimeout(600);
await p.evaluate(() => [...document.querySelectorAll('.menu__link')].find((a) => a.textContent === 'Gallery').click());
await p.waitForTimeout(2000); // smooth scroll settles
const afterSame = await p.evaluate(() => ({ y: Math.round(scrollY), menuOpen: !!document.querySelector('.frame[data-open]') }));
console.log('B. same-page jump: target y', Math.round(g), 'landed y', afterSame.y, 'menu closed:', !afterSame.menuOpen, 'ok:', Math.abs(afterSame.y - g) < 60);

// C. cross-page: /generate -> menu -> Gallery must land AT the gallery, not the top.
await p.goto('http://127.0.0.1:4400/generate', { waitUntil: 'load' });
await p.waitForTimeout(3600);
await p.evaluate(() => document.querySelector('.bar__burger').click());
await p.waitForTimeout(600);
await p.evaluate(() => [...document.querySelectorAll('.menu__link')].find((a) => a.textContent === 'Gallery').click());
await p.waitForTimeout(4800); // leave + enter + settle
const c = await p.evaluate(() => ({ y: Math.round(scrollY), url: location.pathname + location.hash }));
const okC = c.url.startsWith('/#gallery') && Math.abs(c.y - g) < 80;
console.log('C. cross-page jump:', JSON.stringify(c), 'target', Math.round(g), 'ok:', okC);
await p.screenshot({ path: '.shots/feature/crosspage-gallery-landing.png' });

// D. Generate link from home menu still navigates.
await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
await p.waitForTimeout(3200);
await p.evaluate(() => document.querySelector('.bar__burger').click());
await p.waitForTimeout(600);
await p.evaluate(() => [...document.querySelectorAll('.menu__link')].find((a) => a.textContent === 'Generate').click());
await p.waitForTimeout(4200);
const dUrl = new URL(p.url()).pathname;
console.log('D. generate nav:', dUrl === '/generate' ? 'ok' : 'FAIL ' + p.url());

console.log('pageerrors:', errs.length);
await browser.close();
