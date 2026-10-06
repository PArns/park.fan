import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import {
  ADMIN_SESSION_COOKIE,
  forgetAllSessions,
  readSessionToken,
  resolveAdminIdentity,
  SESSION_ABSOLUTE_TTL_SECONDS,
  sessionCookieOptions,
} from '@/lib/admin/session';
import { adminProxyPath } from '@/lib/admin/proxy-path';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The admin UI's proxy to api.park.fan. The session token lives in an httpOnly cookie, so only the
 * server can turn it into the `Authorization: Bearer` header, and the browser needs no CORS
 * relationship with the API. It must export every verb, must not assume a body (logout and DELETE
 * answer 204), and must move the token a password change re-issues into the cookie. See
 * docs/rules/the-admin-holds-no-credential.md.
 */

const FORWARDED_RESPONSE_HEADERS = ['content-type'];

/**
 * The one route that legitimately has no session behind it. The admin UI signs in through
 * `/api/admin/session`, but the proxy is a valid way to reach the same endpoint.
 */
const ANONYMOUS_PATHS = new Set(['auth/login']);

/**
 * Endpoints after which the cached identity of `resolveAdminIdentity` must be cleared. Clearing
 * only helps the instance that served the request, so it is the second line; the first is that
 * `requireAdmin` never answers a write from cache (`lib/admin/session.ts`).
 */
function revokesSessions(method: string, route: string): boolean {
  if (route === 'auth/change-password' || route === 'auth/logout') return true;
  if (method === 'DELETE' && route.startsWith('auth/sessions')) return true;
  if (method === 'PATCH' && route.startsWith('auth/users/')) return true;
  // A second factor does not end the session but changes what `auth/me` answers: a cached
  // `totpEnabled: false` would show the enrolment form again right after enrolling.
  if (route === 'auth/totp/confirm' || route === 'auth/totp/disable') return true;
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

  // No valid session, no proxy: `getServerApiHeaders()` attaches the `x-auth-key` the API reads as
  // a throttle bypass and as licence to trust `forwardedFor`, which an anonymous caller must not
  // get. The cookie is validated with the backend, not just read back. Not `requireAdmin`, because
  // the password change and TOTP enrolment a session may still owe are behind this proxy.
  if (!ANONYMOUS_PATHS.has(route) && !(await resolveAdminIdentity(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const incoming = new URL(request.url);
  const target = new URL(`${getApiBaseUrl()}/v1/admin/${upstreamPath}`);
  incoming.searchParams.forEach((value, key) => {
    // The deprecated shared pass is never relayed: with `x-auth-key` skipping the throttler, this
    // proxy would be the one place where guessing it costs nothing.
    if (key.toLowerCase() === 'pass') return;
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
 * The administrator's own address, for the backend's audit rows and limiter. Through the shared
 * helper, because behind Cloudflare `x-forwarded-for` names an edge server.
 */
function forwardedFor(request: NextRequest): Record<string, string> {
  return getForwardedForHeaders(request) as Record<string, string>;
}

/**
 * Endpoints whose response carries a session token meant for the cookie. A list, not "any response
 * with a `token` key", so a field named `token` on a future endpoint never becomes a session.
 */
const TOKEN_ISSUING_PATHS = new Set(['auth/change-password', 'auth/login']);

/**
 * Moves a re-issued session token from the body into the cookie: a password change revokes every
 * session of the account, this request's included, and the browser cannot store an httpOnly token
 * itself.
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

  // The session's absolute ceiling, as `/api/admin/session` sets after a login, not the backend's
  // idle window: that slides on every request, and a cookie's Max-Age does not.
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
