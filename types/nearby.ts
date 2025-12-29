/**
 * TypeScript types for /v1/discovery/nearby API endpoint
 */

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface RideWithDistance {
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
  backgroundImage?: string | null;
}

export interface NearbyRidesData {
  park: NearbyParkInfo;
  rides: RideWithDistance[];
}

export interface ParkWithDistance {
  id: string;
  name: string;
  slug: string;
  distance: number;
  city: string;
  country: string;
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
  backgroundImage?: string | null;
}

export interface NearbyParksData {
  parks: ParkWithDistance[];
  count: number;
}

export interface NearbyResponse {
  type: 'in_park' | 'nearby_parks';
  userLocation: UserLocation;
  data: NearbyRidesData | NearbyParksData;
}
