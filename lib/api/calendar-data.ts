import { CACHE_TTL } from './cache-config';
import type { HolidayItem, HolidayResponse } from '@/lib/api/types';

// Use proxy for client-side, direct live URL for server-side
const getApiBaseUrl = () => {
  // Server-side: use live API directly
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan';
  }
  // Client-side: use relative path to trigger Next.js proxy
  return '';
};

/**
 * Fetch holidays for a specific park and year (geographic route)
 * Note: Holidays are also included in the integrated calendar endpoint
 */
export async function getParkHolidays(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  year: number = new Date().getFullYear()
): Promise<HolidayItem[]> {
  try {
    const API_BASE_URL = getApiBaseUrl();
    // Use the geographic holiday endpoint: /v1/parks/{continent}/{country}/{city}/{parkSlug}/holidays
    const url = `${API_BASE_URL}/v1/parks/${continent}/${country}/${city}/${parkSlug}/holidays?year=${year}`;

    console.log(`[Calendar] Fetching holidays from: ${url}`);

    const response = await fetch(url, {
      next: { revalidate: CACHE_TTL.holidays },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(
        `[Calendar] Failed to fetch holidays for ${parkSlug}/${year}: ${response.status}`
      );
      // Fallback: Return empty array, don't crash
      return [];
    }

    const data: HolidayResponse = await response.json();
    console.log(`[Calendar] Loaded ${data.holidays?.length || 0} holidays for ${parkSlug}/${year}`);
    return data.holidays || [];
  } catch (error) {
    console.error(`[Calendar] Error fetching holidays:`, error);
    return [];
  }
}

/**
 * Fetch holidays for calendar display using geographic path
 * Returns holidays for current year and next year
 * Note: Consider using the integrated calendar endpoint instead, which includes holidays
 */
export async function getCalendarHolidays(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<HolidayItem[]> {
  const currentYear = new Date().getFullYear();

  // Fetch current year and next year holidays
  const [currentYearHolidays, nextYearHolidays] = await Promise.all([
    getParkHolidays(continent, country, city, parkSlug, currentYear),
    getParkHolidays(continent, country, city, parkSlug, currentYear + 1),
  ]);

  return [...currentYearHolidays, ...nextYearHolidays];
}
