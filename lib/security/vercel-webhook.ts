import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Whether `signature` is Vercel's `x-vercel-signature` for `rawBody`: the hex HMAC-SHA1 of the raw
 * body under the webhook's secret. It has to be the text as received, because re-serialised JSON
 * no longer hashes to what Vercel signed. The comparison takes the same time however much of the
 * signature a guess gets right.
 */
export function vercelSignatureValid(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const sent = Buffer.from(signature);
  const expected = Buffer.from(createHmac('sha1', secret).update(rawBody).digest('hex'));
  return sent.length === expected.length && timingSafeEqual(sent, expected);
}
