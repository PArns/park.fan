import { SLUG_RE } from '@/lib/media/sidecar.mjs';

/**
 * The four slugs of a park's geo path, as an admin route takes it in `?path=`, or null when it is
 * not four slugs. `/v1/parks/a/b/c/d`, `/parks/a/b/c/d` and `a/b/c/d` all name the same park.
 */
export function parkGeoSegments(raw: string | null): string[] | null {
  if (!raw) return null;
  const parts = raw
    .replace(/^\/?(?:v1\/)?parks\//, '')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (parts.length !== 4) return null;
  if (parts.some((segment) => !SLUG_RE.test(segment))) return null;
  return parts;
}
