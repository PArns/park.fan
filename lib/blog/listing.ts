import 'server-only';
import { locales, defaultLocale, SITE_URL, type Locale } from '@/i18n/config';
import type { BlogFrontmatter, BlogListItem } from './types';
import { BLOG_POSTS_META } from './manifest';
import { isNewsCategory, postPath } from './paths';

/**
 * Everything a blog listing needs (cards, feeds, hreflang, the nav gate, the park pages'
 * backlinks), resolved from the frontmatter-only manifest. Split from `./index` so the root
 * layout does not drag every post body into every route's bundle; see
 * docs/rules/blog-manifest-is-split.md.
 *
 * Memoised per process, not per request: everything here derives from the generated manifest and
 * reads no clock or request state. The returned lists are frozen and shared, so copy before
 * sorting.
 */

function isValidSlug(slug: string): boolean {
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

const HAS_POSTS = new Map<string, boolean>();

/**
 * Returns true when the blog has at least one published post, in the given locale (with its
 * English fallback) or, without one, in any locale. Every blog surface gates on it, so a locale
 * with nothing published shows no blog at all.
 */
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
 * Hreflang URLs for one post, only for locales with a real, published translation: a fallback
 * URL serves the English text and canonicalizes to it.
 */
export function buildPostAlternates(translationKey: string): Record<string, string> {
  const localeMap = getMetaIndex().get(translationKey);
  if (!localeMap) return {};
  const out: Record<string, string> = {};
  for (const locale of locales) {
    const entry = localeMap.get(locale);
    if (!entry) continue;
    if ((entry.fm.mode ?? 'published') !== 'published') continue;
    out[locale] = `${SITE_URL}/${locale}${postPath({ slug: entry.slug, frontmatter: entry.fm })}`;
  }
  return out;
}

/**
 * All visible URL slugs per locale — used for generateStaticParams. `section` keeps the two
 * post routes apart: `blog` lists the articles, `news` the news posts (see `./paths`). Whether a
 * slug is news is read off the entry that locale actually serves, its own or the EN fallback.
 */
export function listAllUrlSlugsByLocale(
  section: 'blog' | 'news'
): Array<{ locale: Locale; slug: string }> {
  const out: Array<{ locale: Locale; slug: string }> = [];
  for (const localeMap of getMetaIndex().values()) {
    const enEntry = localeMap.get(defaultLocale);
    for (const locale of locales) {
      const entry = localeMap.get(locale) ?? enEntry;
      if (!entry) continue;
      if (isNewsCategory(entry.fm.category) !== (section === 'news')) continue;
      out.push({ locale, slug: entry.slug });
    }
  }
  return out;
}

/** Default number of posts per page on listing views. */
export const BLOG_POSTS_PER_PAGE = 12;

const POSTS_BY_RECENCY = new Map<Locale, readonly BlogListItem[]>();

/**
 * When a post was last touched, for the recency sort and the date the header's blog panel prints:
 * `updatedAt` when it is later than `date`, so it can only pull a post forward. `updatedAt` moves
 * only for new content (docs/rules/updated-at-is-for-new-content.md). Both are ISO `YYYY-MM-DD`,
 * so string comparison is date comparison.
 */
export function lastTouched(fm: BlogFrontmatter): string {
  const updated = fm.updatedAt?.trim();
  return updated && updated > fm.date ? updated : fm.date;
}

/**
 * {@link listPosts} ordered by {@link lastTouched} instead of publication date, for the "what's
 * new" surfaces: a guide that got this season's dates is news again. The archive pages, the feed
 * and prev/next keep publication order on purpose. `featured` still wins. Frozen and memoised.
 */
function listPostsByRecency(requestedLocale: Locale): readonly BlogListItem[] {
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

/**
 * News and articles publish at very different rates, so the "newest posts" surfaces keep them
 * apart; otherwise a week of news pushes every guide off the homepage and the header menu.
 */
export { NEWS_CATEGORY } from './paths';

/** Returns true when a post's category is `news` or a subcategory of it. */
export function isNewsPost(post: Pick<BlogListItem, 'frontmatter'>): boolean {
  return isNewsCategory(post.frontmatter.category);
}

const ARTICLES = new Map<Locale, readonly BlogListItem[]>();
const ARTICLES_BY_RECENCY = new Map<Locale, readonly BlogListItem[]>();
const NEWS_BY_DATE = new Map<Locale, readonly BlogListItem[]>();

/**
 * {@link listPosts} without the news posts: what the blog lists. The blog index, its category,
 * tag and author pages, the category tree, the tag cloud and an article's prev/next all read
 * this — news has its own section at `/news` and never appears under `/blog`. Same order as
 * `listPosts` (featured first, then publication date). Frozen and memoised.
 */
export function listArticles(requestedLocale: Locale): readonly BlogListItem[] {
  const memo = ARTICLES.get(requestedLocale);
  if (memo) return memo;
  const frozen = Object.freeze(listPosts(requestedLocale).filter((p) => !isNewsPost(p)));
  ARTICLES.set(requestedLocale, frozen);
  return frozen;
}

/** {@link listPostsByRecency} without the news posts. Frozen and memoised. */
export function listArticlesByRecency(requestedLocale: Locale): readonly BlogListItem[] {
  const memo = ARTICLES_BY_RECENCY.get(requestedLocale);
  if (memo) return memo;
  const frozen = Object.freeze(listPostsByRecency(requestedLocale).filter((p) => !isNewsPost(p)));
  ARTICLES_BY_RECENCY.set(requestedLocale, frozen);
  return frozen;
}

/**
 * The news posts only, newest first by publication date — not by last edit: a
 * corrected typo does not make an anniversary note news again. Frozen and memoised.
 */
export function listNewsByDate(requestedLocale: Locale): readonly BlogListItem[] {
  const memo = NEWS_BY_DATE.get(requestedLocale);
  if (memo) return memo;
  const frozen = Object.freeze(
    [...listPosts(requestedLocale)]
      .filter(isNewsPost)
      .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1))
  );
  NEWS_BY_DATE.set(requestedLocale, frozen);
  return frozen;
}
