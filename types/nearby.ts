/**
 * TypeScript types for /v1/discovery/nearby API endpoint.
 * Distance in responses (e.g. park.distance) is in meters. Request params (radius) use km.
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
  crowdLevel?: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme' | null;
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
