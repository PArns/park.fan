import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Whether `signature` is Vercel's `x-vercel-signature` for `rawBody`: the hex HMAC-SHA1 of the
 * body under the webhook's secret. Pass the body text, never re-serialised JSON, which no longer
 * hashes to what Vercel signed. An empty secret refuses everything, because anybody can sign with
 * it. The comparison takes the same time however much of the signature a guess gets right.
 */
export function vercelSignatureValid(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  const sent = Buffer.from(signature);
  const expected = Buffer.from(createHmac('sha1', secret).update(rawBody).digest('hex'));
  return sent.length === expected.length && timingSafeEqual(sent, expected);
}
