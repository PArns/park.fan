import { api } from './client';
import type {
  ParkResponse,
  ParkWithAttractions,
  PaginatedResponse,
  ScheduleItem,
  WeatherData,
  ParkDailyPrediction,
  HolidayResponse,
} from './types';

// Cache tags for revalidation
export const PARK_CACHE_TAGS = {
  list: 'parks-list',
  detail: (slug: string) => `park-${slug}`,
  waitTimes: (slug: string) => `park-${slug}-wait-times`,
  schedule: (slug: string) => `park-${slug}-schedule`,
  weather: (slug: string) => `park-${slug}-weather`,
  predictions: (slug: string) => `park-${slug}-predictions`,
};

/**
 * Get all parks (paginated)
 */
export async function getParks(): Promise<PaginatedResponse<ParkResponse>> {
  return api.get<PaginatedResponse<ParkResponse>>('/v1/parks', {
    next: { revalidate: 60, tags: [PARK_CACHE_TAGS.list] },
  });
}

/**
 * Get a specific park by slug with all attractions
 */
export async function getPark(slug: string): Promise<ParkWithAttractions> {
  return api.get<ParkWithAttractions>(`/v1/parks/${slug}`, {
    next: { revalidate: 300, tags: [PARK_CACHE_TAGS.detail(slug)] },
  });
}

/**
 * Get parks by geographic path
 */
export async function getParkByGeoPath(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<ParkWithAttractions> {
  return api.get<ParkWithAttractions>(`/v1/parks/${continent}/${country}/${city}/${parkSlug}`, {
    next: { revalidate: 300 },
  });
}

/**
 * Get parks in a continent
 */
export async function getParksByContinent(
  continent: string
): Promise<ParkWithAttractions | ParkResponse[]> {
  return api.get<ParkWithAttractions | ParkResponse[]>(`/v1/parks/${continent}`, {
    next: { revalidate: 3600 },
  });
}

/**
 * Get parks in a country
 */
export async function getParksByCountry(
  continent: string,
  country: string
): Promise<ParkResponse[]> {
  return api.get<ParkResponse[]>(`/v1/parks/${continent}/${country}`, {
    next: { revalidate: 3600 },
  });
}

/**
 * Get parks in a city
 */
export async function getParksByCity(
  continent: string,
  country: string,
  city: string
): Promise<ParkResponse[]> {
  return api.get<ParkResponse[]>(`/v1/parks/${continent}/${country}/${city}`, {
    next: { revalidate: 1800 },
  });
}

/**
 * Get park schedule
 */
export async function getParkSchedule(
  slug: string,
  from: string,
  to: string
): Promise<{ schedule: ScheduleItem[] }> {
  return api.get<{ schedule: ScheduleItem[] }>(`/v1/parks/${slug}/schedule`, {
    params: { from, to },
    next: { revalidate: 3600, tags: [PARK_CACHE_TAGS.schedule(slug)] },
  });
}

/**
 * Get park weather forecast (16 days)
 */
export async function getParkWeather(slug: string): Promise<WeatherData> {
  return api.get<WeatherData>(`/v1/parks/${slug}/weather/forecast`, {
    next: { revalidate: 1800, tags: [PARK_CACHE_TAGS.weather(slug)] },
  });
}

/**
 * Get yearly crowd predictions
 */
export async function getParkYearlyPredictions(slug: string): Promise<{
  park: { id: string; name: string; slug: string };
  predictions: ParkDailyPrediction[];
  generatedAt: string;
}> {
  return api.get(`/v1/parks/${slug}/predictions/yearly`, {
    next: { revalidate: 3600, tags: [PARK_CACHE_TAGS.predictions(slug)] },
  });
}

/**
 * Get holidays for a park's country
 */
export async function getParkHolidays(slug: string, year: number): Promise<HolidayResponse> {
  return api.get<HolidayResponse>(`/v1/parks/${slug}/holidays`, {
    params: { year },
    next: { revalidate: 86400 }, // 24 hours
  });
}
