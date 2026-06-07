import type { NextRequest } from 'next/server';
import { listPosts } from '@/lib/blog';
import { resolveAuthor } from '@/lib/blog/authors';
import { routing, type Locale } from '@/i18n/routing';

const SITE_URL = 'https://park.fan';


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

/**
 * Per-locale RSS 2.0 feed for the blog. RSS readers and aggregators discover
 * new posts here; we also reference it from each blog page via the
 * `<link rel="alternate" type="application/rss+xml">` head tag.
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

  const posts = listPosts(locale).slice(0, 40);
  const channelTitle = locale === 'de' ? 'park.fan Blog' : 'park.fan Blog';
  const channelDescription =
    locale === 'de'
      ? 'Reiseberichte, Daten-Deep-Dives und Park-News vom park.fan-Team.'
      : 'Trip reports, data dives, and theme-park news from the park.fan team.';
  const channelLink = `${SITE_URL}/${locale}/blog`;
  const feedSelf = `${SITE_URL}/${locale}/blog/feed.xml`;

  const lastBuild = posts[0]
    ? new Date(posts[0].frontmatter.updatedAt ?? posts[0].frontmatter.date)
    : new Date();

  const items = posts
    .map((post) => {
      const { frontmatter, slug, readingTimeMinutes } = post;
      const url = `${SITE_URL}/${locale}/blog/${slug}`;
      const author = resolveAuthor(frontmatter.author, locale).name;
      const pubDate = rfc822(new Date(frontmatter.date));
      const cover = frontmatter.coverImage?.src;
      const coverAbs = cover ? (cover.startsWith('http') ? cover : `${SITE_URL}${cover}`) : null;
      const categories = (frontmatter.tags ?? [])
        .map((tag) => `    <category>${escapeXml(tag)}</category>`)
        .join('\n');
      const enclosure = coverAbs
        ? `    <enclosure url="${escapeXml(coverAbs)}" type="image/${
            coverAbs.endsWith('.svg')
              ? 'svg+xml'
              : coverAbs.endsWith('.png')
                ? 'png'
                : coverAbs.endsWith('.webp')
                  ? 'webp'
                  : 'jpeg'
          }" length="0" />`
        : '';
      const descriptionXml = `<![CDATA[${escapeCData(frontmatter.excerpt)}${
        coverAbs ? `<br/><img src="${coverAbs}" alt="${escapeXml(frontmatter.coverImage?.alt ?? frontmatter.title)}" />` : ''
      }]]>`;
      return `  <item>
    <title>${escapeXml(frontmatter.title)}</title>
    <link>${escapeXml(url)}</link>
    <guid isPermaLink="true">${escapeXml(url)}</guid>
    <pubDate>${pubDate}</pubDate>
    <dc:creator><![CDATA[${escapeCData(author)}]]></dc:creator>
    <description>${descriptionXml}</description>
${categories}
${enclosure}
    <comments>${escapeXml(url)}</comments>
    <source url="${escapeXml(feedSelf)}">${escapeXml(channelTitle)}</source>
    <readingTime>${readingTimeMinutes}</readingTime>
  </item>`;
    })
    .join('\n');

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
