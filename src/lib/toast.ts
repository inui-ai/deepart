// Toasts: one publisher, one fixed region, styled like the sampler's readout line.
'use client';

import { useSyncExternalStore } from 'react';

export type Toast = { id: number; msg: string; kind: 'ok' | 'warn' | 'error' };
// items is replaced, never mutated: useSyncExternalStore compares snapshots by identity,
// so a stable ref would silently freeze the region and toasts would never paint.
let items: Toast[] = [];
const listeners = new Set<() => void>();
let nextId = 1;

const emit = () => listeners.forEach((fn) => fn());

export function toast(msg: string, kind: Toast['kind'] = 'ok') {
  const t = { id: nextId++, msg, kind };
  items = [...items, t];
  emit();
  setTimeout(() => {
    items = items.filter((x) => x.id !== t.id);
    emit();
  }, 3800);
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => items,
    () => items,
  );
}
