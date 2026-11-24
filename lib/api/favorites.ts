import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import { fetchWithForecast } from '@/lib/api/forecast-query';
import { withParkCardImage, withRideCardImage, type CardImageMap } from '@/lib/media/card-images';
import { stripUnreadableWaitStats } from '@/lib/utils/live-wait-times';
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
  PerformanceSchedule,
  WorksPeriod,
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
    /** When the API took the reading behind `avgWaitTime` and `crowdLevel` (ISO 8601). */
    updatedAt?: string;
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
  /**
   * The ride's performance start times; a blog ride reference carries them from the attraction
   * detail, so its card shows the next start in place of a CLOSED between two performances.
   */
  performanceSchedules?: PerformanceSchedule[];
  /** The curated works windows, carried alongside for the same card. */
  worksPeriod?: WorksPeriod | null;
  worksPeriods?: WorksPeriod[];
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
 * A favorites answer as the cards read it: every park and ride with its card photo, and a park
 * with no readable wait-time source without the averages it has over an empty set (see
 * docs/rules/parks-we-cannot-read.md). `/api/favorites` runs it.
 */
export function favoritesForCards(map: CardImageMap, data: FavoritesResponse): FavoritesResponse {
  return {
    ...data,
    parks: Array.isArray(data.parks)
      ? data.parks.map((park) => stripUnreadableWaitStats(withParkCardImage(map, park)))
      : data.parks,
    attractions: Array.isArray(data.attractions)
      ? data.attractions.map((attraction) => withRideCardImage(map, attraction))
      : data.attractions,
  };
}

/**
 * Get favorites with full details: the API directly on the server, and in the browser the
 * `/api/favorites` relay, which sends the site's key. The API needs the ids as query
 * parameters, so no ids means an empty answer without a request.
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

    const response = await fetchWithForecast(apiUrl.toString(), {
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

  const url = new URL('/api/favorites', window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to fetch favorites: ${response.statusText}`);
  }

  return (await response.json()) as FavoritesResponse;
}
