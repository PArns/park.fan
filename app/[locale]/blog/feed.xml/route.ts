import type { NextRequest } from 'next/server';
import { hasPublishedPosts, listPosts } from '@/lib/blog/listing';
import { resolveAuthor } from '@/lib/blog/authors';
import { routing, type Locale } from '@/i18n/routing';
import { SITE_URL } from '@/i18n/config';
import { versionedPath } from '@/lib/media/focus';
import { getMediaImageForPath } from '@/lib/media';
import { WEBSUB_HUB } from '@/lib/websub';
import { BLOG_FEED_DESCRIPTION, BLOG_FEED_TITLE, blogFeedUrl } from '@/lib/blog/feed';
import { postPath } from '@/lib/blog/paths';
import { xmlEscape } from '@/lib/seo/sitemap-xml';

/**
 * How many items a feed carries. Older posts stay where an archive belongs: the blog index, the
 * category pages and the sitemap.
 */
const MAX_ITEMS = 15;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function escapeCData(value: string): string {
  return value.replace(/]]>/g, ']]]]><![CDATA[>');
}

function rfc822(date: Date): string {
  return date.toUTCString();
}

const MIME_BY_EXTENSION: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

/**
 * The cover image as an `<enclosure>`, with the byte count RSS requires. It comes from the media
 * manifest, which knows the source photo rather than the crop a cover points at, so it is
 * approximate. Not a filesystem stat: a dynamic path under `public` bundles the whole directory
 * into this function. See docs/rules/a-runtime-file-read-ships-the-directory-it-is-rooted-at.md.
 */
function coverEnclosure(coverAbs: string, coverPath: string): string {
  const clean = coverPath.split('?')[0];
  const extension = clean.split('.').pop()?.toLowerCase() ?? '';
  const type = MIME_BY_EXTENSION[extension] ?? 'image/jpeg';
  const length = getMediaImageForPath(clean)?.bytes ?? 0;
  return `    <enclosure url="${xmlEscape(coverAbs)}" type="${type}" length="${length}" />`;
}

/**
 * Per-locale RSS 2.0 feed for the blog. Items are in strict publication order (`listPosts` puts
 * featured posts first, which is right for a page and wrong for a feed), carry the excerpt rather
 * than the article (the body would pull every post body in through `@/lib/blog`), and use only
 * elements RSS defines. Discovery lives in `lib/blog/feed.ts`: a feed nobody links to from a
 * `<head>` is a file with a URL.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale: rawLocale } = await params;
  if (!routing.locales.includes(rawLocale as Locale)) {
    return new Response('Not found', { status: 404 });
  }
  const locale = rawLocale as Locale;

  // No posts listed for this locale → no feed for it either.
  if (!hasPublishedPosts(locale)) {
    return new Response('Not found', { status: 404 });
  }

  // Copy before sorting: `listPosts` hands out a shared frozen array.
  const posts = [...listPosts(locale)]
    .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1))
    .slice(0, MAX_ITEMS);

  const channelTitle = BLOG_FEED_TITLE[locale];
  const channelDescription = BLOG_FEED_DESCRIPTION[locale];
  const channelLink = `${SITE_URL}/${locale}/blog`;
  const feedSelf = blogFeedUrl(locale);

  // The newest thing in the feed, by whichever date is later — a post revised
  // today is a change to the document this timestamp describes.
  const lastBuild = posts.reduce((newest, post) => {
    const { date, updatedAt } = post.frontmatter;
    for (const candidate of [date, updatedAt]) {
      if (!candidate) continue;
      const parsed = new Date(candidate);
      if (!Number.isNaN(parsed.getTime()) && parsed > newest) newest = parsed;
    }
    return newest;
  }, new Date(0));

  const items = posts
    .map((post) => {
      const { frontmatter } = post;
      const url = `${SITE_URL}/${locale}${postPath(post)}`;
      const author = resolveAuthor(frontmatter.author, locale).name;
      const pubDate = rfc822(new Date(frontmatter.date));
      // Content-versioned like every other media URL. A feed reader caches an
      // enclosure by its address, so an unversioned crop keeps the old framing in
      // every subscriber's client after a focal point moves.
      const coverPath = versionedPath(frontmatter.coverImage?.src) ?? frontmatter.coverImage?.src;
      const coverAbs = coverPath
        ? coverPath.startsWith('http')
          ? coverPath
          : `${SITE_URL}${coverPath}`
        : null;
      const categories = (frontmatter.tags ?? [])
        .map((tag) => `    <category>${xmlEscape(tag)}</category>`)
        .join('\n');
      const enclosure = coverAbs && coverPath ? coverEnclosure(coverAbs, coverPath) : '';

      return `  <item>
    <title>${xmlEscape(frontmatter.title)}</title>
    <link>${xmlEscape(url)}</link>
    <guid isPermaLink="true">${xmlEscape(url)}</guid>
    <pubDate>${pubDate}</pubDate>
    <dc:creator><![CDATA[${escapeCData(author)}]]></dc:creator>
    <description><![CDATA[${escapeCData(frontmatter.excerpt)}]]></description>
${categories}
${enclosure}
  </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>${xmlEscape(channelTitle)}</title>
  <link>${xmlEscape(channelLink)}</link>
  <description>${xmlEscape(channelDescription)}</description>
  <language>${locale}</language>
  <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>
  <atom:link href="${xmlEscape(feedSelf)}" rel="self" type="application/rss+xml" />
  <atom:link href="${xmlEscape(WEBSUB_HUB)}" rel="hub" />
  <generator>park.fan</generator>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
