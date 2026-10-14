import { locales, SITE_URL, type Locale } from '@/i18n/config';

/**
 * Pagination for the blog and news listings. Page 1 is the listing's own URL, every later page
 * `<listing>/page/<n>`: a path and not `?page=`, because a query parameter would render the
 * static listings per request, and because each page has to be a URL with its own canonical that
 * a crawler reaches through a plain link (Google neither scrolls nor presses "load more").
 * Client-safe: no manifest import.
 */

/** Posts per listing page, on the blog and the news alike. */
export const POSTS_PER_PAGE = 20;

/** The path segment in front of the page number. */
const PAGE_SEGMENT = 'page';

/** How many pages a listing of `total` posts has. An empty listing still has its first page. */
export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
}

/** Whether a listing of `total` posts has a page `page`. An empty listing has none at all. */
export function hasPage(total: number, page: number): boolean {
  return total > 0 && Number.isInteger(page) && page >= 1 && page <= pageCount(total);
}

/** One page of a listing: its posts, its number and how many pages the listing has. */
export interface ListingPage<T> {
  items: T[];
  page: number;
  pageCount: number;
}

/** Page `page` of `items`, or `null` when the listing has no such page (the route 404s). */
export function paginate<T>(items: readonly T[], page: number): ListingPage<T> | null {
  const count = pageCount(items.length);
  if (!Number.isInteger(page) || page < 1 || page > count) return null;
  const start = (page - 1) * POSTS_PER_PAGE;
  return { items: items.slice(start, start + POSTS_PER_PAGE), page, pageCount: count };
}

/** Locale-relative path of page `page` of the listing at `base`: `base` itself for page 1. */
export function pagedPath(base: string, page: number): string {
  return page > 1 ? `${base}/${PAGE_SEGMENT}/${page}` : base;
}

/**
 * The page number in a `[n]` route segment, or `null` for anything a listing does not link: page 1
 * lives at the listing's own URL, so `/page/1`, `/page/02` and `/page/x` are not pages.
 */
export function parsePageNumber(segment: string | undefined): number | null {
  if (!segment || !/^[1-9]\d*$/.test(segment)) return null;
  const page = Number(segment);
  return page >= 2 ? page : null;
}

/** The page numbers after the first of a listing of `total` posts, for `generateStaticParams`. */
export function laterPageNumbers(total: number): number[] {
  return Array.from({ length: pageCount(total) - 1 }, (_, i) => i + 2);
}

/**
 * Splits a catch-all route's segments into the listing's own segments and the page number, for
 * the category route, where `/page/<n>` can only arrive as the last two segments of `[...path]`.
 * `null` when the tail names a page the listing does not link.
 */
export function splitPageSegments(segments: string[]): { segments: string[]; page: number } | null {
  if (segments.length < 3 || segments[segments.length - 2] !== PAGE_SEGMENT) {
    return { segments, page: 1 };
  }
  const page = parsePageNumber(segments[segments.length - 1]);
  return page ? { segments: segments.slice(0, -2), page } : null;
}

/** `segments` plus the `/page/<n>` tail for page `page`, the inverse of {@link splitPageSegments}. */
export function pagedSegments(segments: string[], page: number): string[] {
  return page > 1 ? [...segments, PAGE_SEGMENT, String(page)] : segments;
}

/**
 * The hreflang map of one listing page: every locale for which `pathFor` names a path, absolute,
 * plus `x-default` on the English one. A later page exists only where the locale's listing is long
 * enough, so `pathFor` returns `null` where it is not.
 */
export function listingAlternates(
  pathFor: (locale: Locale) => string | null
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    const path = pathFor(locale);
    if (path) languages[locale] = `${SITE_URL}/${locale}${path}`;
  }
  if (languages.en) languages['x-default'] = languages.en;
  return languages;
}

/**
 * The page numbers a pagination row shows: every page up to seven, else the first, the last and
 * the current page with its neighbours, `null` where a run of two or more is left out. A gap of
 * one page shows that page, since an ellipsis would take the same room.
 */
export function pageWindow(page: number, count: number): Array<number | null> {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const shown = [...new Set([1, page - 1, page, page + 1, count])]
    .filter((p) => p >= 1 && p <= count)
    .sort((a, b) => a - b);
  const out: Array<number | null> = [];
  let last = 0;
  for (const p of shown) {
    if (p - last === 2) out.push(last + 1);
    else if (p - last > 2) out.push(null);
    out.push(p);
    last = p;
  }
  return out;
}

/** A listing's title on page `page`: page 1 keeps it, a later page adds its number. */
export function pagedTitle(title: string, page: number, pageLabel: string): string {
  return page > 1 ? `${title} – ${pageLabel}` : title;
}
