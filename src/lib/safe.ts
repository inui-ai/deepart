/** URL allowlist for anything the store persists and renders into a href:
 *  http(s), protocol-relative, root-relative and #fragment pass; anything that
 *  could execute or smuggle content (javascript:, data:, vbscript:...) and plain
 *  junk degrades to '#'. ```
 */
export function safeHref(raw: string): string {
  const u = (raw || '').trim();
  if (!u) return '#';
  if (/^(https?:)?\/\//i.test(u) || u.startsWith('/') || u.startsWith('#')) return u;
  return '#';
}
