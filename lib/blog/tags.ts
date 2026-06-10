import 'server-only';
import { cache } from 'react';
import type { Locale } from '@/i18n/config';
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
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
});

/**
 * Find the canonical display label for a slug — there may be multiple
 * differently-cased variants in posts, the first wins.
 */
export function findCanonicalTag(locale: Locale, slug: string): string | null {
  return listTags(locale).find((t) => t.slug === slug)?.label ?? null;
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
