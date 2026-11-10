import { NextResponse, type NextRequest } from 'next/server';
import { routing, type Locale } from '@/i18n/routing';
import { SITE_URL } from '@/i18n/config';
import { getPostSearchIndex, type PostSearchEntry } from '@/lib/navigation/blog-menu';
import { searchPosts } from '@/lib/navigation/post-search';
import { cdnCacheHeaders, NO_STORE } from '@/lib/api/cdn-cache-headers';

/**
 * Post search for Parky, the chat assistant on api.park.fan, which has no copy of the blog. The
 * same matching as the site search, cut to what the model needs (title, teaser, date, slug, URL)
 * plus what its post card draws: the guides menu's cover, category and reading time.
 */

const LIMIT = 6;
const KINDS = new Set(['news', 'article', 'any']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** A posts card shows three at most, so a request names no more. */
const MAX_SLUGS = 3;

/**
 * Answers `?locale=&q=&kind=news|article|any` with up to six matches, best first, or
 * `?locale=&slugs=a,b` with exactly those posts, in that order, whatever their kind.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const locale = params.get('locale') ?? '';
  const query = (params.get('q') ?? '').slice(0, 100);
  const kind = params.get('kind') ?? 'any';
  const slugs = params.get('slugs')?.split(',') ?? null;
  if (
    !routing.locales.includes(locale as Locale) ||
    !KINDS.has(kind) ||
    (slugs && (slugs.length > MAX_SLUGS || !slugs.every((slug) => SLUG.test(slug))))
  ) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400, headers: NO_STORE });
  }

  const index = getPostSearchIndex(locale as Locale);
  const slugOf = (entry: PostSearchEntry) => entry.path.split('/').pop() ?? '';
  const { matches, total } = slugs
    ? (() => {
        const found = slugs.flatMap((slug) => index.find((entry) => slugOf(entry) === slug) ?? []);
        return { matches: found, total: found.length };
      })()
    : searchPosts(
        index.filter((entry) => kind === 'any' || (kind === 'news') === Boolean(entry.news)),
        query,
        LIMIT
      );
  return NextResponse.json(
    {
      total,
      posts: matches.map((entry) => ({
        title: entry.title,
        description: entry.excerpt ?? null,
        date: entry.date,
        updated: entry.updated,
        kind: entry.news ? 'news' : 'article',
        slug: slugOf(entry),
        url: `${SITE_URL}/${locale}${entry.path}`,
        readingTimeMinutes: entry.readingTimeMinutes,
        category: entry.category ?? null,
        image: entry.image ?? null,
        imagePosition: entry.imagePosition ?? null,
      })),
    },
    {
      headers: cdnCacheHeaders('public, max-age=600, s-maxage=600, stale-while-revalidate=86400'),
    }
  );
}
