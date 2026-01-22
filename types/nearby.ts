/**
 * TypeScript types for /v1/discovery/nearby API endpoint
 */

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
  status: 'OPERATING' | 'CLOSED' | 'DOWN';
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
  analytics?: {
    avgWaitTime?: number;
    crowdLevel?: string;
    operatingAttractions?: number;
  };
  timezone: string;
  todaySchedule?: {
    openingTime: string;
    closingTime: string;
    scheduleType: string;
  };
  nextSchedule?: {
    openingTime: string;
    closingTime: string;
    scheduleType: string;
  };
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
  todaySchedule?: {
    openingTime: string;
    closingTime: string;
    scheduleType: string;
  };
  nextSchedule?: {
    openingTime: string;
    closingTime: string;
    scheduleType: string;
  };
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
