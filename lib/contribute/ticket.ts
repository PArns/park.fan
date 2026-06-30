import 'server-only';
import type { TicketPayload } from './types';

/**
 * HMAC-signed upload tickets.
 *
 * The browser can't be trusted to upload straight to Blob unsupervised, but we also
 * don't want to re-solve a Turnstile challenge for every file. So `/api/contribute/start`
 * verifies Turnstile ONCE and mints a short-lived, signed ticket describing what the
 * user is allowed to do (which submission folder, which assignment, how many files).
 * That ticket is then presented when authorizing each Blob upload and when finalizing
 * — the HMAC means the client can't change the assignment or inflate the file budget.
 *
 * Secret: `CONTRIBUTE_TICKET_SECRET`, falling back to the Blob token (already a
 * server-only secret present in prod). A constant dev secret keeps local dev working.
 */

const TTL_MS = 15 * 60_000; // 15 minutes — enough to upload a batch.

function secretKey(): Promise<CryptoKey> {
  const secret =
    process.env.CONTRIBUTE_TICKET_SECRET ||
    process.env.BLOB_READ_WRITE_TOKEN ||
    'dev-insecure-contribute-secret';
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signTicket(
  payload: Omit<TicketPayload, 'exp'>,
  ttlMs = TTL_MS
): Promise<string> {
  const full: TicketPayload = { ...payload, exp: Date.now() + ttlMs };
  const body = Buffer.from(JSON.stringify(full)).toString('base64url');
  const sig = await crypto.subtle.sign('HMAC', await secretKey(), new TextEncoder().encode(body));
  return `${body}.${Buffer.from(sig).toString('base64url')}`;
}

export async function verifyTicket(
  token: string | null | undefined
): Promise<TicketPayload | null> {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify(
      'HMAC',
      await secretKey(),
      Buffer.from(sig, 'base64url'),
      new TextEncoder().encode(body)
    );
    if (!ok) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TicketPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
