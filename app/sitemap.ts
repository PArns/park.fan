import type { MetadataRoute } from 'next';
import { getGeoStructure } from '@/lib/api/discovery';
import { locales } from '@/i18n/config';

const BASE_URL = 'https://park.fan';

// 1h revalidation — park pages contain live wait-time data
export const revalidate = 3600;

/**
 * Primary sitemap — home pages + all park pages.
 * These are the highest-value URLs on the site (priority 1.0).
 * Geo-structure hub pages and attraction pages live in dedicated sitemaps.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  // Home pages (priority 1.0, daily)
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

  // Parks overview per locale (priority 0.9, daily)
  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}/parks`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });
  }

  // Individual park pages (priority 1.0, hourly)
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
    console.error('[sitemap] Failed to generate park sitemap entries:', error);
  }

  return routes;
}
