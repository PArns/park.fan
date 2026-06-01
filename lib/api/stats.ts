import type { ParkHistoricalStats } from '@/lib/api/types';

const getApiBaseUrl = () =>
  typeof window === 'undefined' ? process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan' : '';

/**
 * Fetch historical crowd/wait-time statistics for a park.
 * Cached 24h — data changes daily, not in real-time.
 */
export async function getParkHistoricalStats(
  continent: string,
  country: string,
  city: string,
  parkSlug: string,
  years = 2
): Promise<ParkHistoricalStats> {
  const url = `${getApiBaseUrl()}/v1/parks/${continent}/${country}/${city}/${parkSlug}/stats?years=${years}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });

  if (!res.ok) {
    throw new Error(`Park stats ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<ParkHistoricalStats>;
}
