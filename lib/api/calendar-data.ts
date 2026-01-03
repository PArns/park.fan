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
 * Fetch holidays for a specific park and year
 */
export async function getParkHolidays(
  parkSlug: string,
  year: number = new Date().getFullYear()
): Promise<HolidayItem[]> {
  try {
    const API_BASE_URL = getApiBaseUrl();
    // Use the park-specific holiday endpoint found in Swagger: /v1/parks/{slug}/holidays
    const url = `${API_BASE_URL}/v1/parks/${parkSlug}/holidays?year=${year}`;

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
 * Fetch holidays for calendar display using park slug
 * Returns holidays for current year and next year
 */
export async function getCalendarHolidays(parkSlug: string): Promise<HolidayItem[]> {
  const currentYear = new Date().getFullYear();

  // Fetch current year and next year holidays
  const [currentYearHolidays, nextYearHolidays] = await Promise.all([
    getParkHolidays(parkSlug, currentYear),
    getParkHolidays(parkSlug, currentYear + 1),
  ]);

  return [...currentYearHolidays, ...nextYearHolidays];
}
