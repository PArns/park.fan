import { isValidLocale } from '@/i18n/config';

/**
 * The values that carry a preselected park or ride to /contribute, in the order a link writes
 * them: the `AssignedEntity` field each fills, and its key in the link. Kept apart from the schema
 * so the proxy reads it without zod.
 */
export const CONTRIBUTE_PREFILL_FIELDS = [
  ['type', 'type'],
  ['id', 'id'],
  ['name', 'name'],
  ['slug', 'slug'],
  ['url', 'url'],
  ['country', 'country'],
  ['parentParkName', 'parent'],
] as const;

/**
 * Where a contribute link with the park or ride in its query goes (`/de/contribute?type=park&id=…`):
 * the same page with the values in the fragment. A query makes one URL per park and ride for a
 * crawler, all of them the same form; a fragment is never sent, so the page is one URL per
 * language. `null` for any other path, and for a query without `type` and `id`.
 */
export function contributeQueryRedirect(pathname: string, search: URLSearchParams): string | null {
  const match = /^\/([a-z]{2})\/contribute$/.exec(pathname);
  if (!match || !isValidLocale(match[1])) return null;
  if (!search.get('type') || !search.get('id')) return null;
  const fragment = new URLSearchParams();
  for (const [, key] of CONTRIBUTE_PREFILL_FIELDS) {
    const value = search.get(key);
    if (value) fragment.set(key, value);
  }
  return `${pathname}#${fragment}`;
}
