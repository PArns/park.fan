import 'server-only';

/**
 * Server-side Cloudflare Turnstile verification.
 *
 * The browser solves the Turnstile challenge and sends us the resulting token; we
 * then call Cloudflare's `siteverify` endpoint with our SECRET key to confirm it.
 * This is what stops drive-by bots from spamming an endpoint that is expensive,
 * or — in the admin's case — worth guessing at.
 *
 * Two callers, and they want the same thing for different reasons:
 *  - `/api/contribute/start` — an upload form open to anybody, so the cost of a
 *    bot is storage and a moderation queue full of junk.
 *  - `/api/admin/session` — the login. Here the challenge is solved **before**
 *    the credentials are forwarded to api.park.fan at all, so a credential-
 *    stuffing run never reaches the backend's own limiter and never counts
 *    against the lockout of the account it is guessing at. That last part is
 *    the point: a per-account lockout is a denial of service against the
 *    account holder if anyone can trigger it at will.
 *
 * Env:
 *  - TURNSTILE_SECRET_KEY  (server-only) — your Turnstile widget's secret.
 *
 * Dev fallback: if no secret is configured we skip verification (and log a warning)
 * so the prototype runs locally without a Cloudflare account. In production
 * (NODE_ENV=production) a missing secret is treated as a hard failure — we never
 * silently accept unverified requests on the live site.
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileResult {
  success: boolean;
  /** Present when success=false: a short reason for logging/telemetry. */
  reason?: string;
}

export async function verifyTurnstile(token: string, remoteIp?: string): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[turnstile] TURNSTILE_SECRET_KEY is not set — rejecting request in production.'
      );
      return { success: false, reason: 'not-configured' };
    }
    console.warn('[turnstile] TURNSTILE_SECRET_KEY not set — skipping verification (dev only).');
    return { success: true };
  }

  if (!token) return { success: false, reason: 'missing-token' };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.append('remoteip', remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      // siteverify is fast; never cache it.
      cache: 'no-store',
    });
    const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
    if (data.success) return { success: true };
    return { success: false, reason: (data['error-codes'] ?? ['failed']).join(',') };
  } catch (err) {
    console.error('[turnstile] siteverify request failed:', err);
    return { success: false, reason: 'network-error' };
  }
}
