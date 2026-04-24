// ============================================================================
// Enums and Constants
// ============================================================================

export type ParkStatus = 'OPERATING' | 'CLOSED' | 'UNKNOWN';
export type AttractionStatus = 'OPERATING' | 'DOWN' | 'CLOSED' | 'REFURBISHMENT';

export interface BestVisitSlot {
  time: string; // ISO 8601
  predictedWaitTime: number;
  rating: 'optimal' | 'good';
}
// Queue types moved to QueueDataItem definition area
export type CrowdLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme';
export type AccuracyBadge = 'excellent' | 'good' | 'fair' | 'poor' | 'insufficient_data';
export type Recommendation =
  | 'highly_recommended'
  | 'recommended'
  | 'neutral'
  | 'avoid'
  | 'strongly_avoid'
  | 'closed';
export type ScheduleType = 'OPERATING' | 'CLOSED' | 'UNKNOWN';
export type TrendDirection = 'up' | 'stable' | 'down' | 'increasing' | 'decreasing';
export type ComparisonStatus =
  | 'much_lower'
  | 'lower'
  | 'typical'
  | 'higher'
  | 'much_higher'
  | 'closed';
export type HolidayType = 'public' | 'observance' | 'school' | 'bank';

// ============================================================================
// Pagination
// ============================================================================
// Breadcrumb Type
export interface Breadcrumb {
  name: string;
  url: string;
  className?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// ============================================================================
// Schedule
// ============================================================================

export interface ScheduleItem {
  date: string;
  scheduleType: ScheduleType;
  openingTime: string | null;
  closingTime: string | null;
  description: string | null;
  purchases: unknown | null;
  isHoliday?: boolean;
  holidayName: string | null;
  isBridgeDay?: boolean;
  isSchoolVacation?: boolean;
  isPublicHoliday?: boolean;
  isSchoolHoliday?: boolean;
  isInferred?: boolean;
  influencingHolidays?: InfluencingHoliday[];
}

/** API nextSchedule shape: often has only openingTime/closingTime/scheduleType (no date). */
export type NextScheduleItem = Omit<ScheduleItem, 'date'> & { date?: string };

/** Compact schedule summary used in park cards and nearby responses. */
export interface ScheduleSummary {
  openingTime: string;
  closingTime: string;
  scheduleType: string;
}

// ============================================================================
// Weather
// ============================================================================

export interface WeatherDay {
  date: string;
  dataType: 'current' | 'forecast';
  temperatureMax: string;
  temperatureMin: string;
  precipitationSum: string;
  rainSum: string;
  snowfallSum: string;
  weatherCode: number;
  weatherDescription: string;
  windSpeedMax: string;
}

export interface WeatherNow {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
}

export interface WeatherData {
  current?: WeatherDay;
  now?: WeatherNow | null;
  forecast?: WeatherDay[];
}

// ============================================================================
// Queue Data
// ============================================================================

export type QueueType =
  | 'STANDBY'
  | 'SINGLE_RIDER'
  | 'RETURN_TIME'
  | 'PAID_RETURN_TIME'
  | 'BOARDING_GROUP'
  | 'PAID_STANDBY';

export type QueueStatus = 'OPERATING' | 'DOWN' | 'CLOSED' | 'REFURBISHMENT';

export interface BaseQueue {
  queueType: QueueType;
  status: QueueStatus;
  lastUpdated: string;
}

export interface StandbyQueue extends BaseQueue {
  queueType: 'STANDBY';
  waitTime: number | null;
}

export interface SingleRiderQueue extends BaseQueue {
  queueType: 'SINGLE_RIDER';
  waitTime: number | null;
}

export interface ReturnTimeQueue extends BaseQueue {
  queueType: 'RETURN_TIME';
  state: string | null;
  returnStart: string | null;
  returnEnd: string | null;
}

export interface PaidReturnTimeQueue extends BaseQueue {
  queueType: 'PAID_RETURN_TIME';
  returnStart: string | null;
  returnEnd: string | null;
  price: {
    amount: number;
    currency: string;
    formatted: string;
  } | null;
}

export interface BoardingGroupQueue extends BaseQueue {
  queueType: 'BOARDING_GROUP';
  allocationStatus: string | null;
  currentGroupStart: number | null;
  currentGroupEnd: number | null;
  estimatedWait: number | null;
}

export interface PaidStandbyQueue extends BaseQueue {
  queueType: 'PAID_STANDBY';
  waitTime: number | null;
  price: {
    amount: number;
    currency: string;
    formatted: string;
  } | null;
}

export type QueueDataItem =
  | StandbyQueue
  | SingleRiderQueue
  | ReturnTimeQueue
  | PaidReturnTimeQueue
  | BoardingGroupQueue
  | PaidStandbyQueue;

// ============================================================================
// Forecast / Predictions
// ============================================================================

export interface ForecastItem {
  predictedTime: string;
  predictedWaitTime: number;
  confidencePercentage: number | null;
  source: string;
  trend?: TrendDirection;
}

export interface ParkDailyPrediction {
  date: string;
  crowdLevel: CrowdLevel | 'closed';
  confidencePercentage: number;
  recommendation?: Recommendation;
  source: string;
  avgWaitTime?: number;
}

// ============================================================================
// Park Load & Analytics
// ============================================================================

export interface ParkLoad {
  crowdLevel: CrowdLevel;
  baseline: number;
  currentWaitTime: number;
  trend?: TrendDirection;
  comparisonStatus?: ComparisonStatus;
}

export interface ParkOccupancy {
  current: number;
  trend: TrendDirection;
  comparedToTypical: number;
  comparisonStatus: ComparisonStatus;
  baseline90thPercentile: number;
  updatedAt: string;
  breakdown?: Record<string, unknown>;
}

export interface ParkStatistics {
  avgWaitTime: number;
  avgWaitToday: number;
  peakHour: string | null;
  crowdLevel: CrowdLevel;
  totalAttractions: number;
  operatingAttractions: number;
  closedAttractions: number;
  timestamp: string;
  peakWaitToday: number;
}

export interface ParkAnalytics {
  occupancy: ParkOccupancy;
  statistics: ParkStatistics;
  percentiles?: Record<string, unknown>;
}

// ============================================================================
// Prediction Accuracy
// ============================================================================

export interface PredictionAccuracy {
  badge: AccuracyBadge;
  last30Days: {
    comparedPredictions: number;
    totalPredictions: number;
  };
  message: string;
}

// ============================================================================
// Park Entities (Attractions, Shows, Restaurants)
// ============================================================================

export interface Land {
  name: string;
}

export interface ParkAttraction {
  id: string;
  name: string;
  slug: string;
  url?: string; // Geographic URL from API (e.g., /v1/parks/europe/germany/bruhl/phantasialand/attractions/taron)
  latitude: number | null;
  longitude: number | null;
  queues?: QueueDataItem[];
  land: string | null;
  status?: AttractionStatus;
  currentLoad?: ParkLoad | null;
  // added fields
  crowdLevel?: CrowdLevel;
  trend?: TrendDirection;
  statistics?: AttractionStatistics;
  history?: AttractionHistoryDay[];
  isHeadliner?: boolean;
  isSeasonal?: boolean;
  seasonMonths?: number[] | null;
  isCurrentlyInSeason?: boolean | null;
  bestVisitTimes?: BestVisitSlot[] | null;
  // Only present on attraction detail page (merged from dedicated endpoint)
  hourlyForecast?: ForecastItem[];
  predictionAccuracy?: PredictionAccuracy | null;
}

export interface ShowtimeEntry {
  type: string;
  startTime: string;
}

export interface ParkShow {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  status?: string;
  showtimes?: { startTime: string }[];
  isSeasonal?: boolean;
  seasonMonths?: number[] | null;
  isCurrentlyInSeason?: boolean | null;
}

export interface ParkRestaurant {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  cuisineType: string | null;
  requiresReservation: boolean;
  status?: string;
  waitTime?: number | null;
  partySize?: number | null;
  operatingHours?: { type: string; startTime: string; endTime: string }[];
  lastUpdated?: string;
}

// ============================================================================
// Park Response Types
// ============================================================================

export interface ParkBase {
  id: string;
  name: string;
  slug: string;
  url: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  regionCode: string | null;
  continent: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
}

export interface ParkResponse extends ParkBase {
  status: ParkStatus;
  currentLoad: ParkLoad | null;
  weather?: WeatherData;
  analytics?: ParkAnalytics | null;
  schedule?: ScheduleItem[];
  nextSchedule?: NextScheduleItem | null;
  hasOperatingSchedule: boolean;
}

export interface ParkWithAttractions extends ParkBase {
  status?: ParkStatus;
  currentLoad?: ParkLoad | null;
  weather?: WeatherData;
  attractions: ParkAttraction[];
  shows?: ParkShow[];
  restaurants?: ParkRestaurant[];
  analytics?: ParkAnalytics | null;
  schedule?: ScheduleItem[];
  nextSchedule?: NextScheduleItem | null;
  hasOperatingSchedule: boolean;
}

// ============================================================================
// Attraction Response Types
// ============================================================================

export interface AttractionResponse {
  id: string;
  name: string;
  slug: string;
  status?: AttractionStatus;
  land: Land | null;
  queues?: QueueDataItem[];
  currentLoad?: ParkLoad | null;
  hourlyForecast?: ForecastItem[];
  forecasts?: ForecastItem[];
  latitude: number | null;
  longitude: number | null;
  park?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  statistics?: AttractionStatistics;
  predictionAccuracy?: PredictionAccuracy | null;
  history?: AttractionHistoryDay[];
  schedule?: ScheduleItem[];
  isSeasonal?: boolean;
  seasonMonths?: number[] | null;
  isCurrentlyInSeason?: boolean | null;
  bestVisitTimes?: BestVisitSlot[] | null;
}

export interface AttractionHistoryDay {
  date: string;
  utilization: CrowdLevel;
  hourlyP90: Array<{
    hour: string;
    value: number;
  }>;
}

export interface AttractionStatistics {
  avgWaitToday: number | null;
  minWaitToday: number | null;
  maxWaitToday: number | null;
  peakWaitToday: number | null;
  peakWaitTimestamp: string | null;
  history: {
    timestamp: string;
    waitTime: number;
  }[];
}

// ============================================================================
// Show & Restaurant Response Types
// ============================================================================

export interface ShowResponse {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  park?: { id: string; name: string; slug: string } | null;
}

export interface ShowWithLiveData extends ShowResponse {
  status: string;
  showtimes: string[] | null;
  operatingHours: string[] | null;
  lastUpdated: string;
}

export interface RestaurantResponse {
  id: string;
  name: string;
  slug: string;
  cuisineType: string | null;
  requiresReservation: boolean;
  latitude: number | null;
  longitude: number | null;
  park?: { id: string; name: string; slug: string } | null;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchResultItem {
  type: 'park' | 'attraction' | 'show' | 'restaurant' | 'location' | 'glossary';
  id: string; // Format: "city:slug" or "country:slug" for locations
  name: string;
  slug: string;
  url?: string;
  latitude?: number;
  longitude?: number;
  // Location fields (populated for all types as applicable)
  continent?: string;
  country?: string;
  countryCode?: string; // ISO code, e.g., "FR"
  city?: string; // Present if type is a city location
  resort?: string;
  status?: ParkStatus | AttractionStatus;
  load?: CrowdLevel;
  parkHours?: { open: string; close: string; type: string };
  waitTime?: number;
  shortDefinition?: string;
  showTimes?: string[];
  parentPark?: { id: string; name: string; slug: string; url: string };
  isSeasonal?: boolean;
  isCurrentlyInSeason?: boolean | null;
}

export interface SearchResult {
  query: string;
  results: SearchResultItem[];
  counts: Record<string, { returned: number; total: number }>;
}

// ============================================================================
// Discovery / Geo Types
// ============================================================================

export interface ParkReference {
  id: string;
  name: string;
  slug: string;
  country: string;
  attractionCount: number;
  status?: ParkStatus;
  currentLoad?: {
    crowdLevel: CrowdLevel;
  };
  analytics?: {
    occupancy?: ParkOccupancy;
    statistics?: {
      avgWaitTime: number;
      operatingAttractions: number;
      closedAttractions: number;
      totalAttractions: number;
      crowdLevel?: CrowdLevel;
    };
  };
  timezone?: string;
  hasOperatingSchedule: boolean;
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

export interface City {
  name: string;
  slug: string;
  parks: ParkReference[];
  parkCount: number;
  openParkCount: number;
}

export interface Country {
  name: string;
  slug: string;
  code: string;
  cities: City[];
  cityCount: number;
  parkCount: number;
  openParkCount: number;
}

export interface Continent {
  name: string;
  slug: string;
  countries: Country[];
  countryCount: number;
  parkCount: number;
  openParkCount: number;
}

export interface SitemapAttraction {
  url: string;
  slug: string;
}

export interface GeoStructure {
  continents: Continent[];
  continentCount: number;
  countryCount: number;
  cityCount: number;
  parkCount: number;
  attractionCount: number;
  generatedAt: string;
}

// ============================================================================
// Analytics / Stats Types
// ============================================================================

export interface GlobalCounts {
  openParks: number;
  parks: number;
  openAttractions: number;
  attractions: number;
  shows: number;
  restaurants: number;
  queueDataRecords: number;
  totalWaitTime?: number;
}

export interface ParkStatsItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  countrySlug: string;
  averageWaitTime: number | null;
  url: string;
  crowdLevel: CrowdLevel | null;
  totalAttractions: number;
  operatingAttractions: number;
}

export interface AttractionStatsItem {
  id: string;
  name: string;
  slug: string;
  parkName: string;
  parkSlug: string;
  parkCity: string;
  parkCountry: string;
  parkCountrySlug: string;
  waitTime: number;
  url: string;
  crowdLevel: CrowdLevel | null;
}

export interface GlobalStats {
  counts: GlobalCounts;
  mostCrowdedPark: ParkStatsItem | null;
  leastCrowdedPark: ParkStatsItem | null;
  longestWaitRide: AttractionStatsItem | null;
  shortestWaitRide: AttractionStatsItem | null;
}

export interface GeoLiveStatsDto {
  continents: ContinentLiveStats[];
}

export interface ContinentLiveStats {
  slug: string;
  openParkCount: number;
  countries: CountryLiveStats[];
}

export interface CountryLiveStats {
  slug: string;
  openParkCount: number;
}

// ============================================================================
// Holiday Types
// ============================================================================

export interface HolidayItem {
  date: string;
  name: string;
  localName: string | null;
  country: string;
  region: string | null;
  holidayType: HolidayType;
  isNationwide: boolean;
}

export interface HolidayResponse {
  holidays: HolidayItem[];
}

/**
 * Structured holiday information from a neighbor/influencing region
 */
export interface InfluencingHoliday {
  name: string;
  source: {
    countryCode: string;
    regionCode?: string | null;
  };
  holidayType: string;
}

// ============================================================================
// Discovery API Types
// ============================================================================

export interface DiscoveryCity {
  name: string;
  slug: string;
  parks: ParkReference[];
  parkCount: number;
}

export interface DiscoveryCountry {
  name: string;
  slug: string;
  cities: DiscoveryCity[];
  cityCount: number;
  parkCount: number;
}

export interface DiscoveryCountryResponse {
  data: DiscoveryCountry[]; // API returns 'data', not 'countries'
  breadcrumbs: Breadcrumb[];
}

export interface DiscoveryCityResponse {
  data: DiscoveryCity[]; // API returns 'data', not 'cities'
  breadcrumbs: Breadcrumb[];
}

// ============================================================================
// ML Dashboard Types
// ============================================================================

export type DriftStatus = 'healthy' | 'warning' | 'critical';

export interface MLDashboardDto {
  model: {
    current: {
      version: string;
      trainedAt: string;
      trainingDurationSeconds: number | null;
      modelType: string;
      fileSizeMB: number | null;
    };
    previous: {
      version: string;
      mae: number;
      r2: number;
      trainedAt: string;
    } | null;
    configuration: {
      featuresUsed: string[];
      featureCount: number;
      hyperparameters: Record<string, string | number | boolean>;
    };
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
    training: {
      mae: number;
      rmse: number;
      mape: number;
      r2Score: number;
    };
    live: {
      mae: number;
      rmse: number;
      mape: number;
      r2Score: number;
      badge: AccuracyBadge;
      totalPredictions: number;
      matchedPredictions: number;
      coveragePercent: number;
      uniqueAttractions: number;
      uniqueParks: number;
    };
    drift: {
      currentDrift: number;
      threshold: number;
      status: DriftStatus;
      trainingMae: number;
      liveMae: number;
      dailyMetrics: Array<{ date: string; mae: number; predictionsCount: number }>;
    } | null;
    improvement: {
      maeDelta: number;
      maePercentChange: number;
      isImproving: boolean;
    } | null;
  };
  insights: {
    topPerformers: Array<{
      attractionId: string;
      attractionName: string;
      parkName: string;
      mae: number;
      predictionsCount: number;
    }>;
    bottomPerformers: Array<{
      attractionId: string;
      attractionName: string;
      parkName: string;
      mae: number;
      predictionsCount: number;
    }>;
    byPredictionType: {
      HOURLY: { mae: number; totalPredictions: number; coveragePercent: number };
      DAILY: { mae: number; totalPredictions: number; coveragePercent: number };
    };
    patterns: {
      hourly: Array<{ hour: number; mae: number; predictionsCount: number }>;
      weekday: Array<{ dayOfWeek: number; dayName: string; mae: number; predictionsCount: number }>;
    };
  };
  system: {
    nextTraining: string;
    modelAge: { days: number; hours: number; minutes: number };
    lastAccuracyCheck: { completedAt: string; newComparisonsAdded: number };
  };
}

// ============================================================================
// ML Metrics History
// ============================================================================

export interface ModelMetricsSnapshot {
  version: string;
  trainedAt: string;
  mae: number | null;
  rmse: number | null;
  mape: number | null;
  r2Score: number | null;
  trainSamples: number;
  isActive: boolean;
}

export interface ModelMetricsHistoryResponse {
  history: ModelMetricsSnapshot[];
  total: number;
}

// ============================================================================
// Health Types
// ============================================================================

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  services: Record<string, unknown>;
  data: Record<string, unknown>;
}

// ============================================================================
// Calendar Types
// ============================================================================

export interface CalendarEventData {
  type: 'schedule' | 'weather' | 'holiday' | 'crowd' | 'recommendation' | 'special_event' | 'show';
  icon?: string;
  // Legacy support
  data?: ScheduleItem | WeatherDay | HolidayItem | ParkDailyPrediction;
  timezone?: string;
  details?: string;
  // New integrated calendar properties
  schedule?: ScheduleItem;
  weather?: WeatherSummary;
  holiday?: HolidayItem;
  crowd?: {
    date: string;
    crowdLevel: CrowdLevel | 'closed';
    confidencePercentage: number;
    recommendation: string;
    source: string;
    avgWaitTime?: number;
  };
  recommendation?: string;
  advisoryKeys?: string[];
  show?: { name: string; time: string; endTime?: string };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: CalendarEventData;
}

// ============================================================================
// Integrated Calendar Types (New API)
// ============================================================================

export interface CalendarMeta {
  slug: string;
  timezone: string;
  hasOperatingSchedule: boolean;
}

export interface OperatingHours {
  openingTime: string;
  closingTime: string;
  type: 'OPERATING' | 'CLOSED';
  isInferred: boolean;
}

export interface WeatherSummary {
  condition: string;
  icon: number;
  tempMin: number;
  tempMax: number;
  rainChance: number;
}

export interface CalendarEventItem {
  name: string;
  type: string;
  isNationwide?: boolean;
}

export interface HourlyPrediction {
  hour: number;
  crowdLevel: CrowdLevel;
  predictedWaitTime: number;
  probability?: number;
}

export interface TicketInfo {
  price?: { amount: number; currency: string };
  tier?: 'budget' | 'standard' | 'peak';
  status?: 'available' | 'sold_out';
}

export interface ShowTime {
  name: string;
  time: string;
  endTime?: string;
}

export interface CalendarDay {
  date: string;
  status: ParkStatus;
  isToday: boolean;
  isTomorrow?: boolean;
  isEstimated?: boolean;
  hours?: OperatingHours;
  crowdLevel: CrowdLevel | 'closed';
  avgWaitTime?: number;
  crowdScore?: number;
  weather?: WeatherSummary;
  events?: CalendarEventItem[];
  isHoliday: boolean;
  isBridgeDay: boolean;
  isSchoolVacation: boolean;
  isPublicHoliday?: boolean;
  isSchoolHoliday?: boolean;
  influencingHolidays?: InfluencingHoliday[];
  hourly?: HourlyPrediction[];
  refurbishments?: string[];
  ticket?: TicketInfo;
  recommendation?: string;
  advisoryKeys?: string[];
  showTimes?: ShowTime[];
}

export interface IntegratedCalendarResponse {
  meta: CalendarMeta;
  days: CalendarDay[];
}

// ============================================================================
// Park Historical Stats  (GET /v1/parks/.../stats)
// ============================================================================

export interface MonthStat {
  month: number; // 1–12
  avgCrowdScore: number;
  avgWaitP50: number;
  avgWaitP90: number;
  sampleDays: number;
}

export interface DayOfWeekStat {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  avgCrowdScore: number;
  avgWaitP50: number;
  avgWaitP90: number;
  sampleDays: number;
}

export interface TopAttractionStat {
  attractionSlug: string;
  attractionName: string;
  avgWaitP50: number;
  avgWaitP90: number;
  sampleDays: number;
}

export interface ParkHistoricalStats {
  byMonth: MonthStat[];
  byDayOfWeek: DayOfWeekStat[];
  topAttractions: TopAttractionStat[];
  meta: {
    parkSlug: string;
    dataFrom: string;
    dataTo: string;
    totalSampleDays: number;
  };
}

// ============================================================================
// Nearby Parks (discovery/nearby endpoint)
// ============================================================================

export interface NearbyParkItem {
  id: string;
  name: string;
  slug: string;
  distance: number;
  city: string | null;
  country: string | null;
  status: string;
  totalAttractions: number;
  operatingAttractions: number;
  analytics?: {
    avgWaitTime?: number;
    crowdLevel?: string;
    occupancy?: number;
  };
  url: string | null;
  timezone: string;
  hasOperatingSchedule: boolean;
  todaySchedule?: ScheduleSummary | null;
  nextSchedule?: ScheduleSummary | null;
}

// ============================================================================
// Country Summary  (GET /v1/discovery/continents/:continent/:country/summary)
// ============================================================================

export interface TopParkSummary {
  name: string;
  slug: string;
  city: string;
  path: string;
  avgAnnualCrowdScore: number;
}

export interface CountrySummary {
  countrySlug: string;
  parkCount: number;
  cityCount: number;
  topParks: TopParkSummary[];
  avgPeakMonths: number[];
  avgQuietMonths: number[];
}
