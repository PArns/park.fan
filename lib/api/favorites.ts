import { CACHE_TTL } from './cache-config';

export interface FavoritePark {
  id: string;
  name: string;
  slug: string;
  distance?: number;
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
  backgroundImage?: string | null; // Added by proxy route
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
}

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
  hourlyForecast?: Array<{
    predictedTime: string;
    predictedWaitTime: number;
    confidence: number;
    trend: string;
  }>;
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
  trend?: 'up' | 'down' | 'stable' | null;
  predictionAccuracy?: {
    badge: 'excellent' | 'good' | 'fair' | 'poor' | 'insufficient_data';
    last30Days: {
      comparedPredictions: number;
      totalPredictions: number;
    };
    message?: string;
  } | null;
  crowdLevel?: string; // Crowd level for the attraction (direct field) - matches CrowdLevel type
  currentLoad?: {
    crowdLevel: string; // Matches CrowdLevel: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme'
    baseline?: number;
    currentWaitTime?: number;
    value?: number; // Alternative field name
    trend?: string; // Matches TrendDirection
    percentage?: number;
    queueSize?: number;
    comparisonStatus?: string; // Matches ComparisonStatus
  } | null;
  url: string;
  backgroundImage?: string | null; // Added by proxy route
}

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
 * Get favorites with full information from API
 * The API reads favorites from cookies if no query parameters are provided
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

  // Only add params if provided (API will read from cookies if empty)
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

  // Only call API if we have at least one favorite ID
  // API requires query parameters - it does not read from cookies
  if (Object.keys(params).length === 0) {
    // No favorites, return empty response
    return {
      parks: [],
      attractions: [],
      shows: [],
      restaurants: [],
    };
  }

  // Use local proxy route (like nearby) to avoid CORS and forward cookies
  if (typeof window === 'undefined') {
    // Server-side: call API directly
    const apiUrl = new URL('https://api.park.fan/v1/favorites');
    Object.entries(params).forEach(([key, value]) => {
      apiUrl.searchParams.set(key, value);
    });

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: CACHE_TTL.nearby },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch favorites: ${response.statusText}`);
    }

    return response.json() as Promise<FavoritesResponse>;
  }

  // Client-side: use proxy route
  const url = new URL('/api/favorites', window.location.origin);

  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies
    cache: 'no-store', // Like nearby, don't cache on client
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch favorites: ${response.statusText}`);
  }

  return response.json() as Promise<FavoritesResponse>;
}
