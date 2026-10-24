# DeepArt — pictures out of noise

A browser-native AI image sampler. Type a prompt, watch the render resolve out of grain
in steps, and hang the result on your wall. No login, no backend: everything a visitor
needs is this machine's `localStorage` (`deepart:v1`) and the keyless Pollinations.ai
image endpoint. Two public pages: the gallery (`/`) and the sampler (`/generate`),
plus a 404 that never converged. A private content-ops instrument exists on an
unlisted route; its address is not published in this repository.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npx next start -p 4400
```

## One deployment step: warm the seed cache

Pollinations' anonymous tier serves **cached URLs** freely but throttles fresh
generations to roughly one every 45 s. So on first deploy (and whenever you change
seed images in `src/data/site.ts`) warm the cache once:

```bash
node scripts/warm-seeds.mjs
```

It re-requests every seeded image (hero + wall + ad) with polite pacing and retries.
After that, first visits resolve in milliseconds instead of hitting the limiter.
Helpers of the same family: `scripts/lcp-probe.mjs` (LCP candidate trail), `scripts/shimmer-probe.mjs`.

## What runs where

| Piece | Where | Note |
| --- | --- | --- |
| Content/config | `src/data/site.ts` | Copy, seeds, default models, the Pollinations placeholder host |
| Store | `src/lib/store.ts` | localStorage `deepart:v1`, schema-validated, `parsePersisted` for upgrades |
| Motion | `src/engine/` + `src/motion/` | Loader, transitions, the resolve driver (the concept's one motion system) |
| Generate page | `src/components/Generate.tsx` | Endpoint templates with `{prompt} {width} {height} {seed} {model}`, plus the OpenAI-compatible JSON POST branch |
| QA shots | `.shots/` (gitignored) | `shoot.mjs` / `audit.mjs` output — see `docs/superpowers` for the loop |

## Placeholders & assumptions

- `site.url` in `src/data/site.ts` defaults to the deployed hosts
  (`https://deepart-one.vercel.app`) and points canonical, OG, sitemap and robots at it.
  Set `NEXT_PUBLIC_SITE_URL` to move the whole SEO surface to a custom domain without
  code edits. (An older local-host fallback quietly shipped canonical links to
  `127.0.0.1`, which un-indexes a site; QA asserts the production hosts instead.)
- Renders arrive with a small pollinations.ai watermark bottom-right (free tier; acceptable).
- The seeded `Turbo` model ships **disabled**: the anonymous tier is Flux-only now. With a
  paid key, paste it into the model's **API key** field in the admin's Models tab; the
  built-in Turbo template carries `token={key}`. Keys live in localStorage only.
- Models have two kinds (admin → Models → Kind). **URL template (GET)** renders the built
  URL straight into the stage image. **OpenAI images (JSON POST)** calls any
  OpenAI-compatible `/images/generations` endpoint through the site's own same-origin
  relay `src/app/api/gen/route.ts`: the browser posts `{ endpoint, apiKey, model, prompt,
  size }` to `/api/gen`, the handler adds the Bearer header server-side and relays the
  provider's JSON and status. This keeps the browser on the same origin for every
  provider (no CSP `connect-src` edits, no per-provider CORS issues), and provider errors
  (401 invalid key, 429 rate limits…) surface verbatim in the sampler. Answers in
  `b64_json` are canvas-downscaled to a locally stored JPEG; answers that arrive as hosted
  URLs are piped same-origin through `/api/img` so the strict `img-src` allowlist holds.
  SDK-style base URLs work: `https://kenari.id/v1` gets the `/images/generations` tail
  appended for you. Provider-side hiccups that answer HTTP 200 with an `error` object in
  the body (kenari does this on long renders) surface as the model's own error message too.
  The relay is stateless, guards against private/loopback targets (https only, no path
  pattern — compat name their image paths too differently), and never logs. A
  `gpt-image-1` built-in ships off; paste an OpenAI key to switch it on.
- Ads are inert by default (an admin pastes a URL or an inline snippet in the Ads tab).

## Discoverability (Google + AI answer engines)

- `src/app/layout.tsx` carries the metadata surface: title template, description,
  keywords, canonical resolved against `site.url`, Open Graph + Twitter card over
  `public/og.png`, and a `WebSite` + `WebApplication` JSON-LD graph (free,
  browser-native, feature list).
- `src/app/page.tsx` ships a visible FAQ whose text and `FAQPage` JSON-LD are generated
  from one array, so the schema and the on-page copy cannot drift.
- `src/app/robots.ts` allows a full crawl and names the AI answer engines explicitly
  (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Perplexity-User,
  Google-Extended, Applebot-Extended, Bytespider, CCBot) plus host + sitemap directives.
- `src/app/sitemap.ts` lists `/` and `/generate` with a real `lastModified`.
- `public/llms.txt` is a plain-language brief for LLM answer engines (the emerging
  llms.txt convention, served as raw text).
- After a deploy lands, submit `https://…/sitemap.xml` once in Google Search Console and
  Bing Webmaster; robots.txt and the sitemap carry the rest. Answer engines pick sites
  up on their own crawl cycle, usually later than Google.
