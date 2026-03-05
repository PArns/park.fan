import type { MetadataRoute } from 'next';
import { getGeoStructure } from '@/lib/api/discovery';
import { locales } from '@/i18n/config';

const BASE_URL = 'https://park.fan';

// 24h revalidation — matches geo structure TTL; attraction slugs rarely change
export const revalidate = 86400;

/**
 * Attractions sitemap — one entry per attraction × locale.
 *
 * Priority 0.7: below parks (1.0) but discoverable for long-tail queries
 * like "[ride name] wait time" or "[ride name] [park name]".
 *
 * changeFrequency hourly because live wait-time data is displayed per
 * attraction page and search engines should re-crawl frequently.
 *
 * Note: variant slugs (e.g. "coaster-2") carry a noindex canonical pointing
 * to the base slug — those pages are intentionally excluded here to avoid
 * wasting crawl budget on duplicate entries.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  try {
    const geo = await getGeoStructure(86400);

    for (const continent of geo.continents) {
      for (const country of continent.countries) {
        for (const city of country.cities) {
          for (const park of city.parks) {
            const parkPath = `/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`;

            for (const attraction of park.attractions) {
              // Skip variant slugs — they end with a digit suffix (e.g. "-2", "-3")
              // and are served as noindex pages pointing to the canonical base slug.
              if (/^.+-\d+$/.test(attraction.slug)) continue;

              for (const locale of locales) {
                routes.push({
                  url: `${BASE_URL}/${locale}${parkPath}/${attraction.slug}`,
                  lastModified: new Date(),
                  changeFrequency: 'hourly',
                  priority: 0.7,
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[sitemap-attractions] Failed to generate attraction sitemap entries:', error);
  }

  return routes;
}
