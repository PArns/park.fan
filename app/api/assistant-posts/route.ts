import { NextResponse, type NextRequest } from 'next/server';
import { routing, type Locale } from '@/i18n/routing';
import { SITE_URL } from '@/i18n/config';
import { getPostSearchIndex } from '@/lib/navigation/blog-menu';
import { searchPosts } from '@/lib/navigation/post-search';
import { cdnCacheHeaders, NO_STORE } from '@/lib/api/cdn-cache-headers';

/**
 * Post search for Parky, the chat assistant on api.park.fan, which has no copy of the blog. The
 * same matching as the site search, cut to what the model needs: title, teaser, date, slug, URL.
 */

const LIMIT = 6;
const KINDS = new Set(['news', 'article', 'any']);

/** Answers `?locale=&q=&kind=news|article|any` with up to six matches, best first. */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const locale = params.get('locale') ?? '';
  const query = (params.get('q') ?? '').slice(0, 100);
  const kind = params.get('kind') ?? 'any';
  if (!routing.locales.includes(locale as Locale) || !KINDS.has(kind)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400, headers: NO_STORE });
  }

  const entries = getPostSearchIndex(locale as Locale).filter(
    (entry) => kind === 'any' || (kind === 'news') === Boolean(entry.news)
  );
  const { matches, total } = searchPosts(entries, query, LIMIT);
  return NextResponse.json(
    {
      total,
      posts: matches.map((entry) => ({
        title: entry.title,
        description: entry.excerpt ?? null,
        date: entry.date,
        kind: entry.news ? 'news' : 'article',
        slug: entry.path.split('/').pop(),
        url: `${SITE_URL}/${locale}${entry.path}`,
      })),
    },
    {
      headers: cdnCacheHeaders('public, max-age=600, s-maxage=600, stale-while-revalidate=86400'),
    }
  );
}
