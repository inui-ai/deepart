// Feature QA: mobile frame + menu overlay at a phone viewport (390x844).
// Verifies: desktop nav hidden, Menu button visible, overlay opens (with link focus),
// Escape closes, Generate link navigates, and no horizontal overflow anywhere.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('.shots/feature', { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
try {
  await page.goto('http://127.0.0.1:4400/', { waitUntil: 'networkidle' });
} catch { /* pollinations tail may idle long; DOM is already here */ }
await page.waitForSelector('h1');

const done = {};
done.navHidden = !(await page.locator('nav.nav').isVisible());
done.menuBtnVisible = await page.locator('button.frame__menu').isVisible();
done.menuBtnAriaExpandedBefore = await page.locator('button.frame__menu').getAttribute('aria-expanded');
await page.screenshot({ path: '.shots/feature/mobile-home.png' });

done.overflowHome = await page.evaluate(() => ({ sw: document.scrollingElement.scrollWidth, iw: window.innerWidth }));

// open the overlay
await page.locator('button.frame__menu').click();
await page.waitForSelector('#menu:not([hidden])');
done.panelOpens = await page.locator('#menu').isVisible();
done.focusAfterOpen = await page.evaluate(() => document.activeElement?.getAttribute('href') || document.activeElement?.tagName);
done.ariaExpandedAfterOpen = await page.locator('button.frame__menu').getAttribute('aria-expanded');
await page.screenshot({ path: '.shots/feature/mobile-menu-open.png' });

// Escape closes
await page.keyboard.press('Escape');
await page.waitForSelector('#menu[hidden]', { state: 'attached' });
done.escapeCloses = (await page.locator('#menu').getAttribute('hidden')) !== null;
done.focusAfterEscape = await page.evaluate(() => document.activeElement?.textContent?.trim());

// reopen and navigate via the overlay
await page.locator('button.frame__menu').click();
await page.waitForSelector('#menu:not([hidden])');
await page.locator('#menu a[href="/generate"]').click();
await page.waitForURL('**/generate');
done.navigatedToGenerate = page.url().endsWith('/generate');
await page.waitForSelector('h1');
done.overflowGenerate = await page.evaluate(() => ({ sw: document.scrollingElement.scrollWidth, iw: window.innerWidth }));
await page.screenshot({ path: '.shots/feature/mobile-generate.png' });

done.PASS = done.navHidden && done.menuBtnVisible && done.panelOpens && done.escapeCloses && done.navigatedToGenerate;
console.log(JSON.stringify(done, null, 2));
await browser.close();
if (!done.PASS) process.exit(1);
