import { MetadataRoute } from 'next';
import { getContinents, getCountriesWithParks } from '@/lib/api/discovery';

const BASE_URL = 'https://park.fan';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/de`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // Fetch all geo data structure to build routes
  // We'll traverse the hierarchy: Continents -> Countries -> Cities -> Parks
  try {
    const continents = await getContinents();

    for (const continent of continents) {
      // Continent Page
      routes.push({
        url: `${BASE_URL}/parks/${continent.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });

      // Fetch countries for this continent to get deeper links
      const countryData = await getCountriesWithParks(continent.slug);

      for (const country of countryData.data) {
        // Country Page
        routes.push({
          url: `${BASE_URL}/parks/${continent.slug}/${country.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });

        for (const city of country.cities) {
          // City Page
          routes.push({
            url: `${BASE_URL}/parks/${continent.slug}/${country.slug}/${city.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
          });

          // Parks in this city
          for (const park of city.parks) {
            routes.push({
              url: `${BASE_URL}/parks/${continent.slug}/${country.slug}/${city.slug}/${park.slug}`,
              lastModified: new Date(),
              changeFrequency: 'daily',
              priority: 0.9,
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
