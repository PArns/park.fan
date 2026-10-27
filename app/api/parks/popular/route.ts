import { NextRequest, NextResponse } from 'next/server';
import { getMostViewedParks, getPopularParks } from '@/lib/api/parks';
import { NO_STORE } from '@/lib/api/cdn-cache-headers';
import { routing, type Locale } from '@/i18n/routing';

/**
 * The most popular parks. With `locale`, the ones that language's readers opened most
 * (`getMostViewedParks`, the hero's fallback); without, the API's request ranking, which the
 * maintenance page also polls to see whether the API is back.
 */
export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const limitParam = params.get('limit');
  const parsed = limitParam ? Number.parseInt(limitParam, 10) : 20;
  const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 20;
  const localeParam = params.get('locale');
  const locale = routing.locales.includes(localeParam as Locale) ? (localeParam as Locale) : null;

  try {
    const data = locale ? await getMostViewedParks(locale, limit) : await getPopularParks(limit);
    return NextResponse.json(data, {
      headers: NO_STORE,
    });
  } catch (error) {
    console.error('[Popular Parks API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch popular parks' }, { status: 500 });
  }
}
