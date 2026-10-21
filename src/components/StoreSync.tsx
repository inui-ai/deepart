'use client';
import { useEffect } from 'react';
import { hydrate } from '@/lib/store';

/** Adopts the persisted store right after mount (SSR stays on the seed, so hydration matches). */
export function StoreSync() {
  useEffect(() => { hydrate(); }, []);
  return null;
}
