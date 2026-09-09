import { NextRequest, NextResponse } from 'next/server';
import { getServerApiHeaders } from '@/lib/api/client';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';

/**
 * The thin-relay shape every route under `app/api/push/` shares — extracted
 * after `subscriptions`, `ride-alerts` and `show-follows` each carried a
 * byte-for-byte identical `relay()`, differing only in which push resource
 * path they forwarded to.
 *
 * Thin on purpose: the API owns every rule about what's valid here — that a
 * subscription exists, that a threshold is in range, that a topic is known.
 * Duplicating any of it would put the same check in two repositories, and
 * the copy that drifts is the one nothing tests. The status is passed
 * through rather than flattened for the same reason — 503, 404, 400 and 429
 * mean different things to whatever called this, and collapsing them into
 * "failed" is how a visitor ends up retrying something that will never work.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan';

/** `GET <apiPath>?endpoint=…` — the "list this browser's own rows" shape `ride-alerts`/`show-follows` both use. */
export async function relayPushGet(
  request: NextRequest,
  apiPath: string
): Promise<NextResponse> {
  const endpoint = request.nextUrl.searchParams.get('endpoint');
  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_BASE}${apiPath}?endpoint=${encodeURIComponent(endpoint)}`, {
      headers: { ...getForwardedForHeaders(request), ...getServerApiHeaders() },
      cache: 'no-store',
    });
    const text = await response.text();
    return new NextResponse(text || null, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Push service unreachable' }, { status: 502 });
  }
}

/** `POST`/`DELETE <apiPath>` with the request's JSON body forwarded as-is. */
export async function relayPushWrite(
  request: NextRequest,
  apiPath: string,
  method: 'POST' | 'DELETE'
): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_BASE}${apiPath}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getForwardedForHeaders(request),
        ...getServerApiHeaders(),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    // 204 (delete, or a subscribe that VAPID-503'd earlier) carries no body —
    // calling `.json()`/`.text()` on one is fine, but forwarding "" as a
    // 200-shaped JSON body is not, so it gets its own branch.
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const text = await response.text();
    return new NextResponse(text || null, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Push service unreachable' }, { status: 502 });
  }
}
