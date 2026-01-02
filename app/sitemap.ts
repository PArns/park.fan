import { MetadataRoute } from 'next';
import { getContinents, getCountriesWithParks } from '@/lib/api/discovery';

const BASE_URL = 'https://park.fan';

const locales = ['de', 'en'];

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

  // Add root as x-default (if needed, or just rely on the above)
  routes.push({
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  });

  // 2. Dynamic Routes (Parks hierarchy)
  try {
    const continents = await getContinents();

    for (const continent of continents) {
      // Continent Page (Localized)
      locales.forEach((locale) => {
        routes.push({
          url: `${BASE_URL}/${locale}/parks/${continent.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      });

      // Fetch countries for this continent to get deeper links
      const countryData = await getCountriesWithParks(continent.slug);

      for (const country of countryData.data) {
        // Country Page (Localized)
        locales.forEach((locale) => {
          routes.push({
            url: `${BASE_URL}/${locale}/parks/${continent.slug}/${country.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        });

        for (const city of country.cities) {
          // City Page (Localized)
          locales.forEach((locale) => {
            routes.push({
              url: `${BASE_URL}/${locale}/parks/${continent.slug}/${country.slug}/${city.slug}`,
              lastModified: new Date(),
              changeFrequency: 'weekly',
              priority: 0.6,
            });
          });

          // Parks in this city (Localized)
          for (const park of city.parks) {
            locales.forEach((locale) => {
              routes.push({
                url: `${BASE_URL}/${locale}/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.9,
              });
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
  }

  return routes;
}
