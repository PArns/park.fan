import 'server-only';
import { cookies } from 'next/headers';
import { getServerApiHeaders } from '@/lib/api/client';
import { readCookie } from './cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.park.fan';

/**
 * The admin session cookie.
 *
 * httpOnly, so no script in the browser can read it — which is the point. The
 * previous admin kept a shared password in `sessionStorage` and attached it to
 * every request from client code, meaning any injected script on the admin
 * origin could read the one credential that unlocks every administrative
 * endpoint. The token now never reaches JavaScript at all: the browser sends
 * the cookie, this app's own route handlers read it server-side and forward it
 * to api.park.fan as a Bearer token.
 *
 * `SameSite=Strict` rather than Lax: the admin has no cross-site entry point
 * worth preserving — nobody links into it from anywhere — and Strict is the
 * one setting under which a cross-site request cannot carry it at all.
 */
export const ADMIN_SESSION_COOKIE = 'parkfan_admin_session';

/** Roles, most privileged first. Mirrors the backend's `ADMIN_ROLES`. */
export const ADMIN_ROLES = ['owner', 'editor', 'author', 'viewer'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

const ROLE_RANK: Record<AdminRole, number> = {
  owner: 30,
  editor: 20,
  author: 10,
  viewer: 0,
};

export function roleAtLeast(role: AdminRole, minimum: AdminRole): boolean {
  return (ROLE_RANK[role] ?? -1) >= ROLE_RANK[minimum];
}

export interface AdminIdentity {
  id: string | null;
  email: string;
  displayName: string;
  role: AdminRole;
  legacy: boolean;
  mustChangePassword: boolean;
  totpEnabled: boolean;
}

/**
 * Validated identities, briefly.
 *
 * Every admin request that reaches this app's own routes — the media upload,
 * the blog save, an image served to an `<img>` tag — would otherwise ask the
 * backend who the caller is before doing anything. A media commit alone makes
 * several of those in a row. The window is short because the backend can
 * revoke a session at any moment and this cache is what would keep a revoked
 * one alive.
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
 * Who this request is, according to the backend.
 *
 * Returns null for absent, expired and revoked alike — the caller must not be
 * able to tell those apart, and does not need to.
 */
export class AdminBackendUnreachable extends Error {}

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
    response = await fetch(`${API_BASE}/v1/admin/auth/me`, {
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
 * Drop every cached identity.
 *
 * For the revocations that do not name a token this process can see: a password
 * change ends every session of the account, "sign out everywhere" ends a list
 * of them, deactivating an account ends all of its. The map is a handful of
 * entries and refilling costs one `auth/me` per token, so clearing all of it is
 * cheaper than tracking which ones died.
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
 * Guard for this app's own admin route handlers.
 *
 * Returns a ready-to-return response on failure and the identity on success,
 * so a handler reads as `const { response, identity } = await requireAdmin(req);
 * if (response) return response;`.
 *
 * `minRole` defaults to `author` rather than `viewer`, because every route in
 * this app that uses this guard writes something — media, blog posts,
 * contributions. A read-only account has no business in any of them, and
 * defaulting to the weakest role would let one in by omission.
 */
export async function requireAdmin(
  request: Request,
  minRole: AdminRole = 'author'
): Promise<AdminGuardFailure | AdminGuardSuccess> {
  // A write never answers from cache. The cache exists so a page that makes
  // six read calls does not make six `auth/me` calls behind them; a media
  // commit or a blog save is rare, already costs several round trips, and is
  // exactly what somebody revoking a session is trying to stop. Clearing the
  // map on the revoking request is not enough on its own — each serverless
  // instance holds its own — so the guard asks the backend instead.
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

/**
 * Call an admin endpoint on api.park.fan as the current session.
 *
 * The one place the cookie is turned into a Bearer token. Nothing else in this
 * app should read the cookie and build that header, or the day the transport
 * changes there will be three places to find.
 */
export async function adminApiFetch(
  path: string,
  init: RequestInit & { token?: string | null } = {}
): Promise<Response> {
  const { token: explicitToken, ...rest } = init;
  const token = explicitToken ?? (await readSessionToken());
  const url = path.startsWith('http') ? path : `${API_BASE}/v1/admin/${path.replace(/^\/+/, '')}`;

  return fetch(url, {
    ...rest,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...getServerApiHeaders(),
      ...(rest.headers as Record<string, string> | undefined),
    },
  });
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

/**
 * The one-liner form of {@link requireAdmin}, for handlers that need the guard
 * but not the identity: `const denied = await denyUnlessAdmin(req); if (denied)
 * return denied;`
 *
 * It exists because that is the shape the fifteen existing admin route
 * handlers already use, and changing all of them to destructure a pair while
 * also changing what they authenticate against would have made one diff out of
 * two unrelated changes.
 */
export async function denyUnlessAdmin(
  request: Request,
  minRole: AdminRole = 'author'
): Promise<Response | null> {
  const { response } = await requireAdmin(request, minRole);
  return response;
}
