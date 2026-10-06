import 'server-only';
import { cookies } from 'next/headers';
import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import { readCookie } from './cookie';
import { roleAtLeast, type AdminIdentity, type AdminRole } from './roles';

/**
 * The admin session cookie: httpOnly, so no script on the admin origin can read the token, and
 * `SameSite=Strict`, since nothing links into the admin from another site. See
 * docs/rules/the-admin-holds-no-credential.md.
 */
export const ADMIN_SESSION_COOKIE = 'parkfan_admin_session';

/**
 * Validated identities, briefly, so a burst of admin requests does not ask the backend who the
 * caller is each time. Short, because this cache is what would keep a revoked session alive.
 */
const VALIDATION_TTL_MS = 60_000;
const validated = new Map<string, { identity: AdminIdentity; until: number }>();

/**
 * The backend's absolute session ceiling (`ABSOLUTE_TTL_SECONDS`), for the one
 * case where a cookie has to be written without an `expiresAt` to derive it
 * from. Seven days, and deliberately not the 12 h idle window: that one slides
 * on every request, a cookie's Max-Age does not.
 */
export const SESSION_ABSOLUTE_TTL_SECONDS = 7 * 24 * 60 * 60;

function cacheKeyFor(token: string): string {
  // Only ever used as a Map key inside this process, never logged or persisted.
  return token;
}

/** The raw token from the request's cookie, or null. See `readCookie`. */
export async function readSessionToken(request?: Request): Promise<string | null> {
  if (request) {
    const fromHeader = readCookie(request.headers.get('cookie'), ADMIN_SESSION_COOKIE);
    if (fromHeader) return fromHeader;
  }
  try {
    const store = await cookies();
    return store.get(ADMIN_SESSION_COOKIE)?.value ?? null;
  } catch {
    // `cookies()` throws outside a request scope (e.g. during prerender).
    return null;
  }
}

/**
 * Thrown by `resolveAdminIdentity` in `strict` mode when the backend cannot be
 * reached or answers with a 5xx, so the session probe can report an outage
 * instead of a logout.
 */
class AdminBackendUnreachable extends Error {}

/**
 * Who this request is, according to the backend.
 *
 * Returns null for absent, expired and revoked alike — the caller must not be
 * able to tell those apart, and does not need to. A validated identity is
 * cached for 60 s unless `revalidate` is set.
 */
export async function resolveAdminIdentity(
  request?: Request,
  options: { revalidate?: boolean; strict?: boolean } = {}
): Promise<AdminIdentity | null> {
  const token = await readSessionToken(request);
  if (!token) return null;

  const cached = validated.get(cacheKeyFor(token));
  if (!options.revalidate && cached && cached.until > Date.now()) return cached.identity;

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/v1/admin/auth/me`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, ...getServerApiHeaders() },
    });
  } catch {
    // A backend that cannot be reached says nothing about this token. Callers
    // that must fail closed (`requireAdmin`) still get null; the session probe
    // asks for `strict` so it can report an outage instead of a logout.
    if (options.strict) throw new AdminBackendUnreachable('admin backend unreachable');
    return null;
  }

  if (!response.ok) {
    // Same distinction for a 5xx. Only a real 401/403 means this token is
    // finished — evicting the cache on a gateway error would also throw away a
    // perfectly good identity.
    if (response.status >= 500) {
      if (options.strict) throw new AdminBackendUnreachable(`admin backend ${response.status}`);
      return null;
    }
    validated.delete(cacheKeyFor(token));
    return null;
  }

  const identity = (await response.json()) as AdminIdentity;
  // Bounded: this is a per-process map with no eviction of its own, and an
  // admin surface has a handful of users, not a population.
  if (validated.size > 50) validated.clear();
  validated.set(cacheKeyFor(token), {
    identity,
    until: Date.now() + VALIDATION_TTL_MS,
  });
  return identity;
}

/** Drop a token from the validation cache — called on logout. */
export function forgetSession(token: string | null): void {
  if (token) validated.delete(cacheKeyFor(token));
}

/**
 * Drops every cached identity, for revocations that do not name a token this process can see (a
 * password change, sign out everywhere, a deactivated account).
 */
export function forgetAllSessions(): void {
  validated.clear();
}

export interface AdminGuardFailure {
  response: Response;
  identity: null;
}
export interface AdminGuardSuccess {
  response: null;
  identity: AdminIdentity;
}

/**
 * Guard for this app's own admin route handlers: a ready-to-return response on failure, the
 * identity on success. `minRole` defaults to `author` because every route behind it writes.
 */
export async function requireAdmin(
  request: Request,
  minRole: AdminRole = 'author'
): Promise<AdminGuardFailure | AdminGuardSuccess> {
  // A write never answers from cache: each serverless instance holds its own map, so only the
  // backend knows a session was just revoked.
  const method = (request.method ?? 'GET').toUpperCase();
  const writes = method !== 'GET' && method !== 'HEAD';
  const identity = await resolveAdminIdentity(request, { revalidate: writes });

  if (!identity) {
    return {
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
      identity: null,
    };
  }
  if (identity.mustChangePassword) {
    return {
      response: Response.json(
        { error: 'This account must choose a new password first' },
        { status: 403 }
      ),
      identity: null,
    };
  }
  if (!roleAtLeast(identity.role, minRole)) {
    return {
      response: Response.json(
        { error: `This action needs the "${minRole}" role or above` },
        { status: 403 }
      ),
      identity: null,
    };
  }

  return { response: null, identity };
}

/** The `Set-Cookie` attributes a session cookie is written with. */
export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/** The one-line form of {@link requireAdmin}, for handlers that need no identity. */
export async function denyUnlessAdmin(
  request: Request,
  minRole: AdminRole = 'author'
): Promise<Response | null> {
  const { response } = await requireAdmin(request, minRole);
  return response;
}
