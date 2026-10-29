/**
 * Set beside the session cookie and readable by scripts: it holds no credential, it only tells a
 * public page that this browser has signed in to the admin, so the page asks the admin proxy for
 * its Search Console figures instead of every visitor's browser asking. A stale one costs a 401.
 */
export const ADMIN_MARKER_COOKIE = 'parkfan_admin';

/**
 * Reads one cookie out of a `Cookie` header. Kept free of `next/headers` so the code that parses
 * attacker-controlled input can be tested; split rather than matched, so the name comparison is
 * exact and no regex runs over hostile input.
 */
export function readCookie(header: string | null | undefined, name: string): string | null {
  if (!header) return null;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;

    const raw = part.slice(separator + 1).trim();
    if (raw.length === 0) return null;

    try {
      return decodeURIComponent(raw);
    } catch {
      // A malformed percent-escape is not a session token.
      return null;
    }
  }

  return null;
}
