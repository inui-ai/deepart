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
| Generate page | `src/components/Generate.tsx` | Endpoint templates with `{prompt} {width} {height} {seed} {model}` |
| QA shots | `.shots/` (gitignored) | `shoot.mjs` / `audit.mjs` output — see `docs/superpowers` for the loop |

## Placeholders & assumptions

- `site.url` in `src/data/site.ts` is the **ship host placeholder** (`http://127.0.0.1:4400`) —
  points canonical, OG and sitemap. Replace with the real domain on deploy, then re-run the
  warmer if the HTML of seeds changed.
- Renders arrive with a small pollinations.ai watermark bottom-right (free tier; acceptable).
- The seeded `Turbo` model ships **disabled**: the anonymous tier is Flux-only now. With a
  paid key, paste it into the model's **API key** field in the admin's Models tab; the
  built-in Turbo template carries `token={key}`. Keys live in localStorage only.
- Ads are inert by default (an admin pastes a URL or an inline snippet in the Ads tab).
