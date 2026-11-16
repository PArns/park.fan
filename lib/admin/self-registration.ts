import 'server-only';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import { verifyTurnstile } from '@/lib/security/turnstile';
import type { TurnstileAction } from '@/lib/security/turnstile-actions';
import { getClientIp } from '@/lib/utils/request-ip';
import { ADMIN_SESSION_COOKIE, sessionCookieOptions, setSessionMarkers } from '@/lib/admin/session';
import type { AdminRole } from '@/lib/admin/roles';
import { NO_STORE } from '@/lib/api/cdn-cache-headers';

interface RegisterBody {
  email?: string;
  displayName?: string;
  password?: string;
  turnstileToken?: string;
}

/** Where an account somebody opens for themselves is created. */
export interface SelfRegistration {
  /** The API's route: `/v1/developer/register` or `/v1/account/register`. */
  apiPath: string;
  turnstileAction: TurnstileAction;
  /** The role the API gives the account, which decides the markers (`setSessionMarkers`). */
  role: Extract<AdminRole, 'developer' | 'user'>;
}

/**
 * A registration route's whole work, for the developer portal and for visitors alike: Turnstile
 * before the address and password go anywhere, the API creates the account and signs it in, and
 * the token goes into the same httpOnly cookie the admin's login writes. No admin marker: that one
 * tells public pages to ask the admin for its figures, which neither kind of account may read.
 */
export async function handleSelfRegistration(
  request: Request,
  { apiPath, turnstileAction, role }: SelfRegistration
): Promise<NextResponse> {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: 'invalid-form' }, { status: 400, headers: NO_STORE });
  }

  const ip = getClientIp(request) || null;
  const turnstile = await verifyTurnstile(String(body.turnstileToken ?? ''), {
    expectedAction: turnstileAction,
    remoteIp: ip ?? undefined,
  });
  if (!turnstile.success) {
    return NextResponse.json({ error: 'turnstile-failed' }, { status: 403, headers: NO_STORE });
  }

  const serverHeaders = { ...getServerApiHeaders() };
  delete serverHeaders['User-Agent'];
  const upstream = await fetch(`${getApiBaseUrl()}${apiPath}`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...serverHeaders,
      ...(ip ? { 'x-forwarded-for': ip } : {}),
      'user-agent': request.headers.get('user-agent') ?? 'park.fan',
    },
    body: JSON.stringify({
      email: body.email,
      displayName: body.displayName,
      password: body.password,
    }),
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ error: 'network' }, { status: 502, headers: NO_STORE });
  }
  if (!upstream.ok) {
    const detail = (await upstream.json().catch(() => ({}))) as { message?: string | string[] };
    const error =
      upstream.status === 409
        ? 'account-exists'
        : upstream.status === 400
          ? 'invalid-form'
          : upstream.status === 429
            ? 'rate-limited'
            : 'generic';
    return NextResponse.json(
      { error, message: detail.message },
      { status: upstream.status, headers: NO_STORE }
    );
  }

  const result = (await upstream.json()) as { token: string; expiresAt: string; user: unknown };
  const maxAge = Math.max(60, Math.floor((Date.parse(result.expiresAt) - Date.now()) / 1000));
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, result.token, sessionCookieOptions(maxAge));
  setSessionMarkers(store, role, maxAge);
  return NextResponse.json({ status: 'ok', user: result.user }, { headers: NO_STORE });
}
