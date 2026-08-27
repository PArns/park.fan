import 'server-only';
import { SITE_URL, type Locale } from '@/i18n/config';
import { hasPublishedPosts } from './listing';

/**
 * The blog feed's identity — its URL, what a reader sees it called, and the
 * `<link rel="alternate">` every page needs in order for the feed to be found
 * at all.
 *
 * Autodiscovery is the only standardized route from an HTML page to a feed
 * (rssboard.org/rss-autodiscovery): `rel="alternate"`,
 * `type="application/rss+xml"`, an `href`, inside the `<head>`. Without it a
 * reader has nothing to go on but a guessed path.
 *
 * It cannot be declared once in the layout. Next replaces the whole
 * `alternates` object at the nearest segment that sets one rather than merging
 * into it — `app/[locale]/contribute/thanks/page.tsx` sets only `canonical` and
 * ships **no** hreflang links, though the locale layout declares `languages`.
 * So every route that sets `alternates` at all has to carry the feed itself,
 * which is exactly how the category pages lost it: four blog routes spelled the
 * same literal out by hand and the fifth was never given one. Hence this
 * module, and hence `blogFeedAlternates` returning the whole `types` object
 * instead of a URL a call site still has to wrap.
 *
 * The array-of-descriptors form (rather than a bare string) is what carries a
 * `title` into the markup. With one feed per page that is a courtesy; the spec
 * makes it the thing readers disambiguate by as soon as a page offers two.
 */

/** Where a locale's feed lives. `feed.xml`, per the route folder of the same name. */
export function blogFeedUrl(locale: Locale): string {
  return `${SITE_URL}/${locale}/blog/feed.xml`;
}

/**
 * The feed's name, as a reader's subscription list will show it.
 *
 * Localized because a subscription list is a place a person reads, and six
 * feeds all called the same thing are six identical rows.
 */
export const BLOG_FEED_TITLE: Record<Locale, string> = {
  de: 'park.fan Blog',
  en: 'park.fan Blog',
  nl: 'park.fan Blog',
  fr: 'Blog park.fan',
  es: 'Blog de park.fan',
  it: 'Blog di park.fan',
};

/**
 * The channel description. Previously a two-branch ternary that gave German its
 * own sentence and handed the English one to the remaining four locales.
 */
export const BLOG_FEED_DESCRIPTION: Record<Locale, string> = {
  de: 'Reiseberichte, Datenauswertungen und Park-News vom park.fan-Team.',
  en: 'Trip reports, data dives, and theme-park news from the park.fan team.',
  nl: 'Reisverslagen, data-analyses en parknieuws van het park.fan-team.',
  fr: 'Carnets de visite, analyses de données et actualités des parcs, par l’équipe park.fan.',
  es: 'Crónicas de visita, análisis de datos y noticias de parques del equipo de park.fan.',
  it: 'Racconti di visita, analisi dei dati e notizie dai parchi, dal team di park.fan.',
};

/**
 * The `alternates.types` entry for a page whose feed is this locale's blog feed.
 *
 * Returns `undefined` where the locale publishes nothing, because the route
 * itself 404s in that case (`hasPublishedPosts`) and advertising a feed that
 * answers 404 is worse than advertising none: a reader records the failure
 * against the site, not against the one locale.
 *
 * Spread it into `alternates`:
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
