import type { MetadataRoute } from 'next';
import { getGeoStructure } from '@/lib/api/discovery';
import { locales } from '@/i18n/config';

const BASE_URL = 'https://park.fan';

export const revalidate = 86400; // 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  // 1. Static Routes (Home)
  locales.forEach((locale) => {
    routes.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    });
  });

  // Add root as x-default
  routes.push({
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  });

  // 1.1 Parks Overview
  locales.forEach((locale) => {
    routes.push({
      url: `${BASE_URL}/${locale}/parks`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });
  });

  // 2. Dynamic Routes (Parks hierarchy) from single API call
  try {
    const geo = await getGeoStructure(86400);

    for (const continent of geo.continents) {
      // Continent Page
      locales.forEach((locale) => {
        routes.push({
          url: `${BASE_URL}/${locale}/parks/${continent.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      });

      for (const country of continent.countries) {
        // Country Page
        locales.forEach((locale) => {
          routes.push({
            url: `${BASE_URL}/${locale}/parks/${continent.slug}/${country.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        });

        for (const city of country.cities) {
          // City Page
          locales.forEach((locale) => {
            routes.push({
              url: `${BASE_URL}/${locale}/parks/${continent.slug}/${country.slug}/${city.slug}`,
              lastModified: new Date(),
              changeFrequency: 'weekly',
              priority: 0.6,
            });
          });

          // Parks in this city
          for (const park of city.parks) {
            locales.forEach((locale) => {
              routes.push({
                url: `${BASE_URL}/${locale}/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.9,
              });
            });

            // Attractions
            if (park.attractions && park.attractions.length > 0) {
              for (const attraction of park.attractions) {
                locales.forEach((locale) => {
                  routes.push({
                    url: `${BASE_URL}/${locale}/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}/${attraction.slug}`,
                    lastModified: new Date(),
                    changeFrequency: 'daily',
                    priority: 0.7,
                  });
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
  }

  return routes;
}
