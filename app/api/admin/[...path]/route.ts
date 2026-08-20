import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerApiHeaders } from '@/lib/api/client';
import {
  ADMIN_SESSION_COOKIE,
  forgetAllSessions,
  readSessionToken,
  SESSION_ABSOLUTE_TTL_SECONDS,
  sessionCookieOptions,
} from '@/lib/admin/session';
import { adminProxyPath } from '@/lib/admin/proxy-path';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';

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

/**
 * The one route that legitimately has no session behind it.
 *
 * The admin UI signs in through `/api/admin/session`, but the proxy is a valid
 * way to reach the same endpoint and turning it into a 401 would be a silent
 * behaviour change for anything that does.
 */
const ANONYMOUS_PATHS = new Set(['auth/login']);

/**
 * Endpoints that kill sessions somewhere else.
 *
 * `resolveAdminIdentity` caches "who is this token" for a minute, which is what
 * would otherwise keep a session alive on this app's own write routes — the
 * media commit, the blog save — for up to a minute after an owner revoked it.
 * Clearing here only helps the instance that served the revoking request, so it
 * is the second line: the first is that `requireAdmin` never answers a write
 * from cache (see `lib/admin/session.ts`).
 */
function revokesSessions(method: string, route: string): boolean {
  if (route === 'auth/change-password' || route === 'auth/logout') return true;
  if (method === 'DELETE' && route.startsWith('auth/sessions')) return true;
  if (method === 'PATCH' && route.startsWith('auth/users/')) return true;
  return false;
}

async function proxyRequest(request: NextRequest, path: string[]) {
  // See `lib/admin/proxy-path.ts` — a percent-encoded separator survives Next's
  // route matching and only becomes one inside `new URL()`.
  const upstreamPath = adminProxyPath(path);
  if (!upstreamPath) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const route = path.join('/');
  const token = await readSessionToken(request);

  // No session, no proxy. Everything behind here is an admin endpoint that
  // would answer 401 anyway, but reaching the upstream at all is the problem:
  // `getServerApiHeaders()` attaches this deployment's `x-auth-key`, which the
  // API treats as a throttle bypass, and `forwardedFor` attaches an address the
  // caller chose. An anonymous request must not get either.
  if (!token && !ANONYMOUS_PATHS.has(route)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const incoming = new URL(request.url);
  const target = new URL(`${API_BASE}/v1/admin/${upstreamPath}`);
  incoming.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

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

  if (upstream.ok && revokesSessions(request.method, route)) {
    forgetAllSessions();
  }

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

/**
 * The administrator's own address, for the backend's audit rows and limiter.
 *
 * `getClientIp` rather than a direct read: behind Cloudflare → Vercel the
 * `x-forwarded-for` this function used to copy is a Cloudflare edge server, not
 * the person at the keyboard, so every administrator shared one rate-limit
 * bucket. The same helper already backs `/api/nearby` and `/api/favorites`.
 */
function forwardedFor(request: NextRequest): Record<string, string> {
  return getForwardedForHeaders(request) as Record<string, string>;
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

  const { token, expiresAt, ...rest } = payload as {
    token: string;
    expiresAt?: unknown;
  } & Record<string, unknown>;

  // The session's own ceiling, the same number `/api/admin/session` uses after
  // a login. The 12 hours this used to write were the backend's *idle* window,
  // which slides on every request — the cookie's Max-Age does not, so an admin
  // who changed their password was signed out twelve hours later mid-session
  // while the session behind it had six days left.
  const ceiling = typeof expiresAt === 'number' ? expiresAt : Date.parse(String(expiresAt));
  const maxAge = Number.isFinite(ceiling)
    ? Math.max(60, Math.floor((ceiling - Date.now()) / 1000))
    : SESSION_ABSOLUTE_TTL_SECONDS;

  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions(maxAge));
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
