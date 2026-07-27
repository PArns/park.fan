import 'server-only';
import { cache } from 'react';
import { locales, SITE_URL, type Locale } from '@/i18n/config';
import { listPosts } from './index';

/** Lowercase + replace any whitespace / special chars with hyphens. */
export function normalizeTagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface TagEntry {
  /** Original (display) form of the tag from the most recent post. */
  label: string;
  /** URL slug. */
  slug: string;
  /** Number of posts in the current locale that carry this tag. */
  count: number;
}

/**
 * Collect every tag across every published post in the given locale, returning
 * a stable, count-sorted list. Used by the tag archive page, the sidebar tag
 * cloud and SEO/sitemap helpers.
 */
export const listTags = cache((locale: Locale): TagEntry[] => {
  const map = new Map<string, TagEntry>();
  for (const post of listPosts(locale)) {
    for (const tag of post.frontmatter.tags ?? []) {
      const slug = normalizeTagSlug(tag);
      if (!slug) continue;
      const existing = map.get(slug);
      if (existing) existing.count++;
      else map.set(slug, { label: tag, slug, count: 1 });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
  );
});

/**
 * Find the canonical display label for a slug — there may be multiple
 * differently-cased variants in posts, the first wins.
 */
export function findCanonicalTag(locale: Locale, slug: string): string | null {
  return listTags(locale).find((t) => t.slug === slug)?.label ?? null;
}

/**
 * Every locale's slug for the same tag, keyed `"<locale>:<slug>"`.
 *
 * Tags are free text in each post's frontmatter and are translated along with the post
 * ("wartezeiten" / "wait-times" / "tempi-di-attesa" / "temps-d-attente"), so unlike posts
 * they carry no shared `translationKey` to join on. What they DO carry is position: every
 * translation of a post lists the same tags in the same order (see content/blog/README.md),
 * so zipping the arrays of one `translationKey` across locales yields the mapping.
 *
 * Without this, the tag pages advertised `/{every-locale}/blog/tag/{this-locale's-slug}` as
 * their hreflang alternates — five 404s per tag page plus a dead `x-default`, which makes
 * Google drop the whole language cluster.
 *
 * Three guards keep it from inventing links:
 *   - EN-fallback posts are skipped; they carry the EN tags, not the locale's own.
 *   - Locales whose tag arrays differ in length are skipped — position means nothing then.
 *   - A tag that ends up with conflicting candidates in some locale is dropped for that
 *     locale rather than guessed at.
 * Callers additionally verify the mapped slug really exists (see {@link buildTagAlternates}).
 */
const getTagTranslationIndex = cache((): Map<string, Map<Locale, string>> => {
  const byKey = new Map<string, Map<Locale, string[]>>();
  for (const locale of locales) {
    for (const post of listPosts(locale)) {
      if (post.isFallback) continue;
      const slugs = (post.frontmatter.tags ?? []).map(normalizeTagSlug).filter(Boolean);
      if (slugs.length === 0) continue;
      const inner = byKey.get(post.translationKey) ?? new Map<Locale, string[]>();
      inner.set(locale, slugs);
      byKey.set(post.translationKey, inner);
    }
  }

  // Collect candidates first, so a tag reused across posts with different neighbours can be
  // detected as ambiguous instead of silently taking whichever post was processed last.
  const candidates = new Map<string, Map<Locale, Set<string>>>();
  for (const perLocale of byKey.values()) {
    const lengths = new Set(Array.from(perLocale.values(), (s) => s.length));
    if (lengths.size !== 1) continue;
    const [size] = lengths;
    for (let i = 0; i < size; i++) {
      for (const [locale, slugs] of perLocale) {
        const key = `${locale}:${slugs[i]}`;
        const targets = candidates.get(key) ?? new Map<Locale, Set<string>>();
        for (const [other, otherSlugs] of perLocale) {
          const set = targets.get(other) ?? new Set<string>();
          set.add(otherSlugs[i]);
          targets.set(other, set);
        }
        candidates.set(key, targets);
      }
    }
  }

  const out = new Map<string, Map<Locale, string>>();
  for (const [key, targets] of candidates) {
    const resolved = new Map<Locale, string>();
    for (const [locale, set] of targets) {
      if (set.size === 1) resolved.set(locale, set.values().next().value!);
    }
    if (resolved.size > 0) out.set(key, resolved);
  }
  return out;
});

/**
 * Absolute hreflang alternates for a tag archive — only locales where the equivalent tag
 * actually has a page. A locale is included when the positional mapping resolves AND that
 * slug appears in the target locale's own tag list, so an alternate can never 404.
 */
export function buildTagAlternates(locale: Locale, slug: string): Record<string, string> {
  const mapped = getTagTranslationIndex().get(`${locale}:${slug}`);
  const out: Record<string, string> = {};
  for (const target of locales) {
    const targetSlug = target === locale ? slug : mapped?.get(target);
    if (!targetSlug) continue;
    if (!listTags(target).some((t) => t.slug === targetSlug)) continue;
    out[target] = `${SITE_URL}/${target}/blog/tag/${targetSlug}`;
  }
  return out;
}

/** Twelve consistent tag-pill palettes; the same tag always picks the same one. */
const TAG_PALETTES = [
  'bg-sky-500/15 text-sky-600 ring-sky-500/30 hover:bg-sky-500/25 dark:text-sky-300',
  'bg-amber-500/15 text-amber-700 ring-amber-500/30 hover:bg-amber-500/25 dark:text-amber-300',
  'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 hover:bg-emerald-500/25 dark:text-emerald-300',
  'bg-rose-500/15 text-rose-600 ring-rose-500/30 hover:bg-rose-500/25 dark:text-rose-300',
  'bg-violet-500/15 text-violet-600 ring-violet-500/30 hover:bg-violet-500/25 dark:text-violet-300',
  'bg-fuchsia-500/15 text-fuchsia-600 ring-fuchsia-500/30 hover:bg-fuchsia-500/25 dark:text-fuchsia-300',
  'bg-lime-500/15 text-lime-700 ring-lime-500/30 hover:bg-lime-500/25 dark:text-lime-300',
  'bg-cyan-500/15 text-cyan-700 ring-cyan-500/30 hover:bg-cyan-500/25 dark:text-cyan-300',
  'bg-orange-500/15 text-orange-700 ring-orange-500/30 hover:bg-orange-500/25 dark:text-orange-300',
  'bg-pink-500/15 text-pink-600 ring-pink-500/30 hover:bg-pink-500/25 dark:text-pink-300',
  'bg-teal-500/15 text-teal-700 ring-teal-500/30 hover:bg-teal-500/25 dark:text-teal-300',
  'bg-indigo-500/15 text-indigo-600 ring-indigo-500/30 hover:bg-indigo-500/25 dark:text-indigo-300',
];

/**
 * Pick a deterministic color class for a tag slug. Using a tiny FNV-1a hash so
 * the same string always picks the same palette regardless of locale.
 */
export function getTagColorClass(slug: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return TAG_PALETTES[Math.abs(h) % TAG_PALETTES.length];
}
