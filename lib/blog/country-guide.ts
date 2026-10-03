import { listPosts } from '@/lib/blog/listing';
import type { BlogListItem } from '@/lib/blog/types';
import type { Locale } from '@/i18n/config';

/**
 * The ranking guide a country page links to, by the post's `translationKey`.
 *
 * Configuration, not a derived relation: a country has no `parkLinks`, and the posts that name
 * several of its parks (Halloween, winter) are round-ups of other countries too. A key with no
 * published post in the reader's locale or its English fallback resolves to `null`, so the page
 * shows nothing instead of a dead card.
 */
const COUNTRY_GUIDES: Record<string, string> = {
  germany: 'best-theme-parks-germany',
};

export function getGuideForCountry(locale: Locale, countrySlug: string): BlogListItem | null {
  const translationKey = COUNTRY_GUIDES[countrySlug];
  if (!translationKey) return null;
  return listPosts(locale).find((post) => post.translationKey === translationKey) ?? null;
}
