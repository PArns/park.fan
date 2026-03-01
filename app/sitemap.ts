import type { MetadataRoute } from 'next';
import { getGeoStructure } from '@/lib/api/discovery';
import { locales } from '@/i18n/config';

const BASE_URL = 'https://park.fan';

export const revalidate = 86400; // 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  // ── 1. Home (root x-default + all locales) ─────────────────── priority 1.0
  routes.push({
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  });
  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    });
  }

  // ── 2. Parks overview ──────────────────────────────────────── priority 0.9
  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}/parks`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });
  }

  // ── 3. Individual park pages ──────────────────────────────── priority 1.0
  // Attraction pages are intentionally excluded — Google discovers them via
  // internal links from park pages, keeping crawl budget focused on high-value URLs.
  try {
    const geo = await getGeoStructure(86400);

    for (const continent of geo.continents) {
      for (const country of continent.countries) {
        for (const city of country.cities) {
          for (const park of city.parks) {
            const parkPath = `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`;
            for (const locale of locales) {
              routes.push({
                url: `${BASE_URL}/${locale}${parkPath}`,
                lastModified: new Date(),
                changeFrequency: 'hourly',
                priority: 1,
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to generate park sitemap entries:', error);
  }

  return routes;
}
