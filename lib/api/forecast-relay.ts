import { NextResponse } from 'next/server';
import { DATA_TERMS_URL } from '@/lib/agents/licensing';
import { NO_STORE } from '@/lib/api/cdn-cache-headers';
import { DEVELOPER_PORTAL_URL } from '@/lib/developers/paths';

/**
 * Whether a relay path under `/api/parks/*` reads only what api.park.fan serves without a key: a
 * park's wait times. Every other path relays data the site's key opens, so it answers park.fan's
 * own pages only.
 */
export function isKeylessRelayPath(path: readonly string[]): boolean {
  return path.length === 5 && path[4] === 'wait-times';
}

/**
 * Whether a relay request comes from a park.fan page. Browsers send `Sec-Fetch-Site: same-origin`
 * on a page's own fetches, and a page on another site cannot make them say so. A browser too old
 * to send the header still sends a `Referer` from the same origin. A script can forge both, so
 * this keeps the forecast relays from being a keyless copy of the API for anyone who reads the
 * network tab, not from a determined scraper; that is what the key on api.park.fan is for.
 */
export function isSameOriginRequest(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin';
  const referer = request.headers.get('referer');
  if (!referer) return false;
  try {
    return new URL(referer).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

/** The answer a forecast relay gives a caller that is not a park.fan page. Never cached. */
export function foreignForecastRequest(): NextResponse {
  return NextResponse.json(
    {
      error: 'forecast-relay',
      message:
        "This is park.fan's internal endpoint for its own pages. Everything beyond the live wait times is available from api.park.fan with an API key.",
      portal: DEVELOPER_PORTAL_URL,
      terms: DATA_TERMS_URL,
    },
    { status: 403, headers: NO_STORE }
  );
}
