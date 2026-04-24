import { NextRequest, NextResponse } from 'next/server';
import { getGeoStructure } from '@/lib/api/discovery';
import { extractFeaturedParks } from '@/components/home/featured-parks-section';
import { locales } from '@/i18n/config';

// 5 min — geo structure is stable, but live stats (crowdLevel, avgWaitTime) refresh every 5 min on the backend
export const revalidate = 300;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const geoData = await getGeoStructure(300).catch(() => null);
  const parks = extractFeaturedParks(geoData, locale);

  return NextResponse.json(parks, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
