import { NextResponse } from 'next/server';
import { getGeoStructure, getSitemapAttractions } from '@/lib/api/discovery';
import { submitUrlsToIndexNow } from '@/lib/indexnow';
import { locales } from '@/i18n/config';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/translations';

const BASE_URL = 'https://park.fan';

// Variant slugs like "taron-2" are noindex pages — exclude from IndexNow
const VARIANT_SLUG_RE = /^.+-\d+$/;

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const urls: string[] = [];

  // ── Static pages (high-value, matches sitemap priority ≥ 0.7) ─────────────
  for (const locale of locales) {
    urls.push(`${BASE_URL}/${locale}`); // home
    urls.push(`${BASE_URL}/${locale}/howto`); // guide
    urls.push(`${BASE_URL}/${locale}/${GLOSSARY_SEGMENTS[locale]}`); // glossary overview
  }

  // ── Park pages ─────────────────────────────────────────────────────────────
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

  // ── Attraction pages (long-tail SEO, same filter as sitemap) ───────────────
  try {
    const attractions = await getSitemapAttractions();
    for (const attraction of attractions) {
      if (VARIANT_SLUG_RE.test(attraction.slug)) continue;
      const frontendPath = attraction.url
        .replace(/^\/v1\/parks\//, '/parks/')
        .replace(/\/attractions\//, '/');
      for (const locale of locales) {
        urls.push(`${BASE_URL}/${locale}${frontendPath}`);
      }
    }
  } catch (error) {
    console.error('[IndexNow] Failed to fetch attractions:', error);
    // Non-fatal — continue with what we have
  }

  // IndexNow accepts up to 10 000 URLs per request
  const BATCH_SIZE = 10_000;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    await submitUrlsToIndexNow(urls.slice(i, i + BATCH_SIZE));
  }

  return NextResponse.json({ submitted: urls.length });
}
