import { StatisticsData } from './api-types';

const API_BASE_URL = 'https://api.park.fan';

export async function fetchStatistics(): Promise<StatisticsData> {
  try {
    const response = await fetch(`${API_BASE_URL}/statistics`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'park.fan-dashboard/1.0',
      },
      // Revalidate every 5 minutes
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    throw error;
  }
}

// Helper function to transform data for components
export function transformStatisticsData(data: StatisticsData) {
  const continentsForComponent =
    data.parksByContinent?.reduce(
      (acc, continent) => {
        acc[continent.continent] = continent.totalParks;
        return acc;
      },
      {} as { [key: string]: number }
    ) || {};

  const countriesForComponent =
    data.parksByCountry?.map((country) => ({
      country: country.country,
      totalParks: country.totalParks,
      openParks: country.openParks,
      closedParks: country.closedParks,
      operatingPercentage: country.operatingPercentage,
      flag: getCountryFlag(country.country),
    })) || [];

  return {
    ...data,
    // Transform continents data for component
    continentsForComponent,

    // Transform countries data for component
    countriesForComponent,
  };
}

// Helper function to get country flags
export function getCountryFlag(country: string): string {
  const flagMap: { [key: string]: string } = {
    Germany: '🇩🇪',
    'United States': '🇺🇸',
    Japan: '🇯🇵',
    France: '🇫🇷',
    'United Kingdom': '🇬🇧',
    England: '🇬🇧',
    China: '🇨🇳',
    Spain: '🇪🇸',
    Italy: '🇮🇹',
    Netherlands: '🇳🇱',
    Belgium: '🇧🇪',
    Austria: '🇦🇹',
    Switzerland: '🇨🇭',
    Denmark: '🇩🇰',
    Sweden: '🇸🇪',
    Norway: '🇳🇴',
    Finland: '🇫🇮',
    Australia: '🇦🇺',
    Canada: '🇨🇦',
    Brazil: '🇧🇷',
    Mexico: '🇲🇽',
    'South Korea': '🇰🇷',
  };

  return flagMap[country] || '🏁';
}
