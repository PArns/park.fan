import { MetadataRoute } from 'next';
import { fetchStatistics, fetchContinentDetails, normalizePathSegment } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://park.fan';

  try {
    // Get all data from statistics
    const stats = await fetchStatistics();

    const urls: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/analytics`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/parks`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
    ];

    // Add continent pages (/parks/[continent])
    const continents = [
      ...new Set(stats.parksByContinent?.map((c) => normalizePathSegment(c.continent)) || []),
    ];

    for (const continent of continents) {
      urls.push({
        url: `${baseUrl}/parks/${continent}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });

      try {
        // Get detailed data for this continent
        const continentDetails = await fetchContinentDetails(continent);

        // Group parks by country
        const parksByCountry = continentDetails.data.reduce(
          (acc, park) => {
            if (!acc[park.country]) {
              acc[park.country] = [];
            }
            acc[park.country].push(park);
            return acc;
          },
          {} as Record<string, typeof continentDetails.data>
        );

        // Add country pages (/parks/[continent]/[country])
        for (const [country, parks] of Object.entries(parksByCountry)) {
          const countrySlug = normalizePathSegment(country);

          urls.push({
            url: `${baseUrl}/parks/${continent}/${countrySlug}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
          });

          // Add park pages (/parks/[continent]/[country]/[park])
          for (const park of parks.slice(0, 50)) {
            // Limit to prevent too many URLs
            const parkSlug = normalizePathSegment(park.name);

            urls.push({
              url: `${baseUrl}/parks/${continent}/${countrySlug}/${parkSlug}`,
              lastModified: new Date(),
              changeFrequency: 'hourly',
              priority: 0.6,
            });

            // Add some popular ride pages (/parks/[continent]/[country]/[park]/[ride])
            for (const themeArea of park.themeAreas || []) {
              for (const ride of themeArea.rides.slice(0, 5)) {
                // Limit rides per park
                if (ride.isActive) {
                  const rideSlug = normalizePathSegment(ride.name);

                  urls.push({
                    url: `${baseUrl}/parks/${continent}/${countrySlug}/${parkSlug}/${rideSlug}`,
                    lastModified: new Date(),
                    changeFrequency: 'hourly',
                    priority: 0.5,
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching continent details for ${continent}:`, error);
      }
    }

    return urls;
  } catch (error) {
    console.error('Error generating sitemap:', error);

    // Return minimal sitemap on error
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/parks`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
    ];
  }
}
