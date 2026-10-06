import 'server-only';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The admin's session: credentials posted here are exchanged with api.park.fan, and the token
 * comes back in an httpOnly cookie that no script on this origin can read. The client address is
 * forwarded so the backend's per-address login limiter does not put every attempt in one bucket.
 * Turnstile is checked first, before the credentials go anywhere, because the throttle and the
 * per-account lockout only count attempts already made. See
 * docs/rules/the-admin-holds-no-credential.md.
 */

interface LoginBody {
  email?: string;
  password?: string;
  totpCode?: string;
  turnstileToken?: string;
}

/**
 * The administrator's own address, through `getClientIp`: behind Cloudflare, Vercel's
 * `x-forwarded-for` names a Cloudflare edge, which would give every admin one limiter bucket.
 */
function clientIp(request: Request): string | null {
  return getClientIp(request) || null;
}

/**
 * Who is signed in: 401 when nobody is, 503 when we cannot find out, so an API hiccup does not
 * read as a logout and unmount the editor.
 */
export async function GET(request: Request) {
  let identity: Awaited<ReturnType<typeof resolveAdminIdentity>>;
  try {
    // Always from the backend, never the identity cache: the shell re-reads this right after
    // something changed the account, and only asking again makes the answer true on every instance.
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
    // A sentence rather than a code: the form prints `message` verbatim for anything but a 401.
    // The reason stays in the payload for the network tab.
    return NextResponse.json(
      {
        error: 'turnstile-failed',
        reason: turnstile.reason,
        message: 'Die Sicherheitsprüfung ist fehlgeschlagen. Bitte erneut versuchen.',
      },
      { status: 403, headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    );
  }

  // Both sides set `User-Agent`, and two differently-cased keys would both survive and be
  // appended, pushing the browser's part past the truncation in the session list.
  const serverHeaders = { ...getServerApiHeaders() };
  delete serverHeaders['User-Agent'];

  const upstream = await fetch(`${getApiBaseUrl()}/v1/admin/auth/login`, {
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
    // The status passes through unchanged: 401 and 429 mean different things to the login form.
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
    await fetch(`${getApiBaseUrl()}/v1/admin/auth/logout`, {
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
