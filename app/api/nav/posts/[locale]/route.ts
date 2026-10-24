import { NextResponse } from 'next/server';
import { routing, type Locale } from '@/i18n/routing';
import { getPostSearchIndex } from '@/lib/navigation/blog-menu';
import { cdnCacheHeaders, NO_STORE } from '@/lib/api/cdn-cache-headers';

/**
 * Every post of one locale, articles and news, for the site search: the guides panel, the fields
 * on `/blog` and `/news` and the search palette. Fetched by the first search rather than rendered
 * into a page, because a page is paid for by every view (see `getPostSearchIndex`). Static per
 * deployment; ten minutes at the edge, like `/api/blog-latest`, so a new post is findable soon
 * after its deploy.
 */

export const dynamic = 'force-static';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!routing.locales.includes(rawLocale as Locale)) {
    return NextResponse.json({ error: 'Unknown locale' }, { status: 404, headers: NO_STORE });
  }

  return NextResponse.json(
    { posts: getPostSearchIndex(rawLocale as Locale) },
    {
      headers: cdnCacheHeaders('public, max-age=600, s-maxage=600, stale-while-revalidate=86400'),
    }
  );
}
