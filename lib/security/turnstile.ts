import 'server-only';
import type { TurnstileAction } from './turnstile-actions';

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
 * `success: true` is not the whole answer, and treating it as one was the gap.
 * Cloudflare will happily confirm a token that is genuine and meant for
 * something else, so two more fields have to match:
 *
 *  - **action** — the label the widget was rendered with. Without it a token
 *    solved on the open upload form is a valid token for the admin login, and
 *    `/contribute` is a challenge anybody may solve as often as they like.
 *    Each call site names the action it expects; there is no default, because a
 *    default is what a new call site would silently inherit.
 *  - **hostname** — where the widget was solved. This is what stops a token
 *    farmed on a copy of the login page hosted somewhere else from being spent
 *    here. Checked against `TURNSTILE_HOSTNAMES`.
 *
 * Env:
 *  - TURNSTILE_SECRET_KEY  (server-only) — your Turnstile widget's secret.
 *  - TURNSTILE_HOSTNAMES   (server-only) — comma-separated allowlist, e.g.
 *    `park.fan,www.park.fan`. Preview deployments need their host too.
 *
 * Dev fallback: if no secret is configured we skip verification (and log a warning)
 * so the prototype runs locally without a Cloudflare account. In production
 * (NODE_ENV=production) a missing secret is treated as a hard failure — we never
 * silently accept unverified requests on the live site.
 *
 * `TURNSTILE_HOSTNAMES` deliberately does **not** work that way. Cloudflare's
 * own snippet refuses everything when the allowlist is empty, which is right
 * for a fresh integration where setting it is part of the same task, and wrong
 * here: an unset variable would take the upload form and the admin login down
 * on the deploy that shipped this, with no way in to fix it. An empty allowlist
 * skips the hostname check and says so in the log. The secret is what may not
 * be missing.
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** A Turnstile token is a few hundred bytes; anything of this size is not one. */
const MAX_TOKEN_LENGTH = 2048;

export interface TurnstileResult {
  success: boolean;
  /** Present when success=false: a short reason for logging/telemetry. */
  reason?: string;
}

export interface TurnstileCheck {
  /**
   * The `action` the widget was rendered with. Required, and named at the call
   * site rather than defaulted: a token is only for the form it was solved on.
   */
  expectedAction: TurnstileAction;
  /** The solver's address, so Cloudflare can weigh it. */
  remoteIp?: string;
}

/** The hosts a token may have been solved on. Empty ⇒ the check is skipped. */
function allowedHostnames(): Set<string> {
  return new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? '')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function verifyTurnstile(
  token: string,
  { expectedAction, remoteIp }: TurnstileCheck
): Promise<TurnstileResult> {
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
  // Before the network call, so an oversized body is rejected here rather than
  // forwarded to Cloudflare on our budget.
  if (token.length > MAX_TOKEN_LENGTH) return { success: false, reason: 'token-too-long' };

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
    const data = (await res.json()) as {
      success: boolean;
      action?: string;
      hostname?: string;
      'error-codes'?: string[];
    };

    if (!data.success) {
      return { success: false, reason: (data['error-codes'] ?? ['failed']).join(',') };
    }

    // Genuine, and for something else. `/contribute` is a challenge anybody may
    // solve as often as they like, so without this the upload form is a token
    // vending machine for the admin login.
    if (data.action !== expectedAction) {
      console.warn(
        `[turnstile] token action "${data.action ?? ''}" does not match "${expectedAction}"`
      );
      return { success: false, reason: 'action-mismatch' };
    }

    const hostnames = allowedHostnames();
    if (hostnames.size === 0) {
      if (process.env.NODE_ENV === 'production') {
        console.warn(
          '[turnstile] TURNSTILE_HOSTNAMES is not set — accepting a token solved on any host.'
        );
      }
    } else if (!hostnames.has((data.hostname ?? '').toLowerCase())) {
      console.warn(`[turnstile] token hostname "${data.hostname ?? ''}" is not allowed`);
      return { success: false, reason: 'hostname-mismatch' };
    }

    return { success: true };
  } catch (err) {
    console.error('[turnstile] siteverify request failed:', err);
    return { success: false, reason: 'network-error' };
  }
}
