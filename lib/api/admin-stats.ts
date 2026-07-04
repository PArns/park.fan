// Types for the read-only stats endpoints surfaced in the admin dashboard.
// Sources: /v1/ml/*, /v1/analytics/*, /v1/parks (list).

// ─── ML ─────────────────────────────────────────────────────────────────────

export interface MlMetrics {
  mae: number;
  rmse: number;
  mape: number;
  r2Score: number;
}

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

export interface MlLivePerformance extends MlMetrics {
  totalPredictions: number;
  matchedPredictions: number;
  coveragePercent: number;
  uniqueAttractions: number;
  uniqueParks: number;
  badge: string;
}

export interface MlPerformer {
  attractionId: string;
  attractionName: string;
  parkName: string;
  mae: number;
  predictionsCount: number;
}

export interface MlDriftDaily {
  date: string;
  mae: number;
  predictionsCount: number;
}

/** Drift for one serving horizon (§6a-2). daily is `tracked:false` — far-daily
 *  predictions are never scored against actuals, so its drift is unmeasured. */
export interface MlHorizonDrift {
  horizon: 'hourly' | 'daily';
  tracked: boolean;
  currentDrift: number | null;
  liveMae: number | null;
  status: string;
  note: string | null;
}

export interface MlDrift {
  currentDrift: number;
  threshold: number;
  status: string;
  trainingMae: number;
  liveMae: number;
  dailyMetrics: MlDriftDaily[];
  /** Per-horizon split. Optional: absent on API builds predating §6a-2. */
  byHorizon?: MlHorizonDrift[];
}

/** Served intraday accuracy (PCN champion-swap) — what users actually get for
 *  15-min slots. `live`/`byPredictionType.HOURLY` measure the CatBoost fallback,
 *  not the served model. null when PCN is not serving. */
export interface MlServedIntraday {
  servedModel: 'pcn';
  mae: number;
  n: number;
  catboostMae: number | null;
  /** catboostMae − mae; > 0 ⇒ the served model beats the CatBoost fallback. */
  delta: number | null;
  days: number;
}

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

export interface MlAnomalyStats {
  totalAnomalies: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  avgAnomalyScore: number;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

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

export interface AnalyticsTicker {
  items: TickerItem[];
  generatedAt: string;
}

export interface GeoLiveCountry {
  slug: string;
  openParkCount: number;
}

export interface GeoLiveContinent {
  slug: string;
  openParkCount: number;
  countries: GeoLiveCountry[];
}

export interface AnalyticsGeoLive {
  continents: GeoLiveContinent[];
}

// ─── Parks list  (GET /v1/parks) ────────────────────────────────────────────

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

export interface ParksPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ParksListResponse {
  data: ParkListItem[];
  pagination: ParksPagination;
}

// ─── Search  (GET /v1/search) ────────────────────────────────────────────────

export type SearchResultType = 'park' | 'attraction' | 'show' | 'restaurant' | 'location';

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

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  counts: Record<string, { returned: number; total: number }>;
}
