'use client';
// The editorial page: prompt in, image out, in view. Left column holds the controls, the
// sticky right stage resolves the sample in steps and types its own readout. Below, the run
// history reloads any previous sample (the URLs are deterministic, so nothing heavy is stored).
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { isMobile, prefersReducedMotion } from '@/engine';
import { resolveStage } from '@/motion/resolve';
import { buildUrl, mutate, useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { SIZES } from '@/data/site';
import type { Model } from '@/data/site';

type Status = 'idle' | 'loading' | 'done' | 'error';
type Run = { prompt: string; modelId: string; modelName: string; w: number; h: number; seed: number; url: string };
const STEP_MAX = 14;

// OpenAI-compatible size: the API validates against a fixed set, so the pick maps on aspect.
function openAiSize(w: number, h: number): string {
  if (w > h) return '1536x1024';
  if (h > w) return '1024x1536';
  return '1024x1024';
}

// b64_json answers arrive as megabyte PNG strings; the 5 MB localStorage quota makes raw
// storage a time bomb, so the plate keeps a canvas-downscaled JPEG data URL instead.
async function b64ToJpegDataUrl(b64: string, maxSide = 1024): Promise<string> {
  const src = `data:image/png;base64,${b64}`;
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = () => res(null);
    img.onerror = () => rej(new Error('the returned image could not be decoded'));
    img.src = src;
  });
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
  c.height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
  const ctx = c.getContext('2d');
  if (!ctx) return src; // no canvas: keep the raw data URL; img-src data: is allowed by the CSP
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.82);
}

export function Generate() {
  const s = useStore();
  const models = s.models.filter((m) => m.enabled);
  const [modelId, setModelId] = useState(models[0]?.id ?? '');
  const [prompt, setPrompt] = useState('');
  const [sizeIdx, setSizeIdx] = useState(0);
  const [seed, setSeed] = useState(0);
  const [autoSeed, setAutoSeed] = useState(true);
  const [status, setStatus] = useState<Status>('idle');
  const [active, setActive] = useState<Run | null>(null);

  // Random seeds are client-born: they must never exist during prerender.
  useEffect(() => { setSeed(Math.floor(100_000 + Math.random() * 899_999)); }, []);

  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const readoutRef = useRef<HTMLParagraphElement>(null);
  const tickerFn = useRef<(() => void) | null>(null);
  const counterRef = useRef(0);

  const model = models.find((m) => m.id === modelId) ?? models[0];
  const size = SIZES[sizeIdx];
  const ready = !!model && prompt.trim().length > 1 && status !== 'loading';

  const spec = (r: Run) =>
    `${r.modelName} \u00b7 ${r.w}\u00d7${r.h} \u00b7 seed ${r.seed} \u00b7 \u201c${r.prompt.slice(0, 44)}${r.prompt.length > 44 ? '\u2026' : ''}\u201d`;

  const stopTicker = () => {
    if (tickerFn.current) {
      gsap.ticker.remove(tickerFn.current);
      tickerFn.current = null;
    }
  };

  useEffect(() => () => stopTicker(), []);

  function startTicker() {
    stopTicker();
    counterRef.current = 0;
    const el = readoutRef.current;
    if (!el) return;
    el.textContent = 'sampling step 00/14';
    tickerFn.current = () => {
      if (Math.floor(gsap.ticker.time * 3) !== counterRef.current) {
        counterRef.current = Math.floor(gsap.ticker.time * 3);
        const step = Math.min(13, (counterRef.current % STEP_MAX) + 1);
        const text = `sampling step ${String(step).padStart(2, '0')}/14`;
        if (el.textContent !== text) el.textContent = text;
      }
    };
    gsap.ticker.add(tickerFn.current);
  }

  function sample(r: Run) {
    setStatus('loading');
    setActive(r);
    startTicker();
    // Force a fresh resolve even when a cached image fires onload after React commits.
    if (imgRef.current && stageRef.current && !prefersReducedMotion()) {
      gsap.set(stageRef.current.querySelector('.plate__noise'), { autoAlpha: 1 });
      gsap.set(imgRef.current, { filter: isMobile() ? 'none' : 'blur(5px)', scale: 1.02 });
    }
    imgRef.current?.setAttribute('src', r.url); // fires again even for known URLs
  }

  function run(fill?: Run) {
    const usePrompt = (fill?.prompt ?? prompt).trim();
    const m = s.models.find((x) => x.id === (fill?.modelId ?? modelId)) ?? model;
    if (!m || !usePrompt) return;
    if (m.kind === 'openai') {
      void runOpenAi(m, usePrompt, fill); // POST/JSON flow; the img load finishes the run
      return;
    }
    sample({
      prompt: usePrompt,
      modelId: m.id,
      modelName: m.name,
      w: fill?.w ?? size.w,
      h: fill?.h ?? size.h,
      seed: fill?.seed ?? seed,
      url: buildUrl(m, {
        prompt: usePrompt,
        width: fill?.w ?? size.w,
        height: fill?.h ?? size.h,
        seed: fill?.seed ?? seed,
      }),
    });
  }

  // OpenAI-compatible images API via the same-origin /api/gen relay: any https provider
  // works without CSP or CORS edits, and provider errors (401, 429…) pass through with
  // their real message. Failure paths here must stop the ticker themselves — an <img>
  // never fires onerror for a POST that never produced a picture.
  async function runOpenAi(m: Model, usePrompt: string, fill?: Run) {
    const w = fill?.w ?? size.w;
    const h = fill?.h ?? size.h;
    const r: Run = { prompt: usePrompt, modelId: m.id, modelName: m.name, w, h, seed: fill?.seed ?? seed, url: '' };
    setStatus('loading');
    setActive(r);
    startTicker();
    if (imgRef.current && stageRef.current && !prefersReducedMotion()) {
      gsap.set(stageRef.current.querySelector('.plate__noise'), { autoAlpha: 1 });
      gsap.set(imgRef.current, { filter: isMobile() ? 'none' : 'blur(5px)', scale: 1.02 });
    }
    try {
      const res = await fetch('/api/gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // the key rides in the body, relay-side
        body: JSON.stringify({
          endpoint: m.endpoint,
          apiKey: m.apiKey ?? '',
          model: m.slug,
          prompt: usePrompt,
          size: openAiSize(w, h),
        }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(e?.error?.message ?? `HTTP ${res.status}`);
      }
      const j = (await res.json()) as { data?: Array<{ url?: string; b64_json?: string }> };
      const item = j.data?.[0];
      let url = item?.url ?? '';
      if (item?.b64_json) url = await b64ToJpegDataUrl(item.b64_json);
      if (!url) throw new Error('the answer carried no image');
      r.url = url;
      setActive({ ...r });
      imgRef.current?.setAttribute('src', url);
    } catch (err) {
      stopTicker();
      setStatus('error');
      toast(`The sampler did not converge: ${String((err as Error)?.message ?? err)}`, 'error');
    }
  }

  function onImgLoad() {
    if (status !== 'loading' || !active) return;
    stopTicker();
    setStatus('done');
    const el = readoutRef.current;
    const r = active;
    resolveStage(stageRef.current!, el, spec(r));
    mutate((d) => {
      d.usage.generations += 1;
      // same URL already in the list (a rerun): replace it instead of duplicating the strip
      d.history = d.history.filter((h) => h.url !== r.url);
      d.history.unshift({
        id: Math.random().toString(36).slice(2, 10),
        prompt: r.prompt,
        modelId: r.modelId,
        modelName: r.modelName,
        width: r.w,
        height: r.h,
        seed: r.seed,
        url: r.url,
        at: Date.now(),
      });
      if (d.history.length > 12) d.history.length = 12;
    });
  }

  function onImgError() {
    if (status !== 'loading' || !imgRef.current) return;
    // The free Pollinations tier allows one fresh render per ~45 s (HTTP 402 otherwise);
    // a retry on the exact URL usually lands once the limiter cools.
    const img = imgRef.current;
    const n = Number(img.dataset.retryN ?? '0');
    const waits = [8000, 22000, 40000];
    if (n < waits.length) {
      img.dataset.retryN = String(n + 1);
      window.setTimeout(() => {
        img.src = '';
        img.src = active?.url ?? '';
      }, waits[n]);
      return; // stay in the loading state; the ticker keeps sampling
    }
    stopTicker();
    setStatus('error');
    toast('The sampler did not converge. Retry with a new seed.', 'error');
  }

  async function download() {
    if (!active) return;
    try {
      // data: URLs (the openai b64 path) go through a canvas instead of fetch: deterministic,
      // entitlement-free under the CSP, and keeps the file entirely local.
      let blob: Blob;
      if (active.url.startsWith('data:')) {
        const img = new Image();
        await new Promise((res, rej) => {
          img.onload = () => res(null);
          img.onerror = () => rej(new Error('decode failed'));
          img.src = active.url;
        });
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (!ctx) throw new Error('no canvas');
        ctx.drawImage(img, 0, 0);
        blob = await new Promise<Blob>((res, rej) => {
          c.toBlob((b) => (b ? res(b) : rej(new Error('no blob'))), 'image/jpeg', 0.9);
        });
      } else {
        blob = await (await fetch(active.url)).blob();
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `deepart-${active.modelName.toLowerCase()}-${active.seed}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch {
      toast('The browser blocked the download. Open the image and save it manually.', 'warn');
    }
  }

  function addToWall() {
    if (!active) return;
    const ok = mutate((d) => {
      d.gallery.unshift({
        id: Math.random().toString(36).slice(2, 10),
        title: active.prompt.slice(0, 48),
        tag: active.modelName,
        url: active.url,
        addedAt: Date.now(),
      });
    });
    toast(ok ? 'Added to the gallery. It is live on the home page now.' : 'Added for this visit, but the browser refused to save it.', ok ? 'ok' : 'warn');
  }

  return (
    <div className="gen">
      <form
        className="gen__controls"
        onSubmit={(e) => { e.preventDefault(); run(); }}
        aria-label="Generate an image"
      >
        <h1 className="gen__h1">The sampler.</h1>
        <div className="gen__field">
          <label htmlFor="prompt">Prompt</label>
          <textarea
            id="prompt"
            rows={4}
            placeholder="a lighthouse in lime light, long exposure, fine grain"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <fieldset className="gen__field">
          <legend>Model</legend>
          <div className="gen__chips" role="radiogroup">
            {models.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={m.id === modelId}
                className={`chip ${m.id === modelId ? 'chip--on' : ''}`}
                onClick={() => { setModelId(m.id); if (autoSeed) setSeed(Math.floor(100_000 + Math.random() * 899_999)); }}
              >
                {m.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="gen__field">
          <legend>Format</legend>
          <div className="gen__chips" role="radiogroup">
            {SIZES.map((sz, i) => (
              <button
                key={sz.label}
                type="button"
                role="radio"
                aria-checked={i === sizeIdx}
                className={`chip ${i === sizeIdx ? 'chip--on' : ''}`}
                onClick={() => setSizeIdx(i)}
              >
                {sz.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="gen__field">
          <label htmlFor="seed">Seed</label>
          <div className="gen__seed">
            <input
              id="seed"
              type="number"
              min={0}
              max={999_999}
              value={seed}
              onChange={(e) => { setAutoSeed(false); setSeed(+e.target.value || 0); }}
            />
            <button
              type="button"
              className="chip"
              aria-label="Use a random seed"
              onClick={() => { setAutoSeed(true); setSeed(Math.floor(100_000 + Math.random() * 899_999)); }}
            >
              Random
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn--solid" data-fill disabled={!ready}>
          <span className="btn__fill" aria-hidden="true" />
          {status === 'loading' ? '\u2026sampling' : 'Generate'}
        </button>
      </form>

      <div className="gen__stagecol">
        <div className={`plate gen__stage gen__stage--${status}`} ref={stageRef}>
          <div className="plate__media">
            <img
              ref={imgRef}
              src={active?.url}
              alt={status === 'done' && active ? active.prompt.slice(0, 120) : ''}
              width={1024}
              height={1024}
              onLoad={onImgLoad}
              onError={onImgError}
              decoding="async"
              fetchPriority="high"
            />
            <div className="plate__noise" aria-hidden="true" />
            <div className="plate__flash" aria-hidden="true" />
            {status !== 'done' ? (
              <p className={`gen__hint ${status === 'error' ? 'gen__hint--bad' : ''}`} aria-live="polite">
                {status === 'idle' && 'Your render lands here. It resolves in steps, like the model runs.'}
                {status === 'loading' && '\u2026sampling'}
                {status === 'error' && 'Did not converge. Change the seed and try again.'}
              </p>
            ) : null}
          </div>
          <p ref={readoutRef} className="plate__spec gen__readout" aria-live="polite">
            {active && status !== 'loading' ? spec(active) : ''}
          </p>
        </div>

        <div className="gen__actions">
          <button type="button" className="roll" onClick={download} disabled={status !== 'done'}>
            <span>Download</span>
            <span aria-hidden="true">Download</span>
          </button>
          <button type="button" className="roll" onClick={addToWall} disabled={status !== 'done'}>
            <span>Add to the gallery</span>
            <span aria-hidden="true">Add to the gallery</span>
          </button>
        </div>
      </div>

      {s.history.length > 0 ? (
        <section className="gen__history" aria-labelledby="history-title">
          <h2 id="history-title" className="gen__h2">Recent runs</h2>
          <ul className="gen__strips">
            {s.history.map((h) => (
              <li key={`${h.id}-${h.at}`}>
                <button
                  type="button"
                  className="gen__strip"
                  onClick={() => run({ prompt: h.prompt, modelId: h.modelId, modelName: h.modelName, w: h.width, h: h.height, seed: h.seed, url: h.url })}
                >
                  <img src={h.url} alt="" width={96} height={96} loading="lazy" decoding="async" />
                  <span className="gen__promptcap">{h.prompt.slice(0, 34)}{h.prompt.length > 34 ? '\u2026' : ''}</span>
                  <span className="plate__spec">{`${h.modelName} \u00b7 seed ${h.seed}`}</span>
                </button>
              </li>
            ))}
          </ul>
          <Link className="link gen__walllink" href="/#gallery">See the gallery</Link>
        </section>
      ) : null}
    </div>
  );
}
