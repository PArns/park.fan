import { NextRequest, NextResponse } from 'next/server';
import { getGeoStructure } from '@/lib/api/discovery';
import { extractFeaturedParks } from '@/components/home/featured-parks-section';
import { locales } from '@/i18n/config';

export const revalidate = 300;

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

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
