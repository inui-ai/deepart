// Assumptions (marked everywhere said, mirrored in the final message):
// - The brand name "DeepArt" comes from the project folder; the owner can change it here and in /subhan.
// - The production URL is a placeholder (https://deepart.local); replace when deploying.
// - The seeded gallery and the sample ad are Pollinations renders of fixed prompts + seeds:
//   they demonstrate the design and are meant to be replaced via /subhan.
// - Seeded models are Pollinations' keyless Flux and Turbo endpoints.

const POLL = 'https://image.pollinations.ai/prompt';

export function pollUrl(prompt: string, seed: number, w: number, h: number, model = 'flux') {
  // NOTE: no nologo param. The anonymous Pollinations tier rejects it with 402.
  return `${POLL}/${encodeURIComponent(prompt)}?width=${w}&height=${h}&seed=${seed}&model=${model}`;
}

export const site = {
  name: 'DeepArt',
  action: 'Generate',
  url: 'http://127.0.0.1:4400', // ship placeholder: the QA/ship host, used for canonical, OG and sitemap. Replace on real deploy.
  description:
    'DeepArt is a browser-native image sampler: type a few words, pick a model, watch the render resolve. No login, no account, everything stays on your machine.',
  year: new Date().getFullYear(),
};

// The hero plate: a warm cinematic macro, the reference's close-up mood in DeepArt's voice.
export const HERO_PROMPT = 'cinematic macro close-up of a human eye, warm film light, skin tones, shallow depth of field, fine grain';

export type HeroContent = { eyebrow: string; headline: string; sub: string; seed: number };

export type Model = {
  id: string;
  name: string;
  slug: string;
  endpoint: string; // supports {prompt} {width} {height} {seed} {model}
  enabled: boolean;
  builtIn?: boolean;
};

export type GalleryItem = {
  id: string;
  title: string;
  tag: string;
  url: string;
  addedAt: number;
  w?: number;
  h?: number;
  seed?: number;
};

export type Ad = {
  id: string;
  headline: string;
  link: string;
  imageUrl: string;
  placement: 'home-strip' | 'generate-sidebar';
  active: boolean;
};

export type HistoryItem = {
  id: string;
  prompt: string;
  modelId: string;
  modelName: string;
  width: number;
  height: number;
  seed: number;
  url: string;
  at: number;
};

export type Store = {
  version: 1;
  hero: HeroContent;
  models: Model[];
  gallery: GalleryItem[];
  ads: Ad[];
  history: HistoryItem[];
  usage: { generations: number };
};

const defaultModels: Model[] = [
  {
    id: 'm-flux',
    name: 'Flux',
    slug: 'flux',
    endpoint: `${POLL}/{prompt}?width={width}&height={height}&seed={seed}&model=flux`,
    enabled: true,
    builtIn: true,
  },
  {
    id: 'm-turbo',
    name: 'Turbo',
    slug: 'turbo',
    endpoint: `${POLL}/{prompt}?width={width}&height={height}&seed={seed}&model=turbo`,
    enabled: false, // the Pollinations anonymous tier is Flux-only now; admins with a paid key can turn this on
    builtIn: true,
  },
];

const seededGallery: Omit<GalleryItem, 'addedAt'>[] = [
  { id: 'g-harbor', title: 'Harbor at dawn', tag: 'Landscape', url: pollUrl('harbor at dawn, long exposure, pale light, fine grain', 13831, 768, 960), w: 768, h: 960, seed: 13831 },
  { id: 'g-library', title: 'The long library', tag: 'Architecture', url: pollUrl('brutalist library interior, morning light, one reader', 57122, 768, 768), w: 768, h: 768, seed: 57122 },
  { id: 'g-west', title: 'West light', tag: 'Interiors', url: pollUrl('single chair in an empty flat, hard west light', 90418, 640, 800), w: 640, h: 800, seed: 90418 },
  { id: 'g-dune', title: 'Dune at noon', tag: 'Landscape', url: pollUrl('dune ridge at noon, minimal, one walker far away', 21649, 768, 576), w: 768, h: 576, seed: 21649 },
  { id: 'g-porcelain', title: 'Porcelain and linen', tag: 'Still life', url: pollUrl('porcelain vase on raw linen, soft window light', 77340, 768, 1024), w: 768, h: 1024, seed: 77340 },
  { id: 'g-tower', title: 'Overcast tower', tag: 'Architecture', url: pollUrl('glass tower reflection, overcast sky, minimal', 50996, 640, 960), w: 640, h: 960, seed: 50996 },
  { id: 'g-umbrella', title: 'Red umbrella', tag: 'Street', url: pollUrl('red umbrella in rain, shallow depth, motion blur', 32871, 768, 768), w: 768, h: 768, seed: 32871 },
  { id: 'g-sand', title: 'Black sand', tag: 'Landscape', url: pollUrl('waves on black sand seen from above, aerial, foam lines', 68520, 800, 600), w: 800, h: 600, seed: 68520 },
];

const seed: Store = {
  version: 1,
  hero: {
    eyebrow: 'Text to image, straight from the browser',
    headline: 'Pictures out of noise.',
    sub: 'Type a few words. DeepArt samples a diffusion model and hands back a finished image. No login, no account: everything runs and stays in your browser.',
    seed: 880231,
  },
  models: defaultModels,
  gallery: seededGallery.map((g, i) => ({ ...g, addedAt: Date.now() - i * 86_400_000 })),
  ads: [
    {
      id: 'ad-sample',
      headline: 'This spot is yours. Add an ad in /subhan and it lives here.',
      link: '#',
      imageUrl: pollUrl('wide minimal abstract poster, lime and ink flat shapes, print grain', 4277, 1200, 260),
      placement: 'home-strip',
      active: true,
    },
  ],
  history: [],
  usage: { generations: 0 },
};

export const seedStore = seed;
export const SIZES = [
  { label: 'Portrait 4:5', w: 896, h: 1120 },
  { label: 'Square 1:1', w: 1024, h: 1024 },
  { label: 'Wide 16:9', w: 1216, h: 684 },
] as const;

export const BUILT_IN_SLUGS = ['flux', 'turbo', 'kontext'];

/** Structured copy of store state (structuredClone, JSON fallback). */
export function cloneStore(s: Store): Store {
  if (typeof structuredClone === 'function') return structuredClone(s);
  return JSON.parse(JSON.stringify(s)) as Store;
}
