// State-free image relay for the OpenAI-compatible model kind: the browser posts
// { endpoint, apiKey, model, prompt, size } to /api/gen (its own origin) and this handler
// performs the POST to the provider and hands the JSON answer back. Why a relay: an admin
// can point a model at any OpenAI-compatible host, so a static CSP allowlist and
// per-provider CORS can never cover them all; through the relay the browser only ever
// talks to its own origin. Nothing is stored, nothing is logged; the key travels inside
// the request body for the two hops it must, then dies with the response. Guards are
// https-only plus a private/loopback host blocklist, not path-based: compat name their
// image paths too differently for one pattern to hold.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const maxDuration = 60; // gpt-image-1 class renders can take tens of seconds

type Body = { endpoint?: unknown; apiKey?: unknown; model?: unknown; prompt?: unknown; size?: unknown };

/** Best-effort SSRF guard: refuse loopback, link-local, private and CGNAT targets. */
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

export async function POST(req: NextRequest) {
  let b: Body;
  try {
    b = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: { message: 'Malformed request body.' } }, { status: 400 });
  }

  const endpoint = typeof b.endpoint === 'string' ? b.endpoint.trim() : '';
  const apiKey = typeof b.apiKey === 'string' ? b.apiKey.slice(0, 4096) : '';
  const model = typeof b.model === 'string' ? b.model.slice(0, 200) : '';
  const prompt = typeof b.prompt === 'string' ? b.prompt.slice(0, 8000) : '';
  const size = typeof b.size === 'string' ? b.size : '';

  let u: URL | null = null;
  try {
    if (urlOk(endpoint)) u = new URL(endpoint);
  } catch {
    /* falls through to the 400 below */
  }
  if (!u) {
    return NextResponse.json({ error: { message: 'The endpoint must be a full https URL.' } }, { status: 400 });
  }
  if (blockedHost(u.hostname)) {
    return NextResponse.json({ error: { message: 'That host is not reachable from here.' } }, { status: 400 });
  }
  // Note: no path restriction beyond the host guard — compat providers name their
  // images paths all sorts of ways, and the earlier strict 'generations' check hung up
  // legitimate endpoints. Abuse surface stays narrow: https only, public hosts only,
  // one JSON POST with caller-supplied credentials, 55 s ceiling.
  if (!/^\d{3,4}x\d{3,4}$/.test(size)) {
    return NextResponse.json({ error: { message: 'The size must be like 1024x1024.' } }, { status: 400 });
  }
  if (model.length < 1 || prompt.length < 2) {
    return NextResponse.json({ error: { message: 'Both model and prompt are needed.' } }, { status: 400 });
  }

  try {
    const r = await fetch(u.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      // dall-e models answer hosted URLs on foreign domains the CSP cannot allow globally;
      // gpt-image-1 rejects the param but answers b64_json regardless, so b64 wins either way.
      body: JSON.stringify({
        model,
        prompt,
        size,
        ...(model.toLowerCase().startsWith('dall-e') ? { response_format: 'b64_json' } : {}),
      }),
      signal: AbortSignal.timeout(55_000),
    });
    const text = await r.text();
    let bodyJson: unknown;
    try {
      bodyJson = JSON.parse(text);
    } catch {
      bodyJson = { error: { message: text.slice(0, 300) } };
    }
    return NextResponse.json(bodyJson as object, { status: r.status, headers: { 'cache-control': 'no-store' } });
  } catch (e) {
    const msg =
      e instanceof Error && e.name === 'TimeoutError'
        ? 'The provider did not answer within 55 s.'
        : 'The relay could not reach the provider.';
    return NextResponse.json({ error: { message: msg } }, { status: 504 });
  }
}

function urlOk(endpoint: string): boolean {
  return /^https:\/\/[^\s]+$/.test(endpoint);
}
