/**
 * Read and write a cookie in the browser. Replaces `cookies-next`, which shipped 15 KB of minified
 * JS to every page for the two client calls it served (favorites and the temperature unit;
 * measured from the production source maps, 2026-10-03).
 *
 * Same encoding as `cookies-next` 6, so cookies it wrote stay readable: the value goes through
 * `encodeURIComponent` on the way in (what its `cookie.serialize` did) and `%XX` runs are decoded
 * on the way out (its `decode`). Both are no-ops outside a browser.
 */

export function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const entry = part.trimStart();
    if (!entry.startsWith(prefix)) continue;
    const value = entry.slice(prefix.length);
    try {
      return value.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);
    } catch {
      return value;
    }
  }
  return undefined;
}

export function writeCookie(
  name: string,
  value: string,
  {
    maxAge,
    sameSite = 'lax',
    path = '/',
  }: { maxAge?: number; sameSite?: 'lax' | 'strict'; path?: string } = {}
): void {
  if (typeof document === 'undefined') return;
  let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite === 'strict' ? 'Strict' : 'Lax'}`;
  if (maxAge !== undefined) cookie += `; Max-Age=${Math.floor(maxAge)}`;
  document.cookie = cookie;
}
