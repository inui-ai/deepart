// Pollinations' anonymous tier throttles fresh generations (HTTP 402) but serves cached
// URLs freely, and a failed request clears in a moment. So a broken image first retries
// its exact URL, and only then gives up to the broken-state styling.
'use client';

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
      }, 3200 + n * 3200);
    } else {
      img.closest('.plate, figure')?.classList.add('is-broken');
      onFinal?.();
    }
  };
}
