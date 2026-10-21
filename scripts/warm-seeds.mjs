// Warms the Pollinations cache for every seeded image so first visits get CDN-speed
// responses (the anonymous tier throttles fresh generations but serves cached URLs freely).
// Run: node scripts/warm-seeds.mjs
import { seedStore, HERO_PROMPT, pollUrl } from '../src/data/site.ts';

const urls = [
  pollUrl(HERO_PROMPT, seedStore.hero.seed, 1000, 1200),
  ...seedStore.gallery.map((g) => g.url),
  ...seedStore.ads.map((a) => a.imageUrl),
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function warm(url, attempt = 1) {
  try {
    const t0 = Date.now();
    const res = await fetch(url);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      return `${Date.now() - t0}ms ${Math.round(buf.byteLength / 1024)}KB`;
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    if (attempt < 5) {
      const back = 20_000 + attempt * 10_000;
      console.log(`  retry ${attempt} in ${back / 1000}s (${e.message})`);
      await sleep(back);
      return warm(url, attempt + 1);
    }
    return `FAILED (${e.message})`;
  }
}

console.log(`warming ${urls.length} seed images...`);
for (const [i, u] of urls.entries()) {
  const out = await warm(u);
  const label = decodeURIComponent(u.split('/prompt/')[1] ?? u).slice(0, 52);
  console.log(`[${i + 1}/${urls.length}] ${out.startsWith('FAILED') ? 'FAIL' : 'OK  '} ${out}  ${label}`);
  await sleep(16_000); // polite pacing under the anonymous limiter
}
console.log('warm done');
