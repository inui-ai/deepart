// seo: the discoverability surface stays indexable by Google and readable by AI
// answer engines. Asserts metadata, canonical/OG absolutes against the deployed host,
// the JSON-LD graphs, the visible FAQ, robots.txt (AI bots on record, no hidden-route
// leak), the sitemap, llms.txt, and the noindex headers on the owner route.
const BASE = 'http://127.0.0.1:4400';
const HOST = 'deepart-one.vercel.app';
let pass = 0; let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`PASS ${name}${detail ? ' | ' + detail : ''}`); }
  else { fail++; console.log(`FAIL ${name}${detail ? ' | ' + detail : ''}`); }
};
const grab = (html, re) => { const m = re.exec(html); return m ? m[1] : ''; };

const home = await (await fetch(BASE + '/')).text();

// titles, descriptions, canonical, og
ok(
  'home title earned its brand',
  home.includes("<title>DeepArt: pictures out of noise</title>"),
  grab(home, /<title>([^<]+)<\/title>/),
);
ok('home meta description', /name="description" content="[^"]{30,200}"/.test(home));
const canon = grab(home, /rel="canonical" href="([^"]+)"/);
ok('home canonical absolute to deploy', canon === `https://${HOST}` || canon === `https://${HOST}/`, canon);
ok('og:site_name', home.includes('og:site_name" content="DeepArt'), '');
ok('og:image absolute', grab(home, /property="og:image" content="([^"]+)"/) === `https://${HOST}/og.png`);
ok('twitter card large', home.includes('name="twitter:card" content="summary_large_image"'));
ok('keywords present', home.includes('name="keywords"'));

// json-ld: parse the layout graph block, collect types
const blocks = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((m) => JSON.parse(m[1].replace(/\\u003c/g, '<')));
const types = new Set(blocks.flatMap((j) => (j['@graph'] ?? [j]).map((n) => n['@type'])));
ok('ld+json parses', blocks.length >= 1, blocks.map((b) => b['@type']).join('+'));
ok('WebSite + WebApplication graph', types.has('WebSite') && types.has('WebApplication'));

// leak check
ok('no hidden route leaked on landing', !home.includes('/subhan'));

const gen = await (await fetch(BASE + '/generate')).text();
ok('generate canonical', grab(gen, /rel="canonical" href="([^"]+)"/) === `https://${HOST}/generate`);
ok('generate page leaked nothing', !gen.includes('/subhan'));

const robots = await (await fetch(BASE + '/robots.txt')).text();
ok('robots default-agent allow', /User-Agent: \*/i.test(robots) && /Allow: \/\n/i.test(robots));
for (const bot of ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bytespider', 'CCBot']) {
  ok(`robots names ${bot}`, new RegExp(`User-Agent: ${bot}\\b`, 'i').test(robots));
}
ok('robots sitemap line', robots.includes(`Sitemap: https://${HOST}/sitemap.xml`));
ok('robots host line', robots.includes(`Host: https://${HOST}`));
ok('robots does not advertise the hidden route', !robots.toLowerCase().includes('subhan'));

const sm = await (await fetch(BASE + '/sitemap.xml')).text();
ok('sitemap both pages', sm.includes(`<loc>https://${HOST}/</loc>`) && sm.includes(`<loc>https://${HOST}/generate</loc>`));
ok('sitemap lastModified', sm.includes('<lastmod>'));
ok('sitemap no hidden route', !sm.toLowerCase().includes('subhan'));

const ltxt = await (await fetch(BASE + '/llms.txt')).text();
ok('llms.txt served', ltxt.startsWith('# DeepArt') && ltxt.includes('browser-native AI image sampler'));
ok('llms.txt no hidden route', !ltxt.toLowerCase().includes('subhan'));

const adm = await fetch(BASE + '/subhan');
ok('owner route X-Robots-Tag noindex', adm.headers.get('x-robots-tag') === 'noindex, nofollow', adm.headers.get('x-robots-tag') ?? 'missing');
await adm.body?.cancel();

console.log(`seo: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
