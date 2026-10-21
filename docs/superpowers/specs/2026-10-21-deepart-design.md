# DeepArt — Design Spec

Date: 2026-10-21 · Status: approved by user (interactive Q&A + "lets go")

## What it is

DeepArt is a clean, SaaS-styled AI image generation site. Three pages, no login,
no database, no server-side state. All site content lives in the visitor's
browser (localStorage). The admin dashboard edits that content; the public pages
render it.

User decisions (locked):
1. Full **awwwards** build flow (Next.js + GSAP/Lenis, browser QA loop).
2. Generation engine: **Pollinations.ai** — free, keyless, works from the
   browser via URL. Admin-added models become endpoint templates.
3. Gallery management: **URL paste + prompt picker** (seeded defaults, admin can
   paste image URLs or generate fresh ones inline).

## Stack

- Next.js (App Router), TypeScript. Dev server for local use; production build
  for QA/export.
- Motion: GSAP + Lenis via the awwwards motion engine (one clock, reversible,
  reduced-motion aware). No WebGL — a "clean SaaS" brief doesn't earn it.
- Stack note: if running inside an existing project, use its stack; here it's
  greenfield → Next.js default.

## Brand & design language

- Name: **DeepArt**. Tone: confident, quiet, product-like (not "AI hype").
- Palette: white base, black/near-black text, single lime accent (hue pinned
  during art direction, ~#C6FF40 family). Lime appears only where value is:
  primary buttons, active states, focus rings, selection, the signature moment.
- Type: curated free pairing — sharp grotesk display + neutral sans UI
  (exact choice in art direction; no Inter/Roboto/system defaults).
- Layout: 12-col grid, generous whitespace, hairline borders, flat surfaces.
  No gradients, no glass, no purple.
- Every frame must work as a still poster with motion off.

## Pages

### `/` Home
1. **Hero** — eyebrow, big headline, one-line sub, primary CTA → `/generate`,
   secondary CTA → gallery anchor. Hero visual: fixed-seed Pollinations render
   (stable across loads). Ad strip may sit below hero (see Ads).
2. **Gallery** — responsive masonry grid fed from the store. Item: image,
   title, tag pill, hover treatment (title + tag lift, image scales slightly).
   Click opens the image large in a lightbox.
3. **Footer** — brand mark, nav links, discreet Admin link, small print
   ("generated with AI", year).

### `/generate`
- Prompt textarea, model picker (active models from store), size presets
  (1:1, 4:5, 16:9 — fixed constants), optional seed field.
- Generate → image loads in result panel; staged reveal (blur-to-focus tile) is
  the site's signature moment. Failure → inline error + "retry with new seed".
- History strip: last ~12 generations, metadata only (prompt, model, size,
  seed, endpoint) — the endpoint URL is deterministic given seed, so nothing
  heavy is stored. Click a history chip to reload that result.
- Actions on result: **Download** (fetch blob), **Add to gallery** (writes into
  store → visible on Home immediately). Adds usage counter.

### `/admin` (no login; open route, not promoted in main nav)
Tabs:
- **Overview** — counts (images, models, ads), localStorage usage estimate,
  Export JSON / Import JSON, Reset to defaults.
- **Gallery** — list with reorder (drag or arrows), edit title/tag inline,
  delete; add via URL paste **or** prompt picker (generates via a selected
  model and offers "use this").
- **Models** — table: name, endpoint template, enabled toggle. Placeholders
  supported: `{prompt}` `{width}` `{height}` `{seed}` `{model}`. Pre-seeded:
  Flux ("flux"), Turbo ("turbo") via Pollinations. "Add model" opens a form;
  quick-add chips for known Pollinations models. Built-in models are deletable
  but restore via Reset.
- **Ads** — list + form: image (URL or generate), headline, link, placement
  (`home-strip` between hero and gallery | `generate-sidebar` right-rail card),
  active toggle. Rendered slots are labeled "Ad"; inactive/empty slots collapse.

## Data model — `lib/store.ts` (only unit that touches localStorage)

Key `deepart:v1`, single JSON object, schema-versioned with migration stub:

```ts
type Store = {
  version: 1;
  hero: { eyebrow: string; headline: string; sub: string;
          heroImageSeed: number };            // hero image = Pollinations URL
  models: Model[];   // {id, name, endpointTemplate, modelSlug, enabled, builtIn}
  gallery: GalleryItem[]; // {id, title, tag, url, addedAt}  (masonry order = array order)
  ads: Ad[];         // {id, headline, link, imageUrl, placement, active}
  usage: { generations: number };
};
```

- `get(key)` / `set(key)` / `mutate(fn)` pattern; pages read via one hook
  (`useStore`); admin writes via `mutate`. Seed defaults on first read.
- Deterministic image URLs: `url` fields are built from templates + fixed
  seeds, so reloads reproduce the same images without storing blobs.

## Error handling

- localStorage missing/quota → banner + toast, site stays browsable.
- Generation failure (network/endpoint) → inline error, retry with new seed.
- Broken images → skeleton placeholder, never broken-icon flash.
- Admin forms validate (endpoint must contain `{prompt}`); toasted feedback.
- `document.title`/metadata set per page; robots ignore `admin`.

## Motion

Scroll reveals, page transition, hover micro-interactions, and the staged
image reveal on `/generate` as the single signature moment. One clock (GSAP +
Lenis), everything reverted on navigation. Reduced motion: complete calm site.

## QA (awwwards loop)

`next build` → `audit.mjs` crawl (SEO, metadata, a11y, weight, placeholder
copy, AI-copy tells) → `shoot.mjs` screenshots desktop + throttled mobile +
reduced motion + keyboard → blind critic rubric (Design, Usability, Creativity,
Content, developer areas). Iterate fixes until every category ≥ 8/10.
Playwright + axe-core installed into the project on demand.

## Out of scope

Login/auth, real backend/storage, payments, multi-language, real ad networks,
image editing. Content is the user's to finish: seeded copy/images are
clearly-labeled placeholders where no real content exists.
