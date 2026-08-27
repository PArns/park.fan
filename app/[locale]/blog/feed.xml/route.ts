import fs from 'node:fs';
import path from 'node:path';
import type { NextRequest } from 'next/server';
import { hasPublishedPosts, listPosts } from '@/lib/blog/listing';
import { getPostByTranslationKey } from '@/lib/blog';
import { resolveAuthor } from '@/lib/blog/authors';
import { routing, type Locale } from '@/i18n/routing';
import { SITE_URL } from '@/i18n/config';
import { versionedPath } from '@/lib/media/focus';
import { getMediaImageBySrc } from '@/lib/media';
import { WEBSUB_HUB } from '@/lib/websub';
import { BLOG_FEED_DESCRIPTION, BLOG_FEED_TITLE, blogFeedUrl } from '@/lib/blog/feed';
import { renderFeedContentHtml } from '@/lib/blog/feed-content';

/**
 * How many items a feed carries.
 *
 * Was 40, which was free while items were an excerpt each and is not now that
 * they carry the article: nine posts already weigh ~390 KB per locale, so 40
 * would be roughly 1.7 MB fetched by every subscriber's reader on every poll.
 * Fifteen keeps a full-text feed near half a megabyte at the point the blog
 * grows into the cap, and everything older stays where an archive belongs — the
 * blog index, the category pages and the sitemap.
 */
const MAX_ITEMS = 15;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
 * The cover image as an `<enclosure>`, with its real byte count.
 *
 * `length` is required by RSS and this feed used to hard-code `0`, which some
 * readers take at face value and use to decide whether to prefetch. The number
 * is measured off the file rather than read from the media database, because a
 * frontmatter cover is usually a build-time crop (`…-16x9.jpg`) and the
 * database's `bytes` describes the **source** photo — `getMediaImageForPath`
 * documents exactly that trap. The route is statically generated, so this stat
 * happens at build time.
 *
 * A file we cannot measure still gets an enclosure: a missing cover is a worse
 * outcome than an unknown size, and `0` is what the previous version said about
 * every image anyway.
 */
function coverEnclosure(coverAbs: string, coverPath: string): string {
  const clean = coverPath.split('?')[0];
  const extension = clean.split('.').pop()?.toLowerCase() ?? '';
  const type = MIME_BY_EXTENSION[extension] ?? 'image/jpeg';

  let length = 0;
  if (clean.startsWith('/')) {
    try {
      length = fs.statSync(path.join(process.cwd(), 'public', clean.slice(1))).size;
    } catch {
      // Not on disk at build time (a remote cover, a crop not cut in this build).
      length = getMediaImageBySrc(clean)?.bytes ?? 0;
    }
  }
  return `    <enclosure url="${escapeXml(coverAbs)}" type="${type}" length="${length}" />`;
}

/**
 * Per-locale RSS 2.0 feed for the blog.
 *
 * Three things here are deliberate and were each wrong before:
 *
 * **Order is publication order, strictly.** `listPosts` sorts featured-first so
 * a pinned article leads every listing on the site, which is right for a page
 * and wrong for a feed: `lastBuildDate` was read off `posts[0]`, so pinning an
 * older post moved the channel's timestamp backwards and told every subscriber
 * the feed had gotten older.
 *
 * **Items carry the full article** (`content:encoded`), not just the excerpt.
 * The namespace was declared and never used. What a body cannot carry into a
 * feed — the live widget tables — is linked rather than frozen; see
 * `renderFeedContentHtml`.
 *
 * **Only elements RSS actually defines.** The old items ended with
 * `<readingTime>`, an invented element in no namespace, plus a `<comments>`
 * pointing at the post itself and a `<source>` naming this very feed. `source`
 * means "this item was republished from somewhere else", so every item claimed
 * to be a repost of itself.
 *
 * Discovery is the other half and lives in `lib/blog/feed.ts`: a feed nobody
 * links to from a `<head>` is a file with a URL.
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

  const items = (
    await Promise.all(
      posts.map(async (post) => {
        const { frontmatter, slug, translationKey } = post;
        const url = `${SITE_URL}/${locale}/blog/${slug}`;
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
          .map((tag) => `    <category>${escapeXml(tag)}</category>`)
          .join('\n');
        const enclosure = coverAbs && coverPath ? coverEnclosure(coverAbs, coverPath) : '';

        // The body, rendered for a reader with no stylesheet and no JavaScript.
        // A post whose body will not load still ships as title + excerpt rather
        // than dropping out of the feed.
        const loaded = getPostByTranslationKey(translationKey, locale);
        const contentHtml = loaded?.content
          ? await renderFeedContentHtml(loaded.content, { locale, postUrl: url })
          : '';
        const coverFigure = coverAbs
          ? `<figure><img src="${escapeXml(coverAbs)}" alt="${escapeXml(
              frontmatter.coverImage?.alt ?? frontmatter.title
            )}" /></figure>`
          : '';
        const encoded = contentHtml
          ? `    <content:encoded><![CDATA[${escapeCData(`${coverFigure}${contentHtml}`)}]]></content:encoded>\n`
          : '';

        return `  <item>
    <title>${escapeXml(frontmatter.title)}</title>
    <link>${escapeXml(url)}</link>
    <guid isPermaLink="true">${escapeXml(url)}</guid>
    <pubDate>${pubDate}</pubDate>
    <dc:creator><![CDATA[${escapeCData(author)}]]></dc:creator>
    <description><![CDATA[${escapeCData(frontmatter.excerpt)}]]></description>
${encoded}${categories}
${enclosure}
  </item>`;
      })
    )
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>${escapeXml(channelTitle)}</title>
  <link>${escapeXml(channelLink)}</link>
  <description>${escapeXml(channelDescription)}</description>
  <language>${locale}</language>
  <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>
  <atom:link href="${escapeXml(feedSelf)}" rel="self" type="application/rss+xml" />
  <atom:link href="${escapeXml(WEBSUB_HUB)}" rel="hub" />
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
