import 'server-only';
import { cache } from 'react';
import { type Locale } from '@/i18n/config';
import type { BlogPost } from './types';
import { BLOG_POST_BODIES } from './manifest-bodies';
import { findTranslationKeyBySlug, resolveEntryForLocale } from './listing';

/**
 * Loading a post with its markdown body. This pulls in every post body, so import it only where
 * a post is rendered; every listing surface goes through `./listing`. See
 * docs/rules/blog-manifest-is-split.md.
 */

// Re-exported so `@/lib/blog` stays the familiar import for the blog routes.
export * from './listing';

/**
 * Load a single post by translationKey for the requested locale, falling back to EN.
 * Returns null when the post does not exist in EN either, or when its mode is not visible.
 */
const getPostByTranslationKey = cache(
  (translationKey: string, requestedLocale: Locale): BlogPost | null => {
    const resolved = resolveEntryForLocale(translationKey, requestedLocale);
    if (!resolved) return null;

    const { entry, loadedLocale, availableLocales } = resolved;
    return {
      slug: entry.slug,
      translationKey,
      loadedLocale,
      requestedLocale,
      isFallback: loadedLocale !== requestedLocale,
      availableLocales,
      frontmatter: entry.fm,
      content: BLOG_POST_BODIES[`${loadedLocale}/${entry.slug}`] ?? '',
      readingTimeMinutes: entry.readingTimeMinutes,
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
    const key = findTranslationKeyBySlug(slug, requestedLocale);
    return key ? getPostByTranslationKey(key, requestedLocale) : null;
  }
);
