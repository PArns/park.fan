import { NextResponse } from 'next/server';
import { routing, type Locale } from '@/i18n/routing';
import { getBlogMenuSearchIndex } from '@/lib/navigation/blog-menu';
import { cdnCacheHeaders } from '@/lib/api/cdn-cache-headers';

/**
 * Every article of one locale, for the search field in the header's blog panel. Fetched when the
 * field is first pointed at or focused rather than rendered into the layout, because the chrome is
 * paid for by every page view (see `getBlogMenuSearchIndex`). Static per deployment; ten minutes at
 * the edge, like `/api/blog-latest`, so a new guide is findable soon after its deploy.
 */

export const dynamic = 'force-static';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!routing.locales.includes(rawLocale as Locale)) {
    return NextResponse.json({ error: 'Unknown locale' }, { status: 404 });
  }

  return NextResponse.json(
    { posts: getBlogMenuSearchIndex(rawLocale as Locale) },
    {
      headers: cdnCacheHeaders('public, max-age=600, s-maxage=600, stale-while-revalidate=86400'),
    }
  );
}
