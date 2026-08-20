/**
 * The path guard for `/api/admin/[...path]`.
 *
 * Pure, and in its own file so it can be tested without a running Next: this is
 * the check that decides which upstream URL an unauthenticated request can
 * reach, and it was wrong in a way no type or lint rule can catch.
 *
 * The version it replaces rejected an empty, `.` or `..` segment on the
 * assumption that "Next decodes route params, so `%2e%2e` arrives as `..`".
 * True, and not the problem. Next's route matcher splits the raw pathname on
 * `/` and percent-decodes each piece **afterwards**, so `%2F` is not a
 * separator while the route is matched and arrives inside a single segment —
 * where `new URL()` then normalises it into one. `auth%2F..%2F..%2Fparks`
 * passed all three checks and resolved to `https://api.park.fan/v1/parks`,
 * which turned this handler into an anonymous proxy to every path on the API,
 * with the deployment's `x-auth-key` (a throttle bypass) attached.
 *
 * `%5C` did the same: WHATWG URL treats a backslash as a separator for special
 * schemes, and Next's own backslash normalisation tests the raw URL, which a
 * percent-encoded one does not match.
 *
 * So: check the decoded segment for anything that could become a separator or
 * start a query, and re-encode when joining.
 */

const UNSAFE_IN_SEGMENT = /[/\\?#]/;

export function isSafeSegment(segment: string): boolean {
  return (
    segment.length > 0 && segment !== '.' && segment !== '..' && !UNSAFE_IN_SEGMENT.test(segment)
  );
}

/** `['content', 'parks', '<id>'] → 'content/parks/<id>'`, or null if unsafe. */
export function adminProxyPath(segments: string[]): string | null {
  if (segments.length === 0) return null;
  if (!segments.every(isSafeSegment)) return null;
  return segments.map(encodeURIComponent).join('/');
}
