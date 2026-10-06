// Types for the read-only stats endpoints the admin dashboard shows: /v1/ml/*, /v1/analytics/*,
// /v1/parks (list) and /v1/search.

/** Error metrics for a model. */
export interface MlMetrics {
  mae: number;
  rmse: number;
  mape: number;
  r2Score: number;
}

/** The ML service's health. */
export interface MlHealth {
  timestamp: string;
  status: string;
  mlService: { status: string; url: string };
  model: {
    version: string;
    trainedAt: string;
    age: { days: number; hours: number; minutes: number };
    isActive: boolean;
    metrics: { mae: number; rmse: number; mape: number; r2: number };
  };
  message: string;
}

/** Live error metrics of the serving model. */
export interface MlLivePerformance extends MlMetrics {
  totalPredictions: number;
  matchedPredictions: number;
  coveragePercent: number;
  uniqueAttractions: number;
  uniqueParks: number;
  badge: string;
}

/** A ride among the ones the model predicts best or worst. */
export interface MlPerformer {
  attractionId: string;
  attractionName: string;
  parkName: string;
  mae: number;
  predictionsCount: number;
}

/** One day of live error, for the drift chart. */
export interface MlDriftDaily {
  date: string;
  mae: number;
  predictionsCount: number;
}

/** Drift for one serving horizon. `daily` is `tracked: false`: far-daily predictions are never
 *  scored against actuals, so their drift is unmeasured. */
export interface MlHorizonDrift {
  horizon: 'hourly' | 'daily';
  tracked: boolean;
  currentDrift: number | null;
  liveMae: number | null;
  status: string;
  note: string | null;
}

/** How far live error has drifted from training error. */
export interface MlDrift {
  currentDrift: number;
  threshold: number;
  status: string;
  trainingMae: number;
  liveMae: number;
  dailyMetrics: MlDriftDaily[];
  /** Per-horizon split; absent on older API builds. */
  byHorizon?: MlHorizonDrift[];
}

/** Served intraday accuracy (PCN champion-swap): what users get for 15-min slots, where
 *  `live`/`byPredictionType.HOURLY` measure the CatBoost fallback. null when PCN is not serving. */
export interface MlServedIntraday {
  servedModel: 'pcn';
  mae: number;
  n: number;
  catboostMae: number | null;
  /** catboostMae − mae; > 0 ⇒ the served model beats the CatBoost fallback. */
  delta: number | null;
  days: number;
}

/** The ML dashboard endpoint's answer (`/v1/ml/dashboard`). */
export interface MlDashboard {
  model: {
    current: {
      version: string;
      trainedAt: string;
      trainingDurationSeconds: number;
      modelType: string;
      fileSizeMB: number;
    };
    previous: { version: string; mae: number; r2: number; trainedAt: string };
    configuration: { featureCount: number };
    trainingData: {
      startDate: string;
      endDate: string;
      totalSamples: number;
      trainSamples: number;
      validationSamples: number;
      dataDurationDays: number;
    };
  };
  performance: {
    training: MlMetrics;
    live: MlLivePerformance;
    servedIntraday: MlServedIntraday | null;
    drift: MlDrift;
    improvement: { maeDelta: number; maePercentChange: number; isImproving: boolean };
  };
  insights: {
    topPerformers: MlPerformer[];
    bottomPerformers: MlPerformer[];
  };
  system: {
    nextTraining: string;
    modelAge: { days: number; hours: number; minutes: number };
    lastAccuracyCheck: { completedAt: string; newComparisonsAdded: number };
  };
}

/** One ML alert. */
export interface MlAlert {
  id: string;
  alertType: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

/** Anomaly counts by type and severity. */
export interface MlAnomalyStats {
  totalAnomalies: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  avgAnomalyScore: number;
}

/** A park in the realtime analytics answer. */
export interface RealtimePark {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  averageWaitTime: number;
  url: string;
  totalAttractions: number;
  operatingAttractions: number;
  crowdLevel: string;
}

/** A ride in the realtime analytics answer. */
export interface RealtimeRide {
  id: string;
  name: string;
  parkName: string;
  parkCity: string;
  parkCountry: string;
  waitTime: number;
  url: string;
  crowdLevel: string;
}

/** The realtime analytics endpoint's answer (`/v1/analytics/realtime`). */
export interface AnalyticsRealtime {
  counts: {
    openParks: number;
    parks: number;
    openAttractions: number;
    attractions: number;
    shows: number;
    restaurants: number;
    queueDataRecords: number;
    totalWaitTime: number;
  };
  mostCrowdedPark: RealtimePark;
  leastCrowdedPark: RealtimePark;
  longestWaitRide: RealtimeRide;
  shortestWaitRide: RealtimeRide;
}

/** One entry of the live ticker. */
export interface TickerItem {
  parkName: string;
  parkSlug: string;
  country: string;
  city: string;
  attractionName: string;
  attractionSlug: string;
  waitTime: number;
  trend: string;
  crowdLevel: string;
  url: string;
}

/** The ticker endpoint's answer (`/v1/analytics/ticker`). */
export interface AnalyticsTicker {
  items: TickerItem[];
  generatedAt: string;
}

/** Open-park count for one country. */
export interface GeoLiveCountry {
  slug: string;
  openParkCount: number;
}

/** Open-park counts for one continent and its countries. */
export interface GeoLiveContinent {
  slug: string;
  openParkCount: number;
  countries: GeoLiveCountry[];
}

/** The geo-live endpoint's answer (`/v1/analytics/geo-live`). */
export interface AnalyticsGeoLive {
  continents: GeoLiveContinent[];
}

/** One park in the `/v1/parks` list. */
export interface ParkListItem {
  id: string;
  name: string;
  slug: string;
  url: string;
  country: string | null;
  city: string | null;
  region: string | null;
  continent: string | null;
  timezone: string | null;
  status: string;
  hasOperatingSchedule: boolean;
  analytics?: {
    statistics?: {
      avgWaitTime: number;
      crowdLevel: string;
      totalAttractions: number;
      operatingAttractions: number;
    };
  };
}

/** Paging info of the `/v1/parks` list. */
export interface ParksPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** The `/v1/parks` list endpoint's answer. */
export interface ParksListResponse {
  data: ParkListItem[];
  pagination: ParksPagination;
}

/** The kinds of result `/v1/search` returns. */
export type SearchResultType = 'park' | 'attraction' | 'show' | 'restaurant' | 'location';

/** One search hit, as the admin search shows it. */
export interface SearchResult {
  type: SearchResultType;
  id: string;
  name: string;
  slug: string;
  url?: string;
  continent?: string;
  country?: string;
  city?: string;
  resort?: string;
  status?: string;
  load?: string;
  parentPark?: { id: string; name: string; slug: string; url: string };
}

/** The `/v1/search` endpoint's answer. */
export interface SearchResponse {
  query: string;
  results: SearchResult[];
  counts: Record<string, { returned: number; total: number }>;
}
