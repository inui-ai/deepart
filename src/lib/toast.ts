// Toasts: one publisher, one fixed region, styled like the sampler's readout line.
'use client';

import { useSyncExternalStore } from 'react';

export type Toast = { id: number; msg: string; kind: 'ok' | 'warn' | 'error' };
const items: Toast[] = [];
const listeners = new Set<() => void>();
let nextId = 1;

const emit = () => listeners.forEach((fn) => fn());

export function toast(msg: string, kind: Toast['kind'] = 'ok') {
  const t = { id: nextId++, msg, kind };
  items.push(t);
  emit();
  setTimeout(() => {
    const i = items.indexOf(t);
    if (i >= 0) { items.splice(i, 1); emit(); }
  }, 3800);
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => items,
    () => items,
  );
}
