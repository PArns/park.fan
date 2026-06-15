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
}

export interface NearbyParksData {
  parks: ParkWithDistance[];
  count: number;
}

export interface NearbyResponse {
  type: 'in_park' | 'nearby_parks';
  userLocation: UserLocation;
  data: NearbyAttractionsData | NearbyParksData;
}
