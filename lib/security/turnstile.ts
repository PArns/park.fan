import 'server-only';
import type { TurnstileAction } from './turnstile-actions';

/**
 * Server-side Cloudflare Turnstile verification for the contribution upload and the admin login,
 * where it runs before the credentials reach the backend, so credential stuffing never triggers
 * the account lockout. `success: true` is not enough: the token's `action` must match the form it
 * was solved on (or the open upload form would vend tokens for the login), and its `hostname`
 * must be in `TURNSTILE_HOSTNAMES` (comma-separated). See
 * docs/rules/the-admin-holds-no-credential.md.
 *
 * Without `TURNSTILE_SECRET_KEY` verification is skipped in development and fails in production.
 * An empty `TURNSTILE_HOSTNAMES` only skips the hostname check, with a warning, so an unset
 * variable cannot lock everybody out of the admin.
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

/** Verifies a Turnstile token for the form it was solved on; a failure carries a reason to log. */
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
