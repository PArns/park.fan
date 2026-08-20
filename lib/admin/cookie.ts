/**
 * Reading one cookie out of a `Cookie` header.
 *
 * Its own module, with no `server-only` and no `next/headers`, for two reasons.
 * It is the one piece of the session transport that is pure — a string in, a
 * string out — so it is the one piece that can be tested without a request; and
 * it is parsing a header an attacker controls, which is exactly the code that
 * should be covered rather than assumed.
 *
 * Split rather than matched. A regex over hostile input is a shape worth
 * avoiding on principle, and splitting also makes the name comparison exact for
 * free: a loosely anchored pattern happily matches a cookie whose name merely
 * ends in the one being looked for.
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
