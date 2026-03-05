import type { MetadataRoute } from 'next';
import { getGeoStructure } from '@/lib/api/discovery';
import { locales } from '@/i18n/config';

const BASE_URL = 'https://park.fan';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

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

          for (const attraction of park.attractions) {
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

  return routes;
}
