'use client';
// Wall admin: reorder, retitle, retag, delete; add a plate by URL paste or by rendering one
// on the spot. The wall order is the array order (first item is the first plate on home).
import { useEffect, useState } from 'react';
import { buildUrl, mutate, uid, useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { SIZES } from '@/data/site';
import { AdminField, QuietBtn, Row, Stack, Toggle } from './kit';

const specOf = (url: string) => {
  const q = new URL(url, 'https://x.invalid').searchParams;
  const model = q.get('model') ?? 'flux';
  const seed = q.get('seed') ?? '?';
  const dims = url.match(/width=(\d+)&height=(\d+)/);
  return url.startsWith('data:') || !dims
    ? 'pasted image'
    : `${model} \u00b7 ${dims[1]}\u00d7${dims[2]} \u00b7 seed ${seed}`;
};

export function GalleryAdmin() {
  const s = useStore();
  const [mode, setMode] = useState<'url' | 'render'>('url');
  const [fTitle, setFTitle] = useState('');
  const [fTag, setFTag] = useState('');
  const [fUrl, setFUrl] = useState('');

  const [rPrompt, setRPrompt] = useState('');
  const [rModelId, setRModelId] = useState('');
  const [rSizeIdx, setRSizeIdx] = useState(0);
  const [rSeed, setRSeed] = useState(0);
  const [rUrl, setRUrl] = useState('');

  // The render seed is client-born; never present during prerender.
  useEffect(() => { setRSeed(Math.floor(100_000 + Math.random() * 899_999)); }, []);

  const models = s.models.filter((m) => m.enabled);

  function addByUrl() {
    if (!/^https?:\/\/\S+$/.test(fUrl)) { toast('Paste a full image URL (https://...).', 'warn'); return; }
    const ok = mutate((d) => {
      d.gallery.unshift({
        id: uid(),
        title: (fTitle || 'Untitled plate').slice(0, 48),
        tag: (fTag || 'Unclassified').slice(0, 24),
        url: fUrl,
        addedAt: Date.now(),
      });
    });
    if (ok) { toast('Plate added at the top of the wall.', 'ok'); setFTitle(''); setFTag(''); setFUrl(''); }
    else toast('Added for this visit, but the browser refused to save it.', 'warn');
  }

  function renderNow(usedSeed?: number) {
    const m = models.find((x) => x.id === rModelId) ?? models[0];
    if (!m || rPrompt.trim().length < 2) { toast('Type a prompt first (a few words).', 'warn'); return; }
    const size = SIZES[rSizeIdx];
    setRUrl(buildUrl(m, { prompt: rPrompt.trim(), width: size.w, height: size.h, seed: usedSeed ?? rSeed }));
  }

  function useRendered() {
    const m = models.find((x) => x.id === rModelId) ?? models[0];
    if (!rUrl || !m) return;
    const ok = mutate((d) => {
      d.gallery.unshift({
        id: uid(),
        title: (rPrompt || 'Rendered plate').slice(0, 48),
        tag: m.name,
        url: rUrl,
        addedAt: Date.now(),
      });
    });
    if (ok) toast('Plate added at the top of the wall.', 'ok');
    else toast('Added for this visit, but the browser refused to save it.', 'warn');
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= s.gallery.length) return;
    mutate((d) => {
      const [item] = d.gallery.splice(i, 1);
      d.gallery.splice(j, 0, item);
    });
  }

  function remove(i: number) {
    if (!window.confirm('Delete this plate from the wall?')) return;
    mutate((d) => { d.gallery.splice(i, 1); });
    toast('Plate removed.', 'ok');
  }

  return (
    <Stack>
      <Row className="adm__adder">
        <div role="radiogroup" aria-label="How to add" className="gen__chips">
          <Toggle on={mode === 'url'} onClick={() => setMode('url')}>Paste a URL</Toggle>
          <Toggle on={mode === 'render'} onClick={() => setMode('render')}>Render a new one</Toggle>
        </div>

        {mode === 'url' ? (
          <>
            <AdminField label="Image URL">
              <input value={fUrl} onChange={(e) => setFUrl(e.target.value)} placeholder="https://image.pollinations.ai/..." />
            </AdminField>
            <AdminField label="Title">
              <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Harbor at dawn" />
            </AdminField>
            <AdminField label="Tag">
              <input value={fTag} onChange={(e) => setFTag(e.target.value)} placeholder="Landscape" />
            </AdminField>
            <div className="adm__actions">
              <button type="button" className="btn btn--solid" data-fill onClick={addByUrl}>
                <span className="btn__fill" aria-hidden="true" />
                Add plate
              </button>
            </div>
          </>
        ) : (
          <>
            <AdminField label="Prompt">
              <input value={rPrompt} onChange={(e) => setRPrompt(e.target.value)} placeholder="brutalist gallery hall, lime light on concrete" />
            </AdminField>
            <div className="adm__cols">
              <AdminField label="Model">
                <select value={rModelId} onChange={(e) => setRModelId(e.target.value)}>
                  {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </AdminField>
              <AdminField label="Format">
                <select value={rSizeIdx} onChange={(e) => setRSizeIdx(+e.target.value)}>
                  {SIZES.map((sz, i) => <option key={sz.label} value={i}>{`${sz.label} (${sz.w}\u00d7${sz.h})`}</option>)}
                </select>
              </AdminField>
              <AdminField label="Seed">
                <div className="gen__seed">
                  <input type="number" value={rSeed} onChange={(e) => setRSeed(+e.target.value || 0)} />
                  <button type="button" className="chip" aria-label="Random seed" onClick={() => setRSeed(Math.floor(100_000 + Math.random() * 899_999))}>Random</button>
                </div>
              </AdminField>
            </div>
            <div className="adm__actions">
              <button type="button" className="btn btn--solid" data-fill onClick={() => renderNow()}>
                <span className="btn__fill" aria-hidden="true" />
                Render
              </button>
              {rUrl ? <button type="button" className="chip" onClick={() => { const ns = Math.floor(100_000 + Math.random() * 899_999); setRSeed(ns); renderNow(ns); }}>Reroll</button> : null}
            </div>
            {rUrl ? (
              <div className="adm__preview">
                <img src={rUrl} alt="Rendered plate preview" width={768} height={768} decoding="async" />
                <button type="button" className="btn btn--solid" data-fill onClick={useRendered}>
                  <span className="btn__fill" aria-hidden="true" />
                  Use this plate
                </button>
              </div>
            ) : null}
          </>
        )}
      </Row>

      <h3 className="adm__h3">Wall order ({s.gallery.length})</h3>

      {s.gallery.length === 0 ? (
        <p className="adm__note">No plates yet. Add one above; the home page wall will show it.</p>
      ) : (
        <ol className="adm__list">
          {s.gallery.map((g, i) => (
            <li key={g.id} className="adm__item">
              <img className="adm__thumb" src={g.url} alt="" width={96} height={96} loading="lazy" decoding="async" />
              <div className="adm__inputs">
                <input value={g.title} aria-label="Title" onChange={(e) => mutate((d) => { d.gallery[i].title = e.target.value; })} />
                <input value={g.tag} aria-label="Tag" onChange={(e) => mutate((d) => { d.gallery[i].tag = e.target.value; })} placeholder="Tag" />
                <input className="adm__mono" value={g.url} aria-label="Image URL" onChange={(e) => mutate((d) => { d.gallery[i].url = e.target.value; })} />
                <p className="plate__spec">{specOf(g.url)}</p>
              </div>
              <div className="adm__itembtns">
                <QuietBtn aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>&uarr;</QuietBtn>
                <QuietBtn aria-label="Move down" disabled={i === s.gallery.length - 1} onClick={() => move(i, 1)}>&darr;</QuietBtn>
                <QuietBtn className="adm__btn--warn" aria-label={`Delete ${g.title}`} onClick={() => remove(i)}>Delete</QuietBtn>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Stack>
  );
}
