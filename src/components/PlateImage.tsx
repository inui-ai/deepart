'use client';
// A plate <img> that can carry its own retry ladder, so server-rendered landing
// sections can pass error resilience without lifting the whole section to the client.
import { retryableImgError } from '@/lib/img';

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  hidden?: boolean;
  eager?: boolean;
  retries?: number;
};

export function PlateImage({ src, alt, width, height, hidden, eager, retries = 2 }: Props) {
  return (
    <img
      src={src}
      alt={hidden ? '' : alt}
      aria-hidden={hidden || undefined}
      decoding={eager ? 'sync' : 'async'}
      fetchPriority={eager ? 'high' : 'low'}
      width={width}
      height={height}
      onError={retryableImgError(retries)}
    />
  );
}
