'use client';
// One ad slot component, two placements: home-strip (between hero and gallery) and a right
// rail card on /generate. Inactive or missing ads collapse the slot entirely.
import { useStore } from '@/lib/store';
import { safeHref } from '@/lib/safe';
import type { Ad } from '@/data/site';

export function AdSlot({ placement }: { placement: Ad['placement'] }) {
  const s = useStore();
  const ad = s.ads.find((a) => a.placement === placement && a.active);
  if (!ad) return null;

  const link = safeHref(ad.link); // store data: nothing executable can become a href
  const external = /^https?:\/\//i.test(link) && !link.startsWith(location?.origin ?? 'http');
  return (
    <a
      className={`ad ad--${placement === 'generate-sidebar' ? 'card' : 'strip'}`}
      href={link}
      data-no-transition={external ? '' : undefined}
      data-reveal="fade"
      rel={external ? 'noopener noreferrer nofollow' : undefined}
    >
      <span className="ad__tag" aria-hidden="true">Ad</span>
      <img src={ad.imageUrl} alt="" width={1200} height={260} decoding="async" />
      <span className="ad__headline">{ad.headline}</span>
    </a>
  );
}
