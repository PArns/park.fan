/**
 * TypeScript types for /v1/discovery/nearby API endpoint.
 * Distance in responses (e.g. park.distance) is in meters. Request params (radius) use km.
 */
import type { AttractionStatus, CrowdLevel, ScheduleSummary } from '@/lib/api/types';

/**
 * API returns distance in meters. Treat the user as "in park" when the nearest park is within
 * this radius. Shared by the hero (shows the "Welcome to <park>" variant) and the nearby card
 * (hides the redundant "nearest open park" list) so the two never contradict each other.
 */
export const IN_PARK_FALLBACK_DISTANCE_M = 1000; // 1 km

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface AttractionWithDistance {
  id: string;
  name: string;
  slug: string;
  distance: number;
  waitTime: number | null;
  status: AttractionStatus;
  crowdLevel?: CrowdLevel | null;
  analytics?: {
    p50?: number;
    p90?: number;
    avgWaitToday?: number;
  };
  url: string;
  /** true = top/marquee attraction of the park (derived from historical wait times). */
  isHeadliner?: boolean;
  /** Attraction only runs during certain months. */
  isSeasonal?: boolean;
  /** Months (1–12) the attraction typically runs in; null when unknown/not seasonal. */
  seasonMonths?: number[] | null;
  /**
   * true/false = currently in/out of season; null for non-seasonal rides or seasonal rides
   * with unknown months. The API already drops `isCurrentlyInSeason === false` rides, but the
   * frontend filters defensively too.
   */
  isCurrentlyInSeason?: boolean | null;
}

export interface NearbyParkInfo {
  id: string;
  name: string;
  slug: string;
  distance: number;
  status: string;
  url?: string; // Park page URL (when provided by API)
  analytics?: {
    avgWaitTime?: number;
    crowdLevel?: string;
    operatingAttractions?: number;
  };
  timezone: string;
  hasOperatingSchedule: boolean;
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
  backgroundImage?: string | null;
  /** Focal point as a CSS `object-position`, resolved server-side. */
  backgroundPosition?: string;
}

export interface NearbyAttractionsData {
  park: NearbyParkInfo;
  rides: AttractionWithDistance[]; // Backend sends 'rides', not 'attractions'
}

export interface ParkWithDistance {
  id: string;
  name: string;
  slug: string;
  distance: number;
  city: string;
  country: string;
  continent?: string; // Added for robust URL construction
  status: string;
  totalAttractions: number;
  operatingAttractions: number;
  analytics?: {
    avgWaitTime?: number;
    crowdLevel?: string;
    occupancy?: number;
  };
  url: string;
  timezone: string;
  hasOperatingSchedule: boolean;
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
  backgroundImage?: string | null;
  /** Focal point as a CSS `object-position`, resolved server-side. */
  backgroundPosition?: string;
}

/**
 * A ride in one of the nearby parks whose live wait is well below its usual one, as the API picks
 * it (`pickShortWaits`, contract in the backend's docs/frontend/discovery.md#shortwaits).
 */
export interface NearbyShortWait {
  id: string;
  name: string;
  slug: string;
  /** Path of the ride page without the locale; null where the park has no geo path. */
  url: string | null;
  /** Live standby wait in minutes, rounded to 5 (13 stays 13). */
  waitTime: number;
  /** The ride's usual wait (its median over 548 days), rounded to 5; not this hour's. */
  typicalWait: number;
  isHeadliner: boolean;
  park: { id: string; name: string; slug: string; distance: number; url: string | null };
}

export interface NearbyParksData {
  parks: ParkWithDistance[];
  count: number;
  /** Absent from an API older than the field, and from a cached answer written before it. */
  shortWaits?: NearbyShortWait[];
}

export interface NearbyResponse {
  type: 'in_park' | 'nearby_parks';
  userLocation: UserLocation;
  data: NearbyAttractionsData | NearbyParksData;
}
