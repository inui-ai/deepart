// Same-origin image GET for openai-kind answers that arrive as hosted URLs: a foreign
// https image would be killed by the img-src allowlist, so the sampler rewrites
// https://provider/… to /api/img?url=https://provider/… and this handler pipes the bytes
// back through its own origin. Guards: https only, private/loopback blocklist, image
// content types only, a 12 MB ceiling, and (when the browser sends it) sec-fetch-site
// must be same-origin so other sites cannot hotlink through this function.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const maxDuration = 60;

const TEN_MB = 12 * 1024 * 1024;

function blockedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (h.startsWith('[')) return true; // IPv6 literals have no browser-facing provider
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

export async function GET(req: NextRequest) {
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') {
    return NextResponse.json({ error: { message: 'Hotlinking is not allowed.' } }, { status: 403 });
  }
  const target = req.nextUrl.searchParams.get('url') ?? '';
  let u: URL | null = null;
  try {
    if (/^https:\/\/[^\s]+$/.test(target)) u = new URL(target);
  } catch {
    /* falls through to the 400 below */
  }
  if (!u) {
    return NextResponse.json({ error: { message: 'The url must be a full https address.' } }, { status: 400 });
  }
  if (blockedHost(u.hostname)) {
    return NextResponse.json({ error: { message: 'That host is not reachable from here.' } }, { status: 400 });
  }
  try {
    const r = await fetch(u.toString(), { signal: AbortSignal.timeout(45_000) });
    if (!r.ok) {
      return NextResponse.json({ error: { message: `The provider image answered HTTP ${r.status}.` } }, { status: 502 });
    }
    const ct = (r.headers.get('content-type') ?? 'image/png').toLowerCase();
    if (!ct.startsWith('image/')) {
      return NextResponse.json({ error: { message: 'That address did not answer with an image.' } }, { status: 502 });
    }
    if (Number(r.headers.get('content-length') ?? 0) > TEN_MB) {
      return NextResponse.json({ error: { message: 'The image is too large to relay.' } }, { status: 413 });
    }
    const buf = await r.arrayBuffer();
    if (buf.byteLength > TEN_MB) {
      return NextResponse.json({ error: { message: 'The image is too large to relay.' } }, { status: 413 });
    }
    return new Response(buf, { status: 200, headers: { 'content-type': ct, 'cache-control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: { message: 'The image could not be fetched.' } }, { status: 504 });
  }
}
