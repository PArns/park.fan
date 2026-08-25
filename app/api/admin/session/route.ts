import 'server-only';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerApiHeaders } from '@/lib/api/client';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { TURNSTILE_ACTIONS } from '@/lib/security/turnstile-actions';
import { getClientIp } from '@/lib/utils/request-ip';
import {
  ADMIN_SESSION_COOKIE,
  forgetSession,
  readSessionToken,
  resolveAdminIdentity,
  sessionCookieOptions,
} from '@/lib/admin/session';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.park.fan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The admin's session, as this app holds it.
 *
 * The browser never sees the token. It posts credentials here, this handler
 * exchanges them with api.park.fan, and the opaque session token comes back
 * into an httpOnly cookie — so the credential that unlocks every
 * administrative endpoint is unreadable to any script running on this origin.
 * That is the whole reason this endpoint exists rather than the admin talking
 * to the API directly.
 *
 * `x-forwarded-for` is forwarded deliberately. The backend's login limiter
 * counts failures per address, and without it every attempt in the world would
 * arrive from this deployment's address and share one bucket: a spray across
 * many accounts would be invisible, and the first person to mistype their
 * password would exhaust the bucket for everyone.
 *
 * A Turnstile token is checked **first**, before the credentials go anywhere —
 * the same challenge `/contribute` already uses, and the same secret. Verifying
 * before the forward rather than after is the whole value: the two defences
 * behind this (the per-address throttle and the per-account lockout) only start
 * counting once an attempt has been made, and the lockout in particular is a
 * denial of service against the account holder for anyone who can spend their
 * five attempts at will. Turnstile is what makes spending them cost something.
 *
 * A token is single-use, so an account with a second factor solves twice: once
 * for the password and once for the code. The form resets its widget after
 * every attempt (`components/common/turnstile-widget.tsx`) instead of replaying
 * a token Cloudflare has already retired.
 */

interface LoginBody {
  email?: string;
  password?: string;
  totpCode?: string;
  turnstileToken?: string;
}

/**
 * The administrator's own address.
 *
 * Through `getClientIp`, not by reading `x-forwarded-for` here: park.fan is
 * served Cloudflare → Vercel, and Vercel sets `x-forwarded-for` to the peer
 * that opened the connection to it, which is a Cloudflare edge server. Reading
 * it directly forwarded a datacenter address as the admin's, so the backend's
 * per-address login limiter had one bucket for everybody and the "where am I
 * signed in" list named a colo instead of a place.
 */
function clientIp(request: Request): string | null {
  return getClientIp(request) || null;
}

/**
 * Who is signed in. 401 when nobody is, 503 when we cannot find out.
 *
 * The admin polls this on every load and on every window focus, and the shell
 * used to drop straight to the login screen on any error — so a five-second
 * API hiccup unmounted the whole editor, with whatever was typed in it. A 503
 * is not a logout and the client treats it as one.
 */
export async function GET(request: Request) {
  let identity: Awaited<ReturnType<typeof resolveAdminIdentity>>;
  try {
    // Always from the backend, never from the minute-long identity cache. This
    // route is what the shell believes about the signed-in account — its role,
    // its password debt, whether two-factor is on — and it is re-read exactly
    // when something has just changed one of them. Clearing the cache on the
    // writing request only helps the instance that served it; asking again here
    // is what makes the answer true on all of them. The cache still does its
    // job in front of the proxy, where it saves an `auth/me` per admin call.
    identity = await resolveAdminIdentity(request, {
      strict: true,
      revalidate: true,
    });
  } catch {
    return NextResponse.json(
      { error: 'Admin backend unreachable' },
      { status: 503, headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    );
  }
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(identity, {
    headers: { 'Cache-Control': 'no-store, must-revalidate' },
  });
}

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: 'Malformed request' }, { status: 400 });
  }

  const ip = clientIp(request);

  // Before anything else, and before the credentials leave this process.
  const turnstile = await verifyTurnstile(String(body.turnstileToken ?? ''), {
    expectedAction: TURNSTILE_ACTIONS.adminLogin,
    remoteIp: ip ?? undefined,
  });
  if (!turnstile.success) {
    // A sentence rather than a code: the form prints `message` verbatim for
    // anything that is not a 401, and "turnstile-failed" is not something to
    // put in front of somebody who is trying to sign in. The reason stays in
    // the payload for the network tab.
    return NextResponse.json(
      {
        error: 'turnstile-failed',
        reason: turnstile.reason,
        message: 'Die Sicherheitsprüfung ist fehlgeschlagen. Bitte erneut versuchen.',
      },
      { status: 403, headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    );
  }

  // `getServerApiHeaders()` sets `User-Agent`; the browser's goes in the same
  // slot. Left as two differently-cased keys they both survive into the Headers
  // object, which appends rather than replaces — the backend then stored
  // "park.fan/<sha> (+https://park.fan; production), Mozilla/5.0 (…)" as the
  // device name, and the part that tells two laptops apart was pushed past the
  // truncation in the session list.
  const serverHeaders = { ...getServerApiHeaders() };
  delete serverHeaders['User-Agent'];

  const upstream = await fetch(`${API_BASE}/v1/admin/auth/login`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...serverHeaders,
      ...(ip ? { 'x-forwarded-for': ip } : {}),
      // The backend records this on the session so "where am I signed in"
      // can name the device. Truncated there, not here.
      'user-agent': request.headers.get('user-agent') ?? 'park.fan-admin',
    },
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      ...(body.totpCode ? { totpCode: body.totpCode } : {}),
    }),
  });

  if (!upstream.ok) {
    // Pass the status through unchanged — 401 and 429 mean different things to
    // the login form, and flattening them into one would cost the person at
    // the keyboard the only clue about why waiting would help.
    const detail = await upstream.json().catch(() => ({}));
    return NextResponse.json(
      { error: (detail as { message?: string }).message ?? 'Invalid credentials' },
      { status: upstream.status }
    );
  }

  const result = (await upstream.json()) as
    | { status: 'ok'; token: string; expiresAt: string; user: unknown }
    | { status: 'totp-required' }
    | { status: 'locked' | 'rate-limited'; retryAfterSeconds: number };

  if (result.status !== 'ok') {
    // 200 with a status the form acts on: a second factor is not a failure,
    // and a lockout is a fact the form has to be able to display with its
    // countdown rather than a bare 401.
    return NextResponse.json(result, { status: 200 });
  }

  const expiresIn = Math.max(
    60,
    Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000)
  );

  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, result.token, sessionCookieOptions(expiresIn));

  return NextResponse.json(
    { status: 'ok', user: result.user, expiresAt: result.expiresAt },
    { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
  );
}

/** Sign out: revoke upstream, then drop the cookie whatever upstream said. */
export async function DELETE(request: Request) {
  const token = await readSessionToken(request);

  if (token) {
    // Best effort. A backend that cannot be reached must not leave somebody
    // stuck in a session they asked to end — the cookie goes either way, and
    // the server-side session expires on its own.
    await fetch(`${API_BASE}/v1/admin/auth/logout`, {
      method: 'POST',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, ...getServerApiHeaders() },
    }).catch(() => undefined);
    forgetSession(token);
  }

  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);

  return new NextResponse(null, { status: 204 });
}
