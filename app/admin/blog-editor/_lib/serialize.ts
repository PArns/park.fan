import matter from 'gray-matter';
import type { BlogFrontmatter } from '@/lib/blog/types';

/**
 * Combine frontmatter (YAML) and markdown body into the final `.md` file content.
 * Uses gray-matter's `stringify` so the YAML formatting matches the rest of the
 * blog content (consistent quoting, no ad-hoc dumper).
 */
export function buildPostFile(fm: BlogFrontmatter, body: string): string {
  // gray-matter prepends/appends its own newlines; trim body so we don't double them.
  return matter.stringify(body.trim() + '\n', fm as unknown as Record<string, unknown>);
}
