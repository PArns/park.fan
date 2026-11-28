/**
 * Whether a state-changing request was sent by a page of another origin. The session cookie is
 * `SameSite=Strict`, but "site" is all of `*.park.fan`: a page on any sibling host is same-site and
 * its form post carries the cookie. A browser says where a request came from in `Sec-Fetch-Site`,
 * older ones in `Origin`; a caller that sends neither is not a browser page and is let through.
 */
export function isCrossOriginWrite(request: Request): boolean {
  const method = (request.method ?? 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return false;

  const site = request.headers.get('sec-fetch-site');
  if (site) return site !== 'same-origin' && site !== 'none';

  const origin = request.headers.get('origin');
  if (!origin) return false;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}
