import { SITE_URL, type Locale } from '@/i18n/config';
import { isNewsCategory, postPath } from '@/lib/blog/paths';
import { xmlEscape } from '@/lib/seo/sitemap-xml';

/**
 * The Google News sitemap (`/sitemap-news.xml`): the news posts of the last two days, one `<url>`
 * per post and locale, each with a `<news:news>` block.
 *
 * Pure on purpose — the posts and today's date come in as arguments — so `pnpm test:news-sitemap`
 * can pin the window without a clock or a manifest. The route (`app/sitemap-news.xml/route.ts`)
 * supplies both.
 */

/** Google reads at most this many `<url>` entries from a news sitemap. */
export const NEWS_SITEMAP_MAX_URLS = 1000;

/**
 * How many calendar days back a post still counts. Google wants the articles of the last 48 hours.
 * A post carries a DATE, not a time (`date: 'YYYY-MM-DD'`), so a post dated two days ago may be
 * 25 hours old or 71. Counting the whole day keeps the young one in; the old one costs nothing,
 * because Google ignores entries past its own cut-off. Cutting at one day would drop posts that
 * are well inside the 48 hours.
 */
export const NEWS_SITEMAP_WINDOW_DAYS = 2;

/** Publication name as Google News shows it. Must match the name in the Publisher Center. */
export const NEWS_PUBLICATION_NAME = 'park.fan';

export interface NewsSitemapPost {
  slug: string;
  /** False when the locale serves the EN original; those URLs canonicalize away and stay out. */
  isFallback: boolean;
  frontmatter: { title: string; date: string; category?: string | null };
}

/** `YYYY-MM-DD` of the day `days` before `today` (also `YYYY-MM-DD`), counted in UTC. */
export function newsWindowStart(today: string, days: number = NEWS_SITEMAP_WINDOW_DAYS): string {
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - days);
  return start.toISOString().slice(0, 10);
}

/**
 * The news sitemap document. `postsByLocale` holds each locale's listed posts (articles included;
 * they are filtered out here), `today` is the UTC date the file is built on.
 *
 * An empty window yields a valid `<urlset>` with no entries, never a 404: the file's URL sits in
 * robots.txt permanently, and most days nothing is news.
 *
 * `<news:publication_date>` is the frontmatter date as written. That is a valid W3C date for
 * Google, and adding a time or an offset would state a precision the post does not have
 * (docs/rules/a-lastmod-is-observed-never-stamped.md).
 */
export function buildNewsSitemap(
  postsByLocale: ReadonlyArray<readonly [Locale, readonly NewsSitemapPost[]]>,
  today: string
): string {
  const from = newsWindowStart(today);
  const entries: Array<{ date: string; xml: string }> = [];

  for (const [locale, posts] of postsByLocale) {
    for (const post of posts) {
      if (post.isFallback) continue;
      const { title, date, category } = post.frontmatter;
      if (!isNewsCategory(category)) continue;
      // A future date is a scheduled post the listing does not hide yet (see `resolveEntryForLocale`);
      // it is not news before its day.
      if (date < from || date > today) continue;
      const loc = `${SITE_URL}/${locale}${postPath(post)}`;
      entries.push({
        date,
        xml:
          `<url><loc>${xmlEscape(loc)}</loc><news:news>` +
          `<news:publication><news:name>${xmlEscape(NEWS_PUBLICATION_NAME)}</news:name>` +
          `<news:language>${locale}</news:language></news:publication>` +
          `<news:publication_date>${xmlEscape(date)}</news:publication_date>` +
          `<news:title>${xmlEscape(title)}</news:title>` +
          `</news:news></url>`,
      });
    }
  }

  // Newest first, so the cap drops the oldest entries rather than whichever locale came last.
  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const urls = entries.slice(0, NEWS_SITEMAP_MAX_URLS).map((entry) => entry.xml);

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
    'xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n' +
    (urls.length ? `${urls.join('\n')}\n` : '') +
    '</urlset>'
  );
}
