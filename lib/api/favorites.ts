import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import type {
  ScheduleSummary,
  CrowdLevel,
  TrendDirection,
  ComparisonStatus,
  AccuracyBadge,
  BestVisitSlot,
  RopeDropInfo,
  LiveWaitTimes,
  AttractionKind,
  HourlyForecastItem,
} from '@/lib/api/types';

/** A favorite park as `/v1/favorites` returns it. */
export interface FavoritePark {
  id: string;
  name: string;
  slug: string;
  distance?: number;
  city: string;
  country: string;
  status: string;
  totalAttractions: number;
  /** Absent for a park whose wait times are unreadable (see `LiveWaitTimes`). */
  operatingAttractions?: number;
  analytics?: {
    avgWaitTime?: number;
    crowdLevel?: CrowdLevel;
    occupancy?: number;
  };
  url: string;
  timezone: string;
  hasOperatingSchedule: boolean;
  liveWaitTimes?: LiveWaitTimes;
  backgroundImage?: string | null; // Added by proxy route
  /** Focal point as a CSS `object-position`, attached by the same proxy route. */
  backgroundPosition?: string;
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
}

/** A favorite attraction as `/v1/favorites` returns it. */
export interface FavoriteAttraction {
  id: string;
  name: string;
  slug: string;
  distance?: number;
  status?: string;
  effectiveStatus?: string;
  land?: string | null;
  queues?: Array<{
    queueType: string;
    waitTime: number | null;
    status: string;
    state?: string;
    returnStart?: string;
    returnEnd?: string;
    allocationStatus?: string;
    currentGroupStart?: number;
    currentGroupEnd?: number;
    price?: {
      formatted: string;
    };
  }>;
  hourlyForecast?: HourlyForecastItem[];
  forecasts?: Array<{
    source: string;
    predictedTime: string;
    predictedWaitTime: number;
  }>;
  latitude: number | null;
  longitude: number | null;
  park: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    continent: string | null;
    country: string | null;
    city: string | null;
  } | null;
  statistics?: {
    avgWaitToday: number | null;
    peakWaitToday: number | null;
    peakWaitTimestamp: string | null;
    minWaitToday: number | null;
    typicalWaitThisHour: number | null;
    percentile95ThisHour: number | null;
    currentVsTypical: number | null;
    dataPoints: number;
    history: Array<{
      timestamp: string;
      waitTime: number;
    }>;
    timestamp: string;
  } | null;
  trend?: TrendDirection | null;
  predictionAccuracy?: {
    badge: AccuracyBadge;
    last30Days: {
      comparedPredictions: number;
      totalPredictions: number;
    };
    message?: string;
  } | null;
  crowdLevel?: CrowdLevel;
  /**
   * Not yet delivered by /v1/favorites (the service rates against the P50 but does not return it);
   * typed so the crowd-scale tooltip lights up here once the API ships it.
   */
  baseline?: number | null;
  currentLoad?: {
    crowdLevel: CrowdLevel;
    baseline?: number;
    currentWaitTime?: number;
    value?: number;
    trend?: TrendDirection;
    percentage?: number;
    queueSize?: number;
    comparisonStatus?: ComparisonStatus;
  } | null;
  url: string;
  backgroundImage?: string | null; // Added by proxy route
  /** Focal point as a CSS `object-position`, attached by the same proxy route. */
  backgroundPosition?: string;
  bestVisitTimes?: BestVisitSlot[] | null;
  /** Not yet delivered by /v1/favorites; typed so cards light up once the API ships it. */
  ropeDrop?: RopeDropInfo | null;
  /**
   * Not yet delivered by /v1/favorites either; typed so the card's transport badge lights up once
   * the API ships it.
   */
  attractionKind?: AttractionKind | null;
}

/** A favorite show as `/v1/favorites` returns it. */
export interface FavoriteShow {
  id: string;
  name: string;
  slug: string;
  distance?: number;
  status: string;
  showtimes?: Array<{
    type: string;
    startTime: string;
    endTime?: string;
  }> | null;
  url: string;
  park?: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    continent?: string | null;
    country?: string | null;
    city?: string | null;
  };
}

/** A favorite restaurant as `/v1/favorites` returns it. */
export interface FavoriteRestaurant {
  id: string;
  name: string;
  slug: string;
  distance?: number;
  status: string;
  waitTime?: number;
  cuisineType?: string;
  url: string;
  park?: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    continent?: string | null;
    country?: string | null;
    city?: string | null;
  };
}

/** The `/v1/favorites` answer, one list per kind. */
export interface FavoritesResponse {
  parks: FavoritePark[];
  attractions: FavoriteAttraction[];
  shows: FavoriteShow[];
  restaurants: FavoriteRestaurant[];
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Get favorites with full details: the API directly on the server, the `/api/favorites` proxy in
 * the browser. The API needs the ids as query parameters, so no ids means an empty answer without
 * a request.
 */
export async function getFavorites(
  parkIds: string[] = [],
  attractionIds: string[] = [],
  showIds: string[] = [],
  restaurantIds: string[] = [],
  lat?: number,
  lng?: number
): Promise<FavoritesResponse> {
  const params: Record<string, string> = {};

  if (parkIds.length > 0) {
    params.parkIds = parkIds.join(',');
  }
  if (attractionIds.length > 0) {
    params.attractionIds = attractionIds.join(',');
  }
  if (showIds.length > 0) {
    params.showIds = showIds.join(',');
  }
  if (restaurantIds.length > 0) {
    params.restaurantIds = restaurantIds.join(',');
  }
  if (lat !== undefined && lng !== undefined) {
    params.lat = String(lat);
    params.lng = String(lng);
  }

  if (Object.keys(params).length === 0) {
    return {
      parks: [],
      attractions: [],
      shows: [],
      restaurants: [],
    };
  }

  if (typeof window === 'undefined') {
    const apiUrl = new URL(`${getApiBaseUrl()}/v1/favorites`);
    Object.entries(params).forEach(([key, value]) => {
      apiUrl.searchParams.set(key, value);
    });

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
        ...getServerApiHeaders(),
      },
      cache: 'no-store', // per visitor
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch favorites: ${response.statusText}`);
    }

    return response.json() as Promise<FavoritesResponse>;
  }

  // Browser: the same-origin proxy, which forwards cookies.
  const url = new URL('/api/favorites', window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch favorites: ${response.statusText}`);
  }

  return response.json() as Promise<FavoritesResponse>;
}
