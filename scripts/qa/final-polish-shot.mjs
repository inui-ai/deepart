// Visual verification for the final polish: wide-canvas letterbox, header scrim, phone pill.
import { chromium } from 'playwright';

const browser = await chromium.launch();
const shots = [];
try {
  // A) Wide canvas: seed the dancer run into a real page-authored store, then rerun it.
  const desk = await browser.newContext({ viewport: { width: 1380, height: 900 } });
  const p1 = await desk.newPage();
  await p1.goto('http://127.0.0.1:4400/generate', { waitUntil: 'load' });
  await p1.waitForTimeout(2600); // loader finished; hydrate wrote the seed store
  await p1.evaluate(() => {
    const base = JSON.parse(localStorage.getItem('deepart:v1'));
    base.history = [{
      id: 'h-dancer',
      prompt: 'a tall dancer in a lime archway, portrait, fine grain',
      modelId: 'flux', modelName: 'Flux',
      width: 896, height: 1120, seed: 777111,
      url: 'https://image.pollinations.ai/prompt/a%20tall%20dancer%20in%20a%20lime%20archway%2C%20portrait%2C%20fine%20grain?width=896&height=1120&seed=777111&model=flux',
      at: Date.now(),
    }];
    localStorage.setItem('deepart:v1', JSON.stringify(base));
  });
  await p1.reload({ waitUntil: 'load' });
  await p1.waitForTimeout(3400);
  await p1.evaluate(() => {
    [...document.querySelectorAll('button')].find((b) => /tall dancer/i.test(b.textContent || ''))?.click();
  });
  await p1.waitForSelector('.gen__stage--done img', { timeout: 30000 });
  await p1.waitForTimeout(700);
  shots.push(['wide-letterbox', await p1.screenshot({ clip: { x: 0, y: 0, width: 1380, height: 760 } })]);
  const geom = await p1.evaluate(() => {
    const plate = document.querySelector('.gen__stage .plate__media');
    const r = plate.getBoundingClientRect();
    const img = document.querySelector('.gen__stage .plate__media img');
    return { plateRatio: +(r.width / r.height).toFixed(3), objFit: getComputedStyle(img).objectFit, naturalRatio: +(img.naturalWidth / img.naturalHeight).toFixed(3) };
  });

  // B) Scrim: scrolled content under the fixed frame should fade under a paper veil.
  await p1.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p1.waitForTimeout(2600);
  await p1.evaluate(() => scrollTo(0, 900));
  await p1.waitForTimeout(700);
  shots.push(['scrim-scrolled', await p1.screenshot({ clip: { x: 0, y: 0, width: 1380, height: 500 } })]);

  // C) Phone: the fixed corner CTA must not ride over copy.
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await phone.newPage();
  await p2.goto('http://127.0.0.1:4400/', { waitUntil: 'load' });
  await p2.waitForTimeout(3200);
  const pill = await p2.evaluate(() => {
    const cta = document.querySelector('.frame__cta');
    const style = cta ? getComputedStyle(cta).display : 'absent';
    return { ctaDisplay: style };
  });
  await p2.evaluate(() => scrollTo(0, 700));
  await p2.waitForTimeout(600);
  shots.push(['phone-mid', await p2.screenshot()]);

  console.log(JSON.stringify({ geom, pill, saved: shots.map(([n]) => n) }));
  for (const [name, buf] of shots) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(new URL(`../../.shots/feature/${name}.png`, import.meta.url), buf);
  }
  await browser.close();
} catch (e) {
  console.error('FATAL', e);
  await browser.close();
  process.exit(1);
}
