import type { MetadataRoute } from 'next';
import { getGeoStructure } from '@/lib/api/discovery';
import { locales } from '@/i18n/config';

const BASE_URL = 'https://park.fan';

// 24h revalidation — geo structure rarely changes
export const revalidate = 86400;

/**
 * Geo-structure sitemap — continent, country, and city listing pages.
 * These hub pages were previously missing from the sitemap entirely.
 * Priority 0.8 (below individual parks at 1.0, above static pages).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  try {
    const geo = await getGeoStructure(86400);

    for (const continent of geo.continents) {
      // Continent pages
      for (const locale of locales) {
        routes.push({
          url: `${BASE_URL}/${locale}/parks/${continent.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }

      for (const country of continent.countries) {
        // Country pages
        for (const locale of locales) {
          routes.push({
            url: `${BASE_URL}/${locale}/parks/${continent.slug}/${country.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }

        for (const city of country.cities) {
          // Skip single-park cities — they redirect to the park page
          if (city.parks.length <= 1) continue;

          for (const locale of locales) {
            routes.push({
              url: `${BASE_URL}/${locale}/parks/${continent.slug}/${country.slug}/${city.slug}`,
              lastModified: new Date(),
              changeFrequency: 'weekly',
              priority: 0.6,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('[sitemap-geo] Failed to generate geo sitemap entries:', error);
  }

  return routes;
}
