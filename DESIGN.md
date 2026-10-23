# DeepArt — DESIGN.md

Brief + system doc for the build. Consumed by every later pass.

## Phase 0 — Brief

- **Subject:** DeepArt, a browser-native AI image generator (Pollinations.ai under the hood).
- **Audience:** anyone who wants images from a prompt: designers, hobbyists, the curious.
- **The site's job:** let a visitor generate an image in under 10 seconds, browse the gallery,
  and manage content from `/subhan` — the unlisted admin route (models, ads, gallery),
  all without login or a backend.
- **Style brief (user-locked):** clean, white, lime accent, "like SaaS".
- **Constraints:** no login, no database; state in localStorage; images via Pollinations URLs.
- **Language:** English. **Assumptions:** brand name DeepArt (folder name); seeded gallery/
  hero images and copy are marked placeholders the owner replaces.

## Phase 1 — Concept

Three concepts from three territories:

| | A. Material: diffusion ("Resolve") | B. Name: "deep" (strata) | C. Formal system: proof sheet |
|---|---|---|---|
| Idea | The whole site behaves like a diffusion sampler: images and headlines arrive by resolving out of noise, in steps, in view | "Deep" = depth of focus: the site is organized in focus planes; lime marks what is in focus | The site is a proof sheet: every image is a print annotated with its exposure line (model · size · seed); the gallery is a wall of proofs |
| Layout rule | Plates with margin data; sticky sample stage | Sections stack by "depth" | Margin grid: image + spec line |
| Motion verb | resolve: noise → blur → crisp, stepped | drift, focus-pull | write-in annotations |
| Type voice | neo-grotesk + mono data voice | grotesk + serif for depth cues | grotesk + mono annotations |
| Signature | observable denoise on /generate; readout types itself after resolution | hover pulls focus from surface to subject | annotation writes itself on hover |
| Anchor | diffusion models literally render by subtracting noise; DeepArt's product IS this | the name only | honesty about reproducible parameters |
| Scores O/F/Fe/P | 4 / 5 / 5 / 2 = **16** | 3 / 3 / 4 / 3 = 13 | 3 / 4 / 5 / 2 = 14 |

**Pick A, stealing C's margin plate as a structural detail** (every image carries a mono
parameter line — honest, product-real, and the "readout" completes every resolve).

### Concept Card

```
Idea:        DeepArt moves like its models do: images resolve out of noise, step by
             step, while you watch.
Metaphor:    the diffusion sampler (noise in, image out).
Signature:   the observable denoise on /generate - the result materializes through
             noise into blur into focus, then a mono parameter line types itself.
Emotion:     watching something become real.
Motion verb: resolve.
Screenshot:  /generate mid-resolve: left of the line pure noise, right of it the
             finished image, prompt above, spec line typing beneath.
```

The concept survives the footer (spec lines), the 404 (a render that never
converges: pure noise, "seed undefined") and admin (quiet instrument).

## Phase 2 — Art direction system

### Palette (roles; named, not swapped-in)

| Role | Value | Source |
|---|---|---|
| `--ground` | `#FBFBF9` | lab paper: near-white keeps renders neutral |
| `--ink` | `#0D0D0B` | sample black (no pure #000 glare) |
| `--muted` | `#61645C` | spec grey; 6.3:1 on ground, AA at 12px |
| `--line` | `rgba(13,13,11,.14)` | hairlines, plate margins |
| `--accent` | `#C9F73A` | lime = the sample flash: fills, focus rings, active steps; text on it is always ink |
| `--on-accent` | `#0D0D0B` | ink on lime (12.5:1) |
| `--scrim` | `rgba(13,13,11,.6)` | lightbox curtain |

Lime never appears as text on ground (contrast); it appears as chips, fills, rings,
markers. One committed theme (light). One accent, used rarely and semantically.

### Type

- **Switzer** (Fontshare, 400/500/600, `next/font/local`) — display AND text. The workhorse;
  display tracking `-0.03em`, `line-height .9`, optical left margin.
- **Fragment Mono** (Google `next/font`) — the data voice, ONLY for real parameters:
  spec lines, seeds, sizes, admin readouts, the typing readout. Not for nav or labels.
- Scale (tokens): `--t-mega: clamp(4rem, 1.2rem+8.5vw, 10rem)`; `--t-xl: clamp(2.5rem, 1.4+4.8vw, 6rem)`;
  `--t-l: clamp(1.75rem, 1.3+1.9vw, 3rem)`; `--t-m: clamp(1.25rem, 1.1+0.6vw, 1.625rem)`;
  `--t-body: clamp(1rem, .95+.2vw, 1.125rem)`; `--t-s: .875rem`; `--t-xs: .75rem`.
- Tabular numerals for all numbers (seeds, sizes, counts). Real ’ “ ” characters. No widows.

### Grid, rhythm, shape

- 12 columns, `--gutter: clamp(16px, 2vw, 32px)`, outer margin = gutter. Text starts col 1;
  media lives cols 6–12; specs hang on col 9. Subgrid inside plates.
- Vertical rhythm moods: tight `96px`, normal `160px`, airy `240px` — hero normal, gallery
  airy, footer tight-topped.
- Shape rule: **radius only on controls (10px); media is always square** (prints, not chips).
  Shadows: none (hairlines carry layering; the one elevation exception is the sticky navbar).

### Motion language (verb: resolve)

- One clock (GSAP ticker; Lenis). Eases: `power3.out` default (.6s); resolve = discrete
  steps (3 opacity steps of a noise overlay + one blur tween 8→0) ending in a 120ms "flash"
  of lime hairline. Stagger 40–60ms. Big things slower than small ones.
- Images: resolve-in on enter (never plain fade-up). Text: line-mask reveals only at hero and
  section headers; tables/lists get 10–30ms row stagger.
- Hover treatments, one per role: primary button = ink→lime flood (fill wipes left→right,
  text stays ink; a real treatment, not colorOnly); gallery plate = image un-blurs to 0 and
  its spec line writes in; nav = inner-span roll; utility links = color only.
- Idle state: hero plate carries a barely-visible noise shimmer (opacity .05→.22 pulse,
  ~6s loop) so the sampler keeps breathing; pause when off screen. **Decision, not accident.**
- Reduced motion: no Lenis, no scroll tweens, no signature choreography, no shimmer; all
  content fully visible immediately (resolve = simple 150ms opacity).

### Composition plan (different family every section)

```
HOME (reworked per the user's reference deck — the organizer bar + two-voice statement,
the plate, the deck: all DeepArt's own voice, paper + ink + lime):

  top bar, three pieces on one row (scrolls away, not sticky):
  ‹ HOME › crumb left (mono chip, current page) · deepart ꞉꞉ black bar center with
  burger (opens the ink overlay: Generate / Gallery — Admin is unlisted, reachable
  by direct URL only) · Generate ink pill with lime arrow chip right
  menu links hug their text (focus ring marks the word, not a viewport stripe);
  Gallery is /​#gallery: same-page clicks smooth-scroll via Lenis anchors, and a
  cross-page entry lands on the section via jumpToHash() under the enter curtain

  hero (atelier poster):
  centered two-voice headline — store headline lands washed (--c-wash), the ink echo
  "Type, render, keep and repeat." carries the verbs
  wide 21:9 plate (the seeded aerial dawn render: dark green rolling hills,
  a flock of white birds), rounded corners
  glass card parked bottom-left on the plate: deepart + "The open image sampler.",
  body copy (fourteen steps, stays local), Generate exit, mono promise line
  "unlimited · free · no account · no credits"
  mono spec under (flux · 1600×680 · seed)

  gallery (the deck, #gallery):
  centered two-voice head: washed "Plates that already left the noise." / ink
  "Every one began as a typed line." + mono kicker "the gallery · eight seeds pinned"
  alternating 7/5 grid on the 12-col rail, rounded media, one mono spec line per
  plate (01 Harbor at dawn … 08 Black sand), lazy-loaded, static figures

  footer: DeepArt poster wordmark, links, colophon — unchanged

  Phones: crumb hides, bar + Generate hold one row; headline stacks tight; plate
  crops 4:5 with the card full-width inside; gallery goes single column.

  Retired sections (still committed, restorable one revert away): home__strip,
  run panel, ladder, pipeline rows, truths marquee, wall strip, CTA band. Old story
  components live in Landing.tsx / Wall.tsx untouched.

wall (retired with the rework — historical plan; a film leader, not a mosaic):

  | eyebrow · title · index (seeded · local only · scroll sideways)   |
  |[frame 01][frame 02][frame 03][frame 04]→  … full plates, scroll-x |
  |  title/spec under each: num | title · tag · model · seed          |
  | [←] [→]  ───────────▪ progress hairline ──────────   03/8 counter |
  Each frame keeps its NATURAL ratio on a fixed height (clamp 340–620px, aspect from
  the URL width/height), numbered in the margin; scroll-snap x proximity, drag/scrub
  with suspend-on-grab, arrows + keyboard steps, click opens the lightbox.
footer (poster finale):
  giant DeepArt line, link row, small print
GENERATE (sticky narrative):
  left: controls (prompt textarea, model select, size, seed, CTA)
  right: sticky resolve stage + typed readout (the canvas is fixed wide, 16:9; every render
       letterboxes inside it, never outgrowing the area); history strip below (scroll-snap row on phones)
ADMIN (data/facts instrument):
  tab bar + tables, mono headers, quiet motion
404: "did not converge" noise plate, spec line, link home
```

### Genericness test

"Generic model, same prompt" would produce: centered hero + gradient blob, Inter, rounded
grey cards with soft shadows, purple, fade-up everywhere. Changed deliberately:
1. Hero is a **split frame** with the render as the right half,小板 plate + spec line under every image (product honesty as the signature layout element).
2. Lime is a *semantic* sample marker (flash/focus/active), never a decorative wash or gradient.
3. Resolve replaces every plain fade; stepped noise is the reveal grammar.
4. Switzer + Fragment Mono instead of Inter; tabs/controls at 10px radius, media square.
5. No eyebrow-typo pattern above headings; labels are real mono parameters only.
