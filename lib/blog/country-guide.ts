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

/**
 * The guide a data surface links where it shows the topic the guide explains, by `translationKey`.
 * Configuration for the same reason as {@link COUNTRY_GUIDES}: a ride page's single-rider answer
 * references no post, so there is no relation to derive.
 */
const TOPIC_GUIDES = {
  'single-rider': 'single-rider-guide',
} as const;

/** A topic that has a guide of its own; see {@link getGuideForTopic}. */
export type GuideTopic = keyof typeof TOPIC_GUIDES;

function publishedPost(locale: Locale, translationKey: string): BlogListItem | null {
  return listPosts(locale).find((post) => post.translationKey === translationKey) ?? null;
}

/**
 * Returns the ranking guide post a country page links to, or `null` when the country has none or it
 * is not published in this locale or English.
 */
export function getGuideForCountry(locale: Locale, countrySlug: string): BlogListItem | null {
  const translationKey = COUNTRY_GUIDES[countrySlug];
  return translationKey ? publishedPost(locale, translationKey) : null;
}

/**
 * Returns the guide that explains `topic`, or `null` when it is not published in this locale or
 * English.
 */
export function getGuideForTopic(locale: Locale, topic: GuideTopic): BlogListItem | null {
  return publishedPost(locale, TOPIC_GUIDES[topic]);
}
