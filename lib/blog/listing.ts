import 'server-only';
import { locales, defaultLocale, SITE_URL, type Locale } from '@/i18n/config';
import type { BlogFrontmatter, BlogListItem } from './types';
import { BLOG_POSTS_META } from './manifest';

/**
 * Everything a blog LISTING needs — cards, feeds, hreflang, the nav gate, the
 * park pages' backlinks — resolved from the frontmatter-only manifest.
 *
 * Split out of `./index` on purpose: the post bodies are ~900 KB and grow with
 * every article, and the root layout alone (`hasPublishedPosts`) would drag all
 * of them into every route's server bundle. Only the post page itself imports
 * `./index`, which is where the markdown lives.
 *
 * ## Memoised per process, not per request
 *
 * Every function here derives from the generated manifest and reads no clock,
 * no cookie and no request state, so its result is fixed for the lifetime of
 * the deployment. React's `cache()` would rebuild all of it on every request —
 * which the root layout, the homepage and (since the blog section) every
 * `force-dynamic` park page would pay for, on the highest-cardinality routes on
 * the site. Module-level memos survive across requests in the same instance
 * instead, so the second render onwards is a Map lookup.
 *
 * The returned lists are FROZEN: callers share one array, and an in-place
 * `sort()`/`push()` would corrupt it for every later request rather than for
 * one render. Copy first (`[...posts]`, `.filter()`, `.slice()`) — every
 * current caller already does.
 */

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug);
}

function getTranslationKey(slug: string, fm: BlogFrontmatter): string {
  return fm.translationKey?.trim() || slug;
}

/**
 * One post in one locale, without its body. The manifest's `parkRefs`/`rideRefs`
 * are deliberately NOT carried here — only `./backlinks` reads them, straight
 * off `BLOG_POSTS_META`.
 */
export interface MetaEntry {
  slug: string;
  fm: BlogFrontmatter;
  readingTimeMinutes: number;
}

let META_INDEX: Map<string, Map<Locale, MetaEntry>> | null = null;

/** Map from translationKey → { locale: entry }. */
export function getMetaIndex(): Map<string, Map<Locale, MetaEntry>> {
  if (META_INDEX) return META_INDEX;
  const index = new Map<string, Map<Locale, MetaEntry>>();
  for (const entry of BLOG_POSTS_META) {
    const locale = entry.locale as Locale;
    if (!(locales as readonly string[]).includes(locale)) continue;
    if (!isValidSlug(entry.slug)) continue;
    const key = getTranslationKey(entry.slug, entry.frontmatter);
    const inner = index.get(key) ?? new Map<Locale, MetaEntry>();
    inner.set(locale, {
      slug: entry.slug,
      fm: entry.frontmatter,
      readingTimeMinutes: entry.readingTimeMinutes,
    });
    index.set(key, inner);
  }
  META_INDEX = index;
  return index;
}

export interface ResolvedEntry {
  entry: MetaEntry;
  loadedLocale: Locale;
  availableLocales: Locale[];
}

const RESOLVED = new Map<string, ResolvedEntry | null>();

/**
 * Pick the entry to serve for a requested locale: that locale, else EN, else
 * whichever translation exists. Returns null for a post that is invisible
 * (draft) or unknown — the single place those semantics live, shared by the
 * listings here and the body-loading post lookup in `./index`.
 */
export function resolveEntryForLocale(
  translationKey: string,
  requestedLocale: Locale
): ResolvedEntry | null {
  const cacheKey = `${requestedLocale}|${translationKey}`;
  const memo = RESOLVED.get(cacheKey);
  if (memo !== undefined) return memo;

  const resolved = resolve();
  RESOLVED.set(cacheKey, resolved);
  return resolved;

  function resolve(): ResolvedEntry | null {
    const localeMap = getMetaIndex().get(translationKey);
    if (!localeMap) return null;

    const availableLocales = Array.from(localeMap.keys());
    let loadedLocale: Locale | null = null;
    let entry: MetaEntry | undefined;

    if (localeMap.has(requestedLocale)) {
      loadedLocale = requestedLocale;
      entry = localeMap.get(requestedLocale);
    } else if (localeMap.has(defaultLocale)) {
      loadedLocale = defaultLocale;
      entry = localeMap.get(defaultLocale);
    } else {
      loadedLocale = availableLocales.sort()[0] ?? null;
      entry = loadedLocale ? localeMap.get(loadedLocale) : undefined;
    }

    if (!loadedLocale || !entry) return null;

    // draft → invisible everywhere. hidden → reachable via direct URL but
    // excluded from every listing surface (listPosts filters it out below,
    // which also keeps it off the index, category/tag pages, RSS and the
    // sitemap). published → everywhere.
    if ((entry.fm.mode ?? 'published') === 'draft') return null;

    // TODO: reinstate future-date scheduling under Cache Components — reading the
    // clock at render is forbidden, so this needs to thread `getServerToday`
    // through `listPosts`/`getPostByLocaleSlug` before it can come back.

    return { entry, loadedLocale, availableLocales };
  }
}

/**
 * Find a post's translationKey from a URL slug: the requested locale's slug
 * first, then EN, then any other locale (which the post page turns into a
 * redirect to the canonical URL). One implementation, shared by the body-free
 * lookup below and by `getPostByLocaleSlug` in `./index`.
 */
export function findTranslationKeyBySlug(slug: string, requestedLocale: Locale): string | null {
  if (!isValidSlug(slug)) return null;
  const index = getTranslationIndex();

  for (const [key, localeMap] of index) {
    if (localeMap.get(requestedLocale) === slug) return key;
  }
  for (const [key, localeMap] of index) {
    if (localeMap.get(defaultLocale) === slug) return key;
  }
  for (const [key, localeMap] of index) {
    for (const [, otherSlug] of localeMap) {
      if (otherSlug === slug) return key;
    }
  }
  return null;
}

/**
 * A post's card data by URL slug, WITHOUT its body — for surfaces that only
 * need frontmatter (the OG image route). Hidden posts resolve here just like
 * they do by URL; drafts don't.
 */
export function getListItemByLocaleSlug(
  slug: string,
  requestedLocale: Locale
): BlogListItem | null {
  const key = findTranslationKeyBySlug(slug, requestedLocale);
  if (!key) return null;
  const resolved = resolveEntryForLocale(key, requestedLocale);
  if (!resolved) return null;
  return {
    slug: resolved.entry.slug,
    translationKey: key,
    loadedLocale: resolved.loadedLocale,
    isFallback: resolved.loadedLocale !== requestedLocale,
    frontmatter: resolved.entry.fm,
    readingTimeMinutes: resolved.entry.readingTimeMinutes,
  };
}

/**
 * Does the blog have at least one PUBLISHED post? Every visible blog surface —
 * header/footer nav, homepage strips, the blog index, feeds, sitemap — gates
 * on this so a repo where everything sits in draft/hidden presents no blog at
 * all.
 *
 * With a `locale` argument the check is locale-scoped: does THIS locale list
 * at least one post? (`listPosts` already applies mode + EN-fallback
 * semantics.) That lets a German-first rollout publish /de/blog without
 * switching the blog on for locales that would present an empty index.
 */
const HAS_POSTS = new Map<string, boolean>();

export function hasPublishedPosts(locale?: Locale): boolean {
  const cacheKey = locale ?? '*';
  const memo = HAS_POSTS.get(cacheKey);
  if (memo !== undefined) return memo;

  let result = false;
  if (locale) {
    result = listPosts(locale).length > 0;
  } else {
    outer: for (const localeMap of getMetaIndex().values()) {
      for (const entry of localeMap.values()) {
        if ((entry.fm.mode ?? 'published') === 'published') {
          result = true;
          break outer;
        }
      }
    }
  }
  HAS_POSTS.set(cacheKey, result);
  return result;
}

let TRANSLATION_INDEX: Map<string, Map<Locale, string>> | null = null;

/** Map from translationKey → { locale: slug } — kept for hreflang / canonical lookups. */
export function getTranslationIndex(): Map<string, Map<Locale, string>> {
  if (TRANSLATION_INDEX) return TRANSLATION_INDEX;
  const out = new Map<string, Map<Locale, string>>();
  for (const [key, localeMap] of getMetaIndex()) {
    const slugMap = new Map<Locale, string>();
    for (const [locale, entry] of localeMap) {
      slugMap.set(locale, entry.slug);
    }
    out.set(key, slugMap);
  }
  TRANSLATION_INDEX = out;
  return out;
}

const POSTS_BY_LOCALE = new Map<Locale, readonly BlogListItem[]>();

/**
 * List all published posts for the given locale, falling back to EN where needed.
 * Sorted newest-first by `date`.
 *
 * The result is a shared, frozen array (see the module doc) — filter, slice or
 * spread it, never sort it in place.
 */
export function listPosts(requestedLocale: Locale): readonly BlogListItem[] {
  const memo = POSTS_BY_LOCALE.get(requestedLocale);
  if (memo) return memo;

  const items: BlogListItem[] = [];
  for (const key of getMetaIndex().keys()) {
    const resolved = resolveEntryForLocale(key, requestedLocale);
    if (!resolved) continue;
    // Hidden posts render via direct URL but never appear in listings.
    if ((resolved.entry.fm.mode ?? 'published') === 'hidden') continue;
    items.push({
      slug: resolved.entry.slug,
      translationKey: key,
      loadedLocale: resolved.loadedLocale,
      isFallback: resolved.loadedLocale !== requestedLocale,
      frontmatter: resolved.entry.fm,
      readingTimeMinutes: resolved.entry.readingTimeMinutes,
    });
  }
  // Featured posts bubble to the top of every listing, then date DESC within
  // each group. The blog index treats the first item as its big "feature
  // card", so flagging a post `featured: true` in frontmatter is enough to
  // promote it across all surfaces — index, category, tag and the RSS feed.
  items.sort((a, b) => {
    const aFeatured = a.frontmatter.featured ? 1 : 0;
    const bFeatured = b.frontmatter.featured ? 1 : 0;
    if (aFeatured !== bFeatured) return bFeatured - aFeatured;
    return a.frontmatter.date < b.frontmatter.date ? 1 : -1;
  });

  const frozen = Object.freeze(items);
  POSTS_BY_LOCALE.set(requestedLocale, frozen);
  return frozen;
}

/**
 * Return alternate hreflang URLs for a single post (per translationKey).
 *
 * Only locales with a real, PUBLISHED translation are emitted. Untranslated
 * locales still render via EN fallback, but those URLs serve duplicate EN
 * content and canonicalize to the EN original — listing them as hreflang
 * alternates would tell search engines a translation exists where it
 * doesn't. Draft translations 404 and hidden ones are deliberately
 * unlisted, so both stay out as well.
 */
export function buildPostAlternates(translationKey: string): Record<string, string> {
  const localeMap = getMetaIndex().get(translationKey);
  if (!localeMap) return {};
  const out: Record<string, string> = {};
  for (const locale of locales) {
    const entry = localeMap.get(locale);
    if (!entry) continue;
    if ((entry.fm.mode ?? 'published') !== 'published') continue;
    out[locale] = `${SITE_URL}/${locale}/blog/${entry.slug}`;
  }
  return out;
}

/** All visible URL slugs per locale — used for generateStaticParams. */
export function listAllUrlSlugsByLocale(): Array<{ locale: Locale; slug: string }> {
  const index = getTranslationIndex();
  const out: Array<{ locale: Locale; slug: string }> = [];
  for (const localeMap of index.values()) {
    const enSlug = localeMap.get(defaultLocale);
    for (const locale of locales) {
      const slug = localeMap.get(locale) ?? enSlug;
      if (!slug) continue;
      out.push({ locale, slug });
    }
  }
  return out;
}

/** Default number of posts per page on listing views. */
export const BLOG_POSTS_PER_PAGE = 12;

/**
 * Slice a posts list into a single page worth of items.
 * Pages are 1-based. Out-of-range pages return an empty array.
 */
export function paginatePosts<T>(
  items: readonly T[],
  page: number,
  perPage: number = BLOG_POSTS_PER_PAGE
): { items: T[]; page: number; totalPages: number; totalItems: number } {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const clamped = Math.min(Math.max(1, page | 0), totalPages);
  const start = (clamped - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    page: clamped,
    totalPages,
    totalItems,
  };
}

/**
 * Parse a `?page=` search-param value into a clamped 1-based page number.
 * Returns 1 for missing, invalid, or out-of-range input.
 */
export function parsePageParam(value: unknown, totalPages: number = Infinity): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 1) return 1;
  if (Number.isFinite(totalPages) && n > totalPages) return totalPages;
  return n;
}

const POSTS_BY_RECENCY = new Map<Locale, readonly BlogListItem[]>();

/**
 * When a post was last touched, for the recency sort below.
 *
 * `updatedAt` is optional — a post that was never revised (most of them) sorts
 * by its publication `date`, exactly as it always did. The `max` is what makes
 * that rule total: `updatedAt` may only ever pull a post FORWARD. An entry that
 * predates its own `date` (a typo, or a `date` corrected forward after the fact)
 * would otherwise push the post further back than a pure date sort would, which
 * is the opposite of what marking it updated is for. Both fields are ISO
 * `YYYY-MM-DD`, so string comparison is date comparison.
 */
function lastTouched(fm: BlogFrontmatter): string {
  const updated = fm.updatedAt?.trim();
  return updated && updated > fm.date ? updated : fm.date;
}

/**
 * The same list as {@link listPosts}, but ordered by when a post last CHANGED
 * ({@link lastTouched}: `updatedAt` where it exists, else the publication
 * `date`) instead of by when it was first published.
 *
 * The homepage strips are a "what's new here" surface, not an archive: a guide
 * that got this season's confirmed dates written into it is news again, and
 * under a pure `date` sort it stays buried behind every post published since.
 * Every other surface keeps publication order on purpose — the blog index and
 * the category/tag pages read as an archive, `feed.xml` would re-notify
 * subscribers about an article they already have, and `blog-post-nav` walks
 * neighbours in chronological order, which is the only order a "previous post"
 * link means anything in.
 *
 * `featured` still wins, exactly as in `listPosts`, so pinning a post is not
 * quietly undone by someone fixing a typo in a newer one.
 *
 * Frozen and memoised like every list here — copy before sorting.
 */
export function listPostsByRecency(requestedLocale: Locale): readonly BlogListItem[] {
  const memo = POSTS_BY_RECENCY.get(requestedLocale);
  if (memo) return memo;

  const items = [...listPosts(requestedLocale)];
  items.sort((a, b) => {
    const aFeatured = a.frontmatter.featured ? 1 : 0;
    const bFeatured = b.frontmatter.featured ? 1 : 0;
    if (aFeatured !== bFeatured) return bFeatured - aFeatured;
    const aDate = lastTouched(a.frontmatter);
    const bDate = lastTouched(b.frontmatter);
    if (aDate !== bDate) return aDate < bDate ? 1 : -1;
    // Same touch date (a batch edit, or two posts published the same day):
    // fall back to publication date so the order stays deterministic across
    // renders rather than depending on the manifest's file order.
    return a.frontmatter.date < b.frontmatter.date ? 1 : -1;
  });

  const frozen = Object.freeze(items);
  POSTS_BY_RECENCY.set(requestedLocale, frozen);
  return frozen;
}
