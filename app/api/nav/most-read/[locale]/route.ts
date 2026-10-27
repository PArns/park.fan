import { NextResponse } from 'next/server';
import { routing, type Locale } from '@/i18n/routing';
import { getMostRead } from '@/lib/blog/most-read';
import { cdnCacheHeaders, NO_STORE } from '@/lib/api/cdn-cache-headers';

/**
 * The most read articles (30 days) and news (7 days) of one locale, for the header menu, the
 * homepage and the foot of a post, fetched by the browser rather than rendered into those pages:
 * the homepage shell is a week old and the menu sits on every page. An hour at the edge, the API's
 * own window for the ranking; a failed ranking is a 502 nobody keeps, never an empty list that
 * would be served for that hour. See docs/features/most-read.md.
 */

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!routing.locales.includes(rawLocale as Locale)) {
    return NextResponse.json({ error: 'Unknown locale' }, { status: 404, headers: NO_STORE });
  }
  try {
    return NextResponse.json(await getMostRead(rawLocale as Locale), {
      headers: cdnCacheHeaders('public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'),
    });
  } catch {
    return NextResponse.json({ error: 'Ranking unavailable' }, { status: 502, headers: NO_STORE });
  }
}
