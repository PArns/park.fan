import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerApiHeaders } from '@/lib/api/client';
import { ADMIN_SESSION_COOKIE, readSessionToken, sessionCookieOptions } from '@/lib/admin/session';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.park.fan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Everything the admin UI asks of api.park.fan goes through here.
 *
 * Two reasons it is a proxy rather than a direct call. The session token lives
 * in an httpOnly cookie, so only the server can turn it into the
 * `Authorization: Bearer` header the API wants — that is what keeps the
 * credential out of reach of any script on this origin. And the browser never
 * needs a CORS relationship with the API, which is what let the backend keep
 * CORS effectively closed in production.
 *
 * Three things here are load-bearing and were each a bug in the version before:
 *
 *  - **Every verb.** The old proxy exported GET and POST. The editing API uses
 *    PATCH (curated fields, seasons, accounts) and DELETE (sessions, ride
 *    profiles, seasons), and each of those would have 405'd at Next before
 *    reaching the API at all.
 *  - **Bodies that are empty.** It ended in an unconditional `response.json()`,
 *    which throws on a 204 — and logout, every DELETE and several PATCHes
 *    answer with no body. The failure surfaced as a 500 from the proxy with
 *    nothing to explain it.
 *  - **The password-change hand-off.** Changing a password revokes every
 *    session of the account, including the one making the request, and answers
 *    with a replacement token. Passing that body straight through would leave
 *    the browser holding a cookie that was just revoked, i.e. logged out by
 *    succeeding. The new token is moved into the cookie here and stripped from
 *    the response.
 */

const FORWARDED_RESPONSE_HEADERS = ['content-type'];

async function proxyRequest(request: NextRequest, path: string[]) {
  // Next decodes route params, so a `%2e%2e` segment arrives here as `..` and
  // `new URL()` would normalise `/v1/admin/../parks` into `/v1/parks` — turning
  // the admin proxy into a general-purpose one and, worse, into a way to reach
  // endpoints whose responses are supposed to be edge-cached under different
  // rules. Nothing legitimate sends an empty or dotted segment.
  if (path.some((segment) => segment.length === 0 || segment === '.' || segment === '..')) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const incoming = new URL(request.url);
  const target = new URL(`${API_BASE}/v1/admin/${path.join('/')}`);
  incoming.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const token = await readSessionToken(request);
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const body = hasBody ? await request.text() : undefined;

  const upstream = await fetch(target.toString(), {
    method: request.method,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...getServerApiHeaders(),
      // The backend attributes audit rows and counts rate limits per address.
      // Without this every administrator in the world shares this
      // deployment's address.
      ...forwardedFor(request),
    },
    body: body && body.length > 0 ? body : undefined,
  });

  if (upstream.status === 204 || upstream.headers.get('content-length') === '0') {
    return new NextResponse(null, {
      status: upstream.status,
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  }

  const text = await upstream.text();
  if (text.length === 0) {
    return new NextResponse(null, {
      status: upstream.status,
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    // Not JSON — a Cloudflare error page, an upstream crash. Pass the status
    // and a readable message rather than a parse error from this layer.
    return NextResponse.json(
      { error: 'Upstream returned a non-JSON response', status: upstream.status },
      { status: upstream.status >= 400 ? upstream.status : 502 }
    );
  }

  const response = NextResponse.json(await rotateSessionToken(payload, path), {
    status: upstream.status,
    headers: { 'Cache-Control': 'no-store, must-revalidate' },
  });

  for (const header of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(header);
    if (value) response.headers.set(header, value);
  }
  return response;
}

function forwardedFor(request: NextRequest): Record<string, string> {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return { 'x-forwarded-for': forwarded.split(',')[0].trim() };
  const real = request.headers.get('x-real-ip');
  return real ? { 'x-forwarded-for': real } : {};
}

/**
 * Endpoints whose response carries a session token meant for the cookie.
 *
 * A list rather than "any response with a `token` key": the rotation writes an
 * authentication cookie, and deciding to do that from the shape of an arbitrary
 * upstream payload is how a field named `token` on some future endpoint quietly
 * becomes somebody's session.
 */
const TOKEN_ISSUING_PATHS = new Set(['auth/change-password', 'auth/login']);

/**
 * Move a re-issued session token from the body into the cookie.
 *
 * `POST auth/change-password` answers with one because it has just revoked
 * every session of the account — including this request's. Left in the body,
 * the browser would be holding a dead cookie and a token it cannot store
 * (httpOnly is set here, not there). `auth/login` is on the list because the
 * proxy is a valid way to reach it, even though the admin UI uses
 * `/api/admin/session` instead.
 */
async function rotateSessionToken(payload: unknown, path: string[]): Promise<unknown> {
  if (!TOKEN_ISSUING_PATHS.has(path.join('/'))) return payload;

  if (
    !payload ||
    typeof payload !== 'object' ||
    !('token' in payload) ||
    typeof (payload as { token: unknown }).token !== 'string'
  ) {
    return payload;
  }

  const { token, ...rest } = payload as { token: string } & Record<string, unknown>;
  const store = await cookies();
  // Twelve hours: the backend's idle window. The absolute expiry is shorter
  // than the cookie only in the sense that the server decides — a cookie that
  // outlives its session simply produces one 401 and a redirect to the login.
  store.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions(12 * 60 * 60));
  return rest;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, (await params).path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, (await params).path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, (await params).path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, (await params).path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, (await params).path);
}
