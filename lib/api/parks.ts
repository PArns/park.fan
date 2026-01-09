import { api } from './client';
import { CACHE_TTL } from './cache-config';
import type {
  ParkResponse,
  ParkWithAttractions,
  PaginatedResponse,
  ScheduleItem,
  WeatherData,
  ParkDailyPrediction,
  HolidayResponse,
  AttractionResponse,
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
    next: { revalidate: CACHE_TTL.parks, tags: [PARK_CACHE_TAGS.list] },
  });
}

/**
 * Get a specific park by slug with all attractions
 */
export async function getPark(slug: string): Promise<ParkWithAttractions> {
  return api.get<ParkWithAttractions>(`/v1/parks/${slug}`, {
    next: { revalidate: CACHE_TTL.parkDetail, tags: [PARK_CACHE_TAGS.detail(slug)] },
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
    next: { revalidate: CACHE_TTL.parkDetail },
  });
}

/**
 * Get parks in a continent
 */
export async function getParksByContinent(
  continent: string
): Promise<ParkWithAttractions | ParkResponse[]> {
  return api.get<ParkWithAttractions | ParkResponse[]>(`/v1/parks/${continent}`, {
    next: { revalidate: CACHE_TTL.continents },
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
    next: { revalidate: CACHE_TTL.continents },
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
    next: { revalidate: CACHE_TTL.parks },
  });
}

/**
 * Get park schedule (geographic route)
 */
export async function getParkSchedule(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  from: string,
  to: string
): Promise<{ schedule: ScheduleItem[] }> {
  return api.get<{ schedule: ScheduleItem[] }>(
    `/v1/parks/${continent}/${country}/${city}/${parkSlug}/schedule`,
    {
      params: { from, to },
      next: { revalidate: CACHE_TTL.calendar, tags: [PARK_CACHE_TAGS.schedule(parkSlug)] },
    }
  );
}

/**
 * Get park weather forecast (16 days) - geographic route
 */
export async function getParkWeather(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<WeatherData> {
  return api.get<WeatherData>(
    `/v1/parks/${continent}/${country}/${city}/${parkSlug}/weather/forecast`,
    {
      next: { revalidate: CACHE_TTL.weather, tags: [PARK_CACHE_TAGS.weather(parkSlug)] },
    }
  );
}

/**
 * Get yearly crowd predictions (geographic route)
 */
export async function getParkYearlyPredictions(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<{
  park: { id: string; name: string; slug: string };
  predictions: ParkDailyPrediction[];
  generatedAt: string;
}> {
  return api.get(`/v1/parks/${continent}/${country}/${city}/${parkSlug}/predictions/yearly`, {
    next: { revalidate: CACHE_TTL.predictions, tags: [PARK_CACHE_TAGS.predictions(parkSlug)] },
  });
}

/**
 * Get holidays for a park's country (geographic route)
 * Note: Holidays are also included in the integrated calendar endpoint
 */
export async function getParkHolidays(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  year: number
): Promise<HolidayResponse> {
  return api.get<HolidayResponse>(
    `/v1/parks/${continent}/${country}/${city}/${parkSlug}/holidays`,
    {
      params: { year },
      next: { revalidate: CACHE_TTL.holidays },
    }
  );
}

/**
 * Get a specific attraction by geographic path with full data including history
 */
export async function getAttractionByGeoPath(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  attractionSlug: string
): Promise<AttractionResponse> {
  return api.get<AttractionResponse>(
    `/v1/parks/${continent}/${country}/${city}/${parkSlug}/attractions/${attractionSlug}`,
    {
      next: { revalidate: CACHE_TTL.parkDetail },
    }
  );
}
