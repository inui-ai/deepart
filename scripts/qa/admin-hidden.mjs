// admin-hidden: verify admin is unlisted but still reachable.
import { chromium } from 'playwright';

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1445, height: 912 } });
await p.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
await p.waitForTimeout(3600);

const menu = await p.evaluate(() => [...document.querySelectorAll('#menu a')].map((a) => a.textContent));
console.log('menu links:', JSON.stringify(menu));

await p.evaluate(() => document.querySelector('.bar__burger').click());
await p.waitForTimeout(500);
await p.screenshot({ path: '.shots/feature/menu-no-admin.png' });

const footer = await p.evaluate(() => [...document.querySelectorAll('footer .footer__links a')].map((a) => a.textContent));
console.log('footer links:', JSON.stringify(footer));

await p.goto('http://127.0.0.1:4400/admin', { waitUntil: 'load' });
await p.waitForTimeout(2000);
console.log('admin direct access:', p.url(), 'has h1:', await p.evaluate(() => !!document.querySelector('h1')));

const nf = await browser.newPage({ viewport: { width: 1445, height: 912 } });
await nf.goto('http://127.0.0.1:4400/zzz', { waitUntil: 'load' });
await nf.waitForTimeout(2000);
console.log('404 sub:', await nf.evaluate(() => document.querySelector('.lost__sub')?.textContent));
console.log('admin links on 404:', await nf.evaluate(() => document.querySelectorAll('a[href="/admin"]').length));

const sm = await p.goto('http://127.0.0.1:4400/sitemap.xml', { waitUntil: 'load' });
console.log('sitemap:', (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 220));

await browser.close();
