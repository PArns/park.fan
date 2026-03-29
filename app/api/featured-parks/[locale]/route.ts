import { NextRequest, NextResponse } from 'next/server';
import { getGeoStructure } from '@/lib/api/discovery';
import { extractFeaturedParks } from '@/components/home/featured-parks-section';
import { locales } from '@/i18n/config';

// Cache for 1 hour — matches geo cache TTL (structure rarely changes)
export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const geoData = await getGeoStructure().catch(() => null);
  const parks = extractFeaturedParks(geoData, locale);

  return NextResponse.json(parks, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
