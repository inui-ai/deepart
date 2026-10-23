// The one unit that touches localStorage. Pages read state through useStore(); admin writes
// through mutate(). Server renders always return the seed, so SSR HTML is real content and
// hydration matches; the persisted copy is adopted right after mount by <StoreSync />.
'use client';

import { useSyncExternalStore } from 'react';
import { cloneStore, seedStore, type Model, type Store } from '@/data/site';

const KEY = 'deepart:v1';
const listeners = new Set<() => void>();
let snapshot: Store = cloneStore(seedStore);

const emit = () => listeners.forEach((fn) => fn());

export function useStore(): Store {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Stable per-state identity; replaced only by hydrate() and mutate(). */
export const getSnapshot = (): Store => snapshot;

const storage = () => {
  try { return localStorage; } catch { return null; }
};

/** Adopt the persisted copy (once per session, from a client effect). Writes the seed when
 *  nothing is stored yet. Never throws: a private-mode or blocked browser keeps the seed. */
export function hydrate() {
  const ls = storage();
  if (!ls) return;
  try {
    const raw = ls.getItem(KEY);
    if (raw == null) {
      ls.setItem(KEY, JSON.stringify(seedStore));
      snapshot = cloneStore(seedStore);
    } else {
      const parsed = parsePersisted(raw);
      snapshot = parsed ?? cloneStore(seedStore); // corrupt or blocked: keep the seed
      // persist the adopted copy: migration (history dedupe) heals polluted storage too
      try { ls.setItem(KEY, JSON.stringify(snapshot)); } catch { /* read-only storage keeps in-memory state */ }
    }
  } catch {
    snapshot = cloneStore(seedStore); // storage unavailable: keep the seed, keep the site up
  }
  emit();
}

function persist(next: Store): boolean {
  const ls = storage();
  if (!ls) return false;
  try {
    ls.setItem(KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

type MutateFn = (draft: Store) => void;
/** Apply a change, persist it, notify. Returns false when persistence failed (quota or blocked). */
export function mutate(fn: MutateFn): boolean {
  const next = cloneStore(snapshot);
  fn(next);
  const ok = persist(next);
  snapshot = next;
  emit();
  return ok;
}

export function resetToSeed() {
  const next = cloneStore(seedStore);
  const ok = persist(next);
  snapshot = next;
  emit();
  return ok;
}

export function exportJson(): string {
  return JSON.stringify(snapshot, null, 2);
}

export function importJson(raw: string): { ok: boolean; error?: string } {
  const parsed = parsePersisted(raw);
  if (!parsed) return { ok: false, error: 'This file is not a DeepArt export.' };
  const ok = persist(parsed);
  snapshot = parsed;
  emit();
  return { ok };
}

function parsePersisted(raw: string): Store | null {
  try {
    const v = JSON.parse(raw) as Store;
    if (!v || typeof v !== 'object' || !Array.isArray(v.models) || !Array.isArray(v.gallery) || !Array.isArray(v.ads)) return null;
    return migrate(v);
  } catch {
    return null;
  }
}

/** Forward-compatible migration hook. v1 is the only version; later versions land here. */
function migrate(v: Store): Store {
  const s: Store = { ...cloneStore(seedStore), ...v, version: 1 };
  s.hero = { ...seedStore.hero, ...v.hero };
  s.usage = { ...seedStore.usage, ...v.usage };
  // history is newest-first and unique by URL: a rerun re-places its strip instead of
  // stacking copies, and persisted stores polluted by the old behavior heal on load.
  s.history = Array.isArray(v.history)
    ? v.history
      .filter((h, i) => !!h && typeof (h as { url?: unknown }).url === 'string' && v.history.findIndex((g) => g?.url === h.url) === i)
      .slice(0, 12)
    : [];
  return s;
}

export function storageUsage(): { kb: number; quota: string } {
  const bytes = JSON.stringify(snapshot).length * 2; // UTF-16 estimate
  return { kb: Math.round(bytes / 1024), quota: '5 MB' };
}

/** Build a request URL from a model's endpoint template. */
export function buildUrl(m: Model, a: { prompt: string; width: number; height: number; seed: number }): string {
  return m.endpoint
    .replace('{prompt}', encodeURIComponent(a.prompt))
    .replaceAll('{model}', m.slug)
    .replace('{width}', String(a.width))
    .replace('{height}', String(a.height))
    .replace('{seed}', String(a.seed));
}

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
