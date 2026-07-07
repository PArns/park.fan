import 'server-only';
import { cache } from 'react';
import { locales, defaultLocale, SITE_URL, type Locale } from '@/i18n/config';
import type { BlogFrontmatter, BlogListItem, BlogPost } from './types';
import { BLOG_POSTS_RAW } from './manifest';

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug);
}

function calcReadingTimeMinutes(body: string, override?: number): number {
  if (typeof override === 'number' && override > 0) return Math.round(override);
  // Strip image and link syntax for a slightly more accurate word count.
  const text = body.replace(/!\[[^\]]*]\([^)]*\)/g, '').replace(/\[[^\]]*]\([^)]*\)/g, '$1');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function getTranslationKey(slug: string, fm: BlogFrontmatter): string {
  return fm.translationKey?.trim() || slug;
}

/** Map from translationKey → { locale: { slug, fm, body } }. */
type RawEntry = { slug: string; fm: BlogFrontmatter; body: string };

const getRawIndex = cache((): Map<string, Map<Locale, RawEntry>> => {
  const index = new Map<string, Map<Locale, RawEntry>>();
  for (const entry of BLOG_POSTS_RAW) {
    const locale = entry.locale as Locale;
    if (!(locales as readonly string[]).includes(locale)) continue;
    if (!isValidSlug(entry.slug)) continue;
    const key = getTranslationKey(entry.slug, entry.frontmatter);
    const inner = index.get(key) ?? new Map<Locale, RawEntry>();
    inner.set(locale, { slug: entry.slug, fm: entry.frontmatter, body: entry.content });
    index.set(key, inner);
  }
  return index;
});

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
export const hasPublishedPosts = cache((locale?: Locale): boolean => {
  if (locale) return listPosts(locale).length > 0;

  for (const localeMap of getRawIndex().values()) {
    for (const entry of localeMap.values()) {
      if ((entry.fm.mode ?? 'published') === 'published') return true;
    }
  }
  return false;
});

/** Map from translationKey → { locale: slug } — kept for hreflang / canonical lookups. */
export const getTranslationIndex = cache((): Map<string, Map<Locale, string>> => {
  const out = new Map<string, Map<Locale, string>>();
  for (const [key, raw] of getRawIndex()) {
    const slugMap = new Map<Locale, string>();
    for (const [locale, entry] of raw) {
      slugMap.set(locale, entry.slug);
    }
    out.set(key, slugMap);
  }
  return out;
});

/**
 * Load a single post by translationKey for the requested locale, falling back to EN.
 * Returns null when the post does not exist in EN either, or when its mode is not visible.
 */
export const getPostByTranslationKey = cache(
  (translationKey: string, requestedLocale: Locale): BlogPost | null => {
    const rawIndex = getRawIndex();
    const localeMap = rawIndex.get(translationKey);
    if (!localeMap) return null;

    const availableLocales = Array.from(localeMap.keys());
    let loadedLocale: Locale | null = null;
    let entry: RawEntry | undefined;

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
    const mode = entry.fm.mode ?? 'published';
    if (mode === 'draft') return null;

    // TODO: reinstate future-date scheduling under Cache Components — reading the
    // clock at render is forbidden, so this needs to thread `getServerToday`
    // through `listPosts`/`getPostByLocaleSlug` before it can come back.

    return {
      slug: entry.slug,
      translationKey,
      loadedLocale,
      requestedLocale,
      isFallback: loadedLocale !== requestedLocale,
      availableLocales,
      frontmatter: entry.fm,
      content: entry.body,
      readingTimeMinutes: calcReadingTimeMinutes(entry.body, entry.fm.readingTime),
    };
  }
);

/**
 * Load a post by its URL slug (per requested locale).
 *
 * Try the requested locale first, then EN, then any other locale (which
 * triggers a server-side redirect to the canonical URL).
 */
export const getPostByLocaleSlug = cache(
  (slug: string, requestedLocale: Locale): BlogPost | null => {
    if (!isValidSlug(slug)) return null;
    const index = getTranslationIndex();

    for (const [key, localeMap] of index) {
      if (localeMap.get(requestedLocale) === slug) {
        return getPostByTranslationKey(key, requestedLocale);
      }
    }
    for (const [key, localeMap] of index) {
      if (localeMap.get(defaultLocale) === slug) {
        return getPostByTranslationKey(key, requestedLocale);
      }
    }
    for (const [key, localeMap] of index) {
      for (const [, otherSlug] of localeMap) {
        if (otherSlug === slug) {
          return getPostByTranslationKey(key, requestedLocale);
        }
      }
    }
    return null;
  }
);

/**
 * List all published posts for the given locale, falling back to EN where needed.
 * Sorted newest-first by `date`.
 */
export const listPosts = cache((requestedLocale: Locale): BlogListItem[] => {
  const index = getRawIndex();
  const items: BlogListItem[] = [];
  for (const key of index.keys()) {
    const post = getPostByTranslationKey(key, requestedLocale);
    if (!post) continue;
    // Hidden posts render via direct URL but never appear in listings.
    if ((post.frontmatter.mode ?? 'published') === 'hidden') continue;
    items.push({
      slug: post.slug,
      translationKey: post.translationKey,
      loadedLocale: post.loadedLocale,
      isFallback: post.isFallback,
      frontmatter: post.frontmatter,
      readingTimeMinutes: post.readingTimeMinutes,
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
  return items;
});

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
  const raw = getRawIndex().get(translationKey);
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const locale of locales) {
    const entry = raw.get(locale);
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
  items: T[],
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
