import 'server-only';
import { SITE_URL, type Locale } from '@/i18n/config';
import { hasPublishedPosts } from './listing';

/**
 * The blog feed's identity: its URL, its name and the `<link rel="alternate">` a reader finds it
 * by. Every route that sets `alternates` has to carry the feed itself, because Next replaces the
 * whole `alternates` object at the nearest segment that declares one instead of merging. See
 * docs/rules/a-feed-nobody-links-to-is-a-file-with-a-url.md.
 */

/** Where a locale's feed lives. `feed.xml`, per the route folder of the same name. */
export function blogFeedUrl(locale: Locale): string {
  return `${SITE_URL}/${locale}/blog/feed.xml`;
}

/**
 * The feed's name, as a reader's subscription list will show it, localized so six feeds are not
 * six identical rows.
 */
export const BLOG_FEED_TITLE: Record<Locale, string> = {
  de: 'park.fan Blog',
  en: 'park.fan Blog',
  nl: 'park.fan Blog',
  fr: 'Blog park.fan',
  es: 'Blog de park.fan',
  it: 'Blog di park.fan',
};

/** The feed's channel description, per locale. */
export const BLOG_FEED_DESCRIPTION: Record<Locale, string> = {
  de: 'Reiseberichte, Datenauswertungen und Park-News vom park.fan-Team.',
  en: 'Trip reports, data dives, and theme-park news from the park.fan team.',
  nl: 'Reisverslagen, data-analyses en parknieuws van het park.fan-team.',
  fr: 'Carnets de visite, analyses de données et actualités des parcs, par l’équipe park.fan.',
  es: 'Crónicas de visita, análisis de datos y noticias de parques del equipo de park.fan.',
  it: 'Racconti di visita, analisi dei dati e notizie dai parchi, dal team di park.fan.',
};

/**
 * The `alternates.types` entry for a page whose feed is this locale's blog feed, or `undefined`
 * where the locale publishes nothing: the feed 404s there, and a reader records that against the
 * whole site. Spread it into `alternates`:
 *
 *     alternates: { canonical, languages, types: blogFeedAlternates(locale) }
 */
export function blogFeedAlternates(
  locale: Locale
): { 'application/rss+xml': Array<{ url: string; title: string }> } | undefined {
  if (!hasPublishedPosts(locale)) return undefined;
  return {
    'application/rss+xml': [{ url: blogFeedUrl(locale), title: BLOG_FEED_TITLE[locale] }],
  };
}
