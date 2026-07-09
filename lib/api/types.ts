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
// 'unknown' = "keine Prognose": the park is not ratable yet (< 30 operating
// days of headliner data → API sends typicalDayPeak=NULL). Rendered as a neutral
// "no forecast" badge, never as a real crowd tier.
export type CrowdLevel =
  | 'very_low'
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high'
  | 'extreme'
  | 'unknown';
export type AccuracyBadge = 'excellent' | 'good' | 'fair' | 'poor' | 'insufficient_data';
export type Recommendation =
  | 'highly_recommended'
  | 'recommended'
  | 'neutral'
  | 'avoid'
  | 'strongly_avoid'
  | 'closed';
export type ScheduleType = 'OPERATING' | 'CLOSED' | 'UNKNOWN';
export type TrendDirection =
  | 'up'
  | 'stable'
  | 'down'
  | 'increasing'
  | 'decreasing'
  | 'rising'
  | 'falling';
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

export type WeatherWarningSeverity = 'Minor' | 'Moderate' | 'Severe' | 'Extreme';

/**
 * Official severe-weather warning. Source: DWD (via Bright Sky) for German
 * parks, MeteoAlarm (via MeteoGate) for the rest of Europe. German and English
 * variants are both included — pick per locale, fall back to German when an
 * `*En` field is null. Non-European parks return no warnings.
 */
export interface WeatherWarning {
  /** Stable id (CAP alert id) — use as a list key. */
  alertId: string;
  /** Event type, German, e.g. "EXTREME HITZE". */
  event: string;
  eventEn?: string | null;
  /** Minor | Moderate | Severe | Extreme. */
  severity?: WeatherWarningSeverity | string | null;
  urgency?: string | null;
  category?: string | null;
  /** Validity window (ISO 8601). */
  onset?: string | null;
  expires?: string | null;
  headline?: string | null;
  headlineEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  instruction?: string | null;
  instructionEn?: string | null;
  /** Affected area, e.g. "Stadt Brühl". */
  area?: string | null;
  /** Source identifier, e.g. "brightsky" | "meteogate". */
  source: string;
}

export interface WeatherData {
  current?: WeatherDay;
  now?: WeatherNow | null;
  forecast?: WeatherDay[];
  /** Active severe-weather warnings (empty/absent when none). */
  warnings?: WeatherWarning[];
}

// ============================================================================
// Weather Nowcast (15-min precipitation/storm short-term forecast)
// ============================================================================

export type RainIntensity = 'light' | 'moderate' | 'heavy';

export interface WeatherNowcastStep {
  time: string;
  precipitation: number | null;
  precipitationProbability: number | null;
  snowfall: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  windGusts: number | null;
  visibility: number | null;
}

export interface WeatherNowcastAttribution {
  url: string;
  license: string;
  attribution: string;
}

export interface WeatherNowcast {
  park: { id: string; name: string; slug: string; timezone: string };
  observedAt: string;
  nextUpdateAt: string;
  currentlyRaining: boolean;
  currentTemperatureC: number | null;
  currentApparentTemperatureC: number | null;
  currentHumidity: number | null;
  currentPrecipitationMm: number | null;
  currentRainIntensity: RainIntensity | null;
  currentWeatherCode: number | null;
  currentWeatherDescription: string | null;
  isDay: boolean;
  temperatureMaxC: number | null;
  temperatureMinC: number | null;
  currentWindSpeedKmh: number | null;
  currentWindDirectionDeg: number | null;
  currentWindGustsKmh: number | null;
  currentSnowfallCm: number | null;
  currentVisibilityM: number | null;
  // Event timestamps — the backend omits these when no event is forecast,
  // so they may be absent on the wire even though the spec lists them.
  rainStartsAt?: string | null;
  rainStartsIntensityMm?: number | null;
  rainStartsIntensity?: RainIntensity | null;
  rainEndsAt?: string | null;
  thunderstormStartsAt?: string | null;
  thunderstormEndsAt?: string | null;
  hailStartsAt?: string | null;
  hailEndsAt?: string | null;
  stormStartsAt?: string | null;
  stormEndsAt?: string | null;
  peakWindGustsKmh: number | null;
  steps: WeatherNowcastStep[];
  attribution: WeatherNowcastAttribution;
  /** Active official severe-weather warnings (empty/absent when none). */
  warnings?: WeatherWarning[];
}

// ============================================================================
// Weather Hourly (today's hour-by-hour forecast, proxied from Open-Meteo)
// ============================================================================

export interface WeatherHourlyPoint {
  /** Naive park-local hour ("YYYY-MM-DDTHH:00"), same convention as nowcast steps. */
  time: string;
  temperatureC: number | null;
  /** mm accumulated in this hour slot. */
  precipitationMm: number | null;
  /** 0–100%. */
  precipitationProbability: number | null;
  weatherCode: number | null;
  isDay: boolean;
}

export interface WeatherHourlyToday {
  /** IANA timezone the point times are local to. */
  timezone: string;
  points: WeatherHourlyPoint[];
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

/** Short-term wait-time trend the API attaches to live queues (STANDBY, SINGLE_RIDER). */
export interface QueueTrend {
  direction: TrendDirection;
  changeRate: number;
  recentAverage: number;
  previousAverage: number;
}

export interface BaseQueue {
  queueType: QueueType;
  status: QueueStatus;
  lastUpdated: string;
  /** Present on live standby/single-rider queues; absent from the park-list snapshot. */
  trend?: QueueTrend;
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

export type PeakHourSource = 'observed_today' | 'prediction' | 'historical_fallback';

export interface ParkStatistics {
  avgWaitTime: number;
  avgWaitToday: number;
  peakHour: string | null;
  peakHourSource: PeakHourSource | null;
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
// Rope Drop (precomputed "worth arriving at opening" recommendation)
// ============================================================================

export type RopeDropStrength = 'high' | 'moderate';
export type RopeDropConfidence = 'high' | 'medium' | 'low';

/** Per-day-type level bucket (absolute minutes, trailing window). */
export interface RopeDropDayBucket {
  /** Typical wait right after opening (minutes). */
  openWait: number;
  /** Typical daily peak wait (minutes). */
  busyPeak: number;
  /** busyPeak − openWait (minutes saved by rope-dropping). */
  savings: number;
}

/**
 * Rope-drop recommendation attached to tier1/tier2 headliners in parks with a
 * schedule. Present even when `worth` is false — always check `worth`, not
 * just existence. Headline levels reflect the busier of the two day-type buckets.
 */
export interface RopeDropInfo {
  worth: boolean;
  /** Recommendation tier when worth; null or absent otherwise. */
  strength?: RopeDropStrength | null;
  /** Data-quality indicator (number of operating days in the window). */
  confidence: RopeDropConfidence;
  /** Daily peak wait you avoid (minutes). */
  busyPeak: number;
  /** Typical wait at opening (minutes). */
  openWait: number;
  /** busyPeak − openWait (minutes). */
  savings: number;
  /** Advantage window: ride within X minutes after opening. */
  rideByMinutesAfterOpen: number;
  /** Minutes after opening of the day's absolute lowest wait (often evening). */
  bestSlotMinutesAfterOpen: number;
  /**
   * Expected wait (minutes) at that trough — the payoff for coming back later.
   * Added in backend PR #69; absent/null until recommendations are recomputed.
   */
  bestSlotWait?: number | null;
  /**
   * Server verdict: better saved for late in the day than rope-dropped (the
   * trough falls in the back of the operating day, pre-closing line drain
   * excluded). Added in backend PR #69; absent/null until recomputed.
   */
  endOfDayWorth?: boolean | null;
  /** busyPeak − bestSlotWait (minutes saved at the evening trough). */
  endOfDaySavings?: number | null;
  /** openingTime + rideByMinutesAfterOpen for the next operating day (UTC ISO), or null. */
  rideByUtc: string | null;
  /** openingTime + bestSlotMinutesAfterOpen for the next operating day (UTC ISO), or null. */
  bestSlotUtc: string | null;
  byDaytype: {
    weekend: RopeDropDayBucket;
    weekday: RopeDropDayBucket;
  };
}

/** Park-level quick summary: headliners with worth=true, sorted by savings desc. */
export interface RopeDropHeadliner {
  attractionId: string;
  name: string;
  /** Minutes saved by rope-dropping on a busy day. */
  savings: number;
  strength: RopeDropStrength;
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
  /** Only set for tier1/tier2 headliners in parks with a schedule. */
  ropeDrop?: RopeDropInfo | null;
  /** Precomputed P50/P90 peak-wait stats — present for displayable headliners (SSR). */
  typicalWaits?: TypicalWaits | null;
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
  /** Headliners worth rope-dropping (worth=true), sorted by minutes saved. */
  ropeDropHeadliners?: RopeDropHeadliner[];
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

/**
 * Typical-vs-busy peak waits, derived from the distribution of daily peak waits
 * over a 365-day window. `typical` = P50 (a normal day's peak), `busy` = P90
 * (a busy day's peak), both in whole minutes (null when no data).
 */
export interface TypicalWaitBucket {
  typical: number | null;
  busy: number | null;
  sampleDays: number;
}

export interface DayOfWeekWait extends TypicalWaitBucket {
  /** 0=Sunday … 6=Saturday. */
  dayOfWeek: number;
  isWeekend: boolean;
}

export interface TypicalWaits {
  weekday: TypicalWaitBucket;
  weekend: TypicalWaitBucket;
  /** Per day-of-week, only days that have data (ordered 0=Sun…6=Sat). */
  byDayOfWeek: DayOfWeekWait[];
  /** Record peak over the window with its date (YYYY-MM-DD, park tz). */
  peak: { value: number; date: string } | null;
  windowDays: number;
  dataFrom: string;
  dataTo: string;
  /** Render only when true (the total sample is large enough to be meaningful). */
  displayable: boolean;
  generatedAt: string;
}

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
  /** Only set for tier1/tier2 headliners in parks with a schedule. */
  ropeDrop?: RopeDropInfo | null;
  /** Typical (P50) vs busy (P90) peak-wait stats — render when `displayable`. */
  typicalWaits?: TypicalWaits | null;
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
  /** Sparkline series. Optional: stripped from the ISR shell snapshot (re-supplied by the live
   *  no-store poll); present on live/detail responses. */
  history?: {
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
  timezone: string;
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
  parkTimezone: string;
  waitTime: number;
  url: string | null;
  crowdLevel: CrowdLevel | null;
  sparkline: { timestamp: string; waitTime: number }[];
  avgWaitToday: number | null;
  minWaitToday: number | null;
  peakWaitToday: number | null;
  peakWaitTimestamp: string | null;
  typicalWaitThisHour: number | null;
  currentVsTypical: number | null;
}

export interface GlobalStats {
  counts: GlobalCounts;
  mostCrowdedPark: ParkStatsItem | null;
  leastCrowdedPark: ParkStatsItem | null;
  longestWaitRide: AttractionStatsItem | null;
  shortestWaitRide: AttractionStatsItem | null;
}

export interface TickerItem {
  parkName: string;
  parkSlug: string;
  continentSlug: string;
  countrySlug: string;
  citySlug: string;
  attractionName: string;
  attractionSlug: string;
  waitTime: number;
  crowdLevel: CrowdLevel | null;
  trend?: TrendDirection;
  url: string | null;
}

export interface TickerResponse {
  items: TickerItem[];
  generatedAt: string;
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
    /** Served intraday accuracy (PCN champion-swap) — what users actually get for
     *  15-min slots. `live`/`byPredictionType.HOURLY` measure the CatBoost fallback,
     *  not the served model. null when PCN is not serving. */
    servedIntraday: {
      servedModel: 'pcn';
      mae: number;
      n: number;
      catboostMae: number | null;
      /** catboostMae − mae; > 0 ⇒ the served model beats the CatBoost fallback. */
      delta: number | null;
      days: number;
    } | null;
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
  /** ML FORWARD prediction for this day (predicted peak ÷ typical-day-peak). Equals
   *  crowdLevel on future days; on TODAY it differs — crowdLevel is overridden with the
   *  live occupancy, while this stays the true "forecast today". Optional: absent on
   *  API builds predating the field, and on days with no ratable prediction. */
  predictedCrowdLevel?: CrowdLevel;
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
  avgCrowdLevel: CrowdLevel;
  avgWaitP50: number;
  avgWaitP90: number;
  sampleDays: number;
}

export interface DayOfWeekStat {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  avgCrowdScore: number;
  avgCrowdLevel: CrowdLevel;
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
  rank: number;
}

export interface ParkHistoricalStats {
  byMonth: MonthStat[];
  byDayOfWeek: DayOfWeekStat[];
  topAttractions: TopAttractionStat[];
  meta: {
    totalSampleDays: number;
    windowYears: number;
    displayable: boolean;
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

// ============================================================================
// Popular Parks  (GET /v1/parks/popular)
// Parks ranked by tracked request volume — mirrors the cache-prewarm signal.
// ============================================================================

export interface PopularPark {
  rank: number;
  requests: number;
  id: string;
  name: string;
  slug: string;
  url: string | null;
  country: string | null;
  city: string | null;
  continent: string | null;
}
