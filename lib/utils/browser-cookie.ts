/**
 * Read and write a cookie in the browser, without a cookie library in every page's bundle. Same
 * encoding as `cookies-next` 6, so cookies it wrote stay readable: `encodeURIComponent` on the way
 * in, `%XX` runs decoded on the way out. Both are no-ops outside a browser.
 */

/** A cookie's decoded value in the browser, or `undefined`. */
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

/** Sets a cookie in the browser, URL-encoding the value. */
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
