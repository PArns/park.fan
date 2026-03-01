import { NextResponse } from 'next/server';
import { getGeoStructure } from '@/lib/api/discovery';
import { submitUrlsToIndexNow } from '@/lib/indexnow';
import { locales } from '@/i18n/config';

const BASE_URL = 'https://park.fan';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const urls: string[] = [BASE_URL];

  // Home + parks overview for all locales
  for (const locale of locales) {
    urls.push(`${BASE_URL}/${locale}`);
    urls.push(`${BASE_URL}/${locale}/parks`);
  }

  // All individual park pages
  try {
    const geo = await getGeoStructure(86400);

    for (const continent of geo.continents) {
      for (const country of continent.countries) {
        for (const city of country.cities) {
          for (const park of city.parks) {
            const parkPath = `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`;
            for (const locale of locales) {
              urls.push(`${BASE_URL}/${locale}${parkPath}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[IndexNow] Failed to fetch geo structure:', error);
    return NextResponse.json({ error: 'Failed to fetch geo structure' }, { status: 500 });
  }

  // IndexNow accepts up to 10 000 URLs per request
  const BATCH_SIZE = 10_000;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    await submitUrlsToIndexNow(urls.slice(i, i + BATCH_SIZE));
  }

  return NextResponse.json({ submitted: urls.length });
}
