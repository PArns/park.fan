import type { MetadataRoute } from 'next';
import { getGeoStructure, getSitemapAttractions } from '@/lib/api/discovery';
import { locales } from '@/i18n/config';

const BASE_URL = 'https://park.fan';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  const [geo, attractions] = await Promise.all([getGeoStructure(86400), getSitemapAttractions()]);

  // Static pages
  const staticPaths = ['', '/parks', '/datenschutz', '/impressum'];
  for (const path of staticPaths) {
    for (const locale of locales) {
      routes.push({
        url: `${BASE_URL}/${locale}${path}`,
        changeFrequency: 'weekly',
        priority: path === '' ? 1 : 0.5,
      });
    }
  }

  // Geo listing pages + park pages
  for (const continent of geo.continents) {
    for (const locale of locales) {
      routes.push({
        url: `${BASE_URL}/${locale}/parks/${continent.slug}`,
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }

    for (const country of continent.countries) {
      for (const locale of locales) {
        routes.push({
          url: `${BASE_URL}/${locale}/parks/${continent.slug}/${country.slug}`,
          changeFrequency: 'weekly',
          priority: 0.5,
        });
      }

      for (const city of country.cities) {
        for (const locale of locales) {
          routes.push({
            url: `${BASE_URL}/${locale}/parks/${continent.slug}/${country.slug}/${city.slug}`,
            changeFrequency: 'weekly',
            priority: 0.5,
          });
        }

        for (const park of city.parks) {
          for (const locale of locales) {
            routes.push({
              url: `${BASE_URL}/${locale}/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
              changeFrequency: 'hourly',
              priority: 1,
            });
          }
        }
      }
    }
  }

  // Attraction pages — from dedicated sitemap endpoint
  // API url format: /v1/parks/europe/germany/rust/europa-park/attractions/blue-fire
  // Frontend format: /parks/europe/germany/rust/europa-park/blue-fire
  for (const attraction of attractions) {
    const frontendPath = attraction.url
      .replace(/^\/v1\/parks\//, '/parks/')
      .replace(/\/attractions\//, '/');

    for (const locale of locales) {
      routes.push({
        url: `${BASE_URL}/${locale}${frontendPath}`,
        changeFrequency: 'hourly',
        priority: 0.7,
      });
    }
  }

  return routes;
}
