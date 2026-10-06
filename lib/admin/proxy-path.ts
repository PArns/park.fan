/**
 * The path guard for `/api/admin/[...path]`, pure so it can be tested without Next. Next decodes
 * each route segment after splitting, so a `%2F` or `%5C` arrives inside one segment and
 * `new URL()` would turn it into a separator, reaching any API path with the deployment's
 * `x-auth-key`. So the decoded segment is checked, and re-encoded on the join. See
 * docs/rules/an-api-route-passes-only-slugs-upstream.md.
 */

const UNSAFE_IN_SEGMENT = /[/\\?#]/;

/**
 * Returns false for an empty, `.` or `..` segment, or one holding a decoded `/`, `\`, `?` or `#`
 * that could move the upstream admin URL.
 */
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
