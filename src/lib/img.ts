// Pollinations' anonymous tier throttles fresh generations (HTTP 402) but serves cached
// URLs freely — the throttle lifts within ~45 s. A broken image therefore retries its
// exact URL on a widening ladder (8 s / 22 s / 40 s) before giving up to broken styling.
'use client';

const WAITS_MS = [8000, 22000, 40000];

export function retryableImgError(retries = 2, onFinal?: () => void) {
  return (e: { currentTarget: HTMLImageElement }) => {
    const img = e.currentTarget;
    const original = img.dataset.orig ?? img.src;
    img.dataset.orig = original;
    const n = Number(img.dataset.retryN ?? '0');
    if (n < retries) {
      img.dataset.retryN = String(n + 1);
      window.setTimeout(() => {
        img.src = '';
        img.src = original; // same URL: the cache answers the moment the throttle lifts
      }, WAITS_MS[Math.min(n, WAITS_MS.length - 1)]);
    } else {
      img.closest('.plate, figure')?.classList.add('is-broken');
      onFinal?.();
    }
  };
}
