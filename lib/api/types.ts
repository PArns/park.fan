// ============================================================================
// Enums and Constants
// ============================================================================

export type ParkStatus = 'OPERATING' | 'CLOSED' | 'UNKNOWN';
// 'UNKNOWN' means "no information", never "closed". Two ways it arrives:
//   - whole park: its wait times are unreadable (see `LiveWaitTimes`), so every
//     ride's `effectiveStatus` is UNKNOWN rather than a guess;
//   - single ride: no upstream source has reported it for 24h+ while the park
//     runs normally. ThemeParks.wiki dropped ~140 rides across ten parks from
//     its live feed this way, and they read as closed for weeks until the API
//     stopped serving its own bookkeeping as the operator's word.
// So raw `status` can be UNKNOWN too — it is no longer only the four upstream
// values. `queues` is emptied in both cases; there is no wait time to read.
export type AttractionStatus = 'OPERATING' | 'DOWN' | 'CLOSED' | 'REFURBISHMENT' | 'UNKNOWN';

/**
 * Why a park's wait times cannot be read. Contract with the API — see
 * `docs/frontend/live-wait-times-availability.md` in v4.api.park.fan.
 *
 * - `in_park_app_only`: the park serves them to its own app, only inside the park
 *   (typically its WLAN). Someone standing there can see them; we cannot.
 * - `not_published`: the park publishes them nowhere at all.
 */
export type NoLiveWaitTimesReason = 'in_park_app_only' | 'not_published';

/**
 * Whether a park's wait times are readable at all.
 *
 * **Permanent, not a freshness signal** — a park whose feed went quiet this morning
 * stays `available: true`. `false` means no number will ever arrive, so an empty
 * ride list is an absence and not a quiet park. Read it via
 * `noLiveWaitTimesReason()` (`@/lib/utils/live-wait-times`), which treats an absent
 * field as available so pages keep working against an older API.
 */
export interface LiveWaitTimes {
  available: boolean;
  reason: NoLiveWaitTimesReason | null;
}

export interface BestVisitSlot {
  time: string; // ISO 8601
  predictedWaitTime: number;
  rating: 'optimal' | 'good';
}
// Queue types moved to QueueDataItem definition area
// 'unknown' = "keine Prognose": there is nothing to rate against — the park is
// not ratable yet (< 30 operating days of headliner data → API sends
// typicalDayPeak=NULL), the ride has no P50 row of its own, or the park
// reported no live sample at all. Reaches every crowd surface including search
// results' `load`. Rendered as a neutral "no forecast" badge, never as a real
// crowd tier and never swapped for 'moderate'.
// A wait of 0 against a real baseline is NOT this case — that is a walk-on and
// arrives as 'very_low'.
export type CrowdLevel =
  'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme' | 'unknown';
export type AccuracyBadge = 'excellent' | 'good' | 'fair' | 'poor' | 'insufficient_data';
export type Recommendation =
  'highly_recommended' | 'recommended' | 'neutral' | 'avoid' | 'strongly_avoid' | 'closed';
export type ScheduleType = 'OPERATING' | 'CLOSED' | 'UNKNOWN';
export type TrendDirection =
  'up' | 'stable' | 'down' | 'increasing' | 'decreasing' | 'rising' | 'falling';
export type ComparisonStatus =
  'much_lower' | 'lower' | 'typical' | 'higher' | 'much_higher' | 'closed';
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

/**
 * Paid skip-the-line offer attached to a schedule day (Disney parks only today:
 * Lightning Lane single passes per attraction plus Multi/Premier Pass packages).
 * `price.formatted` may be a placeholder ("Unknown"/amount 0) — treat as no price.
 */
export interface SchedulePurchaseItem {
  id?: string;
  name: string;
  type?: 'ATTRACTION' | 'PACKAGE' | string;
  price: { amount: number; currency: string; formatted?: string } | null;
  available?: boolean;
}

export interface ScheduleItem {
  date: string;
  scheduleType: ScheduleType;
  openingTime: string | null;
  closingTime: string | null;
  description: string | null;
  purchases: SchedulePurchaseItem[] | null;
  isHoliday?: boolean;
  holidayName: string | null;
  /** What `holidayName` names. The API has always sent it and this type has always dropped it,
   *  which is how a school break ("Summer Holidays") reached the header wearing the party-popper
   *  the public-holiday chip uses — `isHoliday` alone cannot tell the two apart. */
  holidayType?: HolidayType | string | null;
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
  /** Minimum rider height in cm. Null/absent = unrestricted or unknown. */
  minimumHeight?: number | null;
  /** Maximum rider height in cm (kiddie rides). */
  maximumHeight?: number | null;
  /** Whether riders may get wet. Null/absent = unknown (not "dry"). */
  mayGetWet?: boolean | null;
  /** RCDB (rcdb.com) database id → https://rcdb.com/{id}.htm */
  rcdbId?: number | null;
  /**
   * Whether the ride has a single-rider line at all.
   *
   * A static fact about the queue layout, NOT whether it is open right now —
   * that is what the live `queues` array answers. Null/absent means unknown,
   * never "no": most of the catalogue has never been checked.
   */
  hasSingleRider?: boolean | null;
  /** Curated queue-jump product. Absent ≠ "there is none" — see `FastPass`. */
  fastPass?: FastPass | null;
  bestVisitTimes?: BestVisitSlot[] | null;
  /** Only set for tier1/tier2 headliners in parks with a schedule. */
  ropeDrop?: RopeDropInfo | null;
  /** Precomputed P50/P90 peak-wait stats — present for displayable headliners (SSR). */
  typicalWaits?: TypicalWaits | null;
  // Only present on attraction detail page (merged from dedicated endpoint)
  hourlyForecast?: ForecastItem[];
  predictionAccuracy?: PredictionAccuracy | null;
  /** Curated ride profile (track figures, ride type, builder) — see `RideProfile`. */
  rideProfile?: RideProfile | null;
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
  /**
   * The German article this park's name takes — `der`, `die` or `das` — or
   * absent for the names that take none, which is most of them.
   *
   * German copy cannot interpolate a park name without it: "im Phantasialand"
   * (das), "in der Movie World" (die), "in Toverland" (none). Pass it through
   * `parkArgs()` and let the message use `{inPark}` / `{forPark}` rather than
   * writing the preposition into the string.
   */
  nameArticleDe?: string | null;
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
  liveWaitTimes?: LiveWaitTimes;
}

/** What a season is. Mirrors the API's `PARK_SEASON_KINDS`. */
export type ParkSeasonKind =
  | 'halloween'
  | 'christmas'
  | 'summer_nights'
  | 'special_event'
  | 'opening'
  | 'closure'
  | 'maintenance';

/**
 * How settled a season is.
 *
 * Not decoration: a visitor planning October needs the difference between "the
 * park has published these dates" and "the park did this last year and has
 * announced nothing".
 */
export type ParkSeasonStatus = 'confirmed' | 'announced' | 'expected' | 'cancelled';

/** One named season or event, as the public endpoint serves it. */
export interface ParkSeason {
  id: string;
  kind: ParkSeasonKind;
  name: string | null;
  startDate: string;
  endDate: string;
  /** Null when it runs every day in the range; a list when it does not. */
  dates: string[] | null;
  status: ParkSeasonStatus;
  separateTicket: boolean;
  priceFrom: string | null;
  priceCurrency: string | null;
  opensAt: string | null;
  closesAt: string | null;
  attractionIds: string[] | null;
  url: string | null;
  sourceUrl: string | null;
  /** When it was last checked against the park's own page. */
  confirmedAt: string | null;
}

/**
 * The park facts a human wrote, from the API's `info` block.
 *
 * Every field is optional twice over: the API omits a null (the response
 * interceptor strips them) and the whole object is absent until somebody has
 * curated at least one. Detail payload only — the listings do not carry it.
 */
export interface ParkInfo {
  website?: string | null;
  ticketsUrl?: string | null;
  wikipediaUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  streetAddress?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  openedYear?: number | null;
  areaHectares?: number | null;
}

export interface ParkWithAttractions extends ParkBase {
  status?: ParkStatus;
  /** Curated facts no feed carries. Day-stable, so the live merge keeps it. */
  info?: ParkInfo | null;
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
  /**
   * Day-stable like `liveWaitTimes`, so it rides on the server render and never on the live poll's
   * projection — the calendar range it governs cannot change between two five-minute refreshes.
   */
  scheduleCoverage?: ScheduleCoverage;
  /** Day-stable, so it rides on the server render and the live merge carries it. */
  liveWaitTimes?: LiveWaitTimes;
}

/**
 * Lean live snapshot from `GET /v1/parks/{geo}/{park}/wait-times`: the park's own status plus
 * every attraction's current queues — and nothing else. ~9 KB for a 40-ride park versus ~95 KB
 * for the full park payload, which is what makes it viable as a *batch* live source for surfaces
 * that only need "open or closed, and how long" (the blog's inline ride references).
 */
export interface ParkWaitTimesResponse {
  park: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    status?: ParkStatus;
  };
  attractions: {
    attraction: { id: string; name: string; slug: string };
    queues: QueueDataItem[];
  }[];
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
  /**
   * Parent park block. Carries `timezone` and the park's live `status`, which is what lets a ride
   * page render from this response alone instead of also polling the full park payload for two
   * fields (see `useLiveAttractionData`). `status` was added in v4.api.park.fan#148.
   */
  park?: {
    id: string;
    name: string;
    slug: string;
    timezone?: string;
    continent?: string | null;
    country?: string | null;
    city?: string | null;
    status?: ParkStatus;
    /** Whether this park's wait times are readable — see {@link LiveWaitTimes}. */
    liveWaitTimes?: LiveWaitTimes;
  } | null;
  /** Wait-time trend direction. Present on this endpoint as well as on the park payload. */
  trend?: 'up' | 'down' | 'stable' | null;
  statistics?: AttractionStatistics;
  predictionAccuracy?: PredictionAccuracy | null;
  history?: AttractionHistoryDay[];
  schedule?: ScheduleItem[];
  isSeasonal?: boolean;
  seasonMonths?: number[] | null;
  isCurrentlyInSeason?: boolean | null;
  /** Minimum rider height in cm. Null/absent = unrestricted or unknown. */
  minimumHeight?: number | null;
  /** Maximum rider height in cm (kiddie rides). */
  maximumHeight?: number | null;
  /** Whether riders may get wet. Null/absent = unknown (not "dry"). */
  mayGetWet?: boolean | null;
  /** RCDB (rcdb.com) database id → https://rcdb.com/{id}.htm */
  rcdbId?: number | null;
  /**
   * Whether the ride has a single-rider line at all.
   *
   * A static fact about the queue layout, NOT whether it is open right now —
   * that is what the live `queues` array answers. Null/absent means unknown,
   * never "no": most of the catalogue has never been checked.
   */
  hasSingleRider?: boolean | null;
  /** Curated queue-jump product. Absent ≠ "there is none" — see `FastPass`. */
  fastPass?: FastPass | null;
  bestVisitTimes?: BestVisitSlot[] | null;
  /** Only set for tier1/tier2 headliners in parks with a schedule. */
  ropeDrop?: RopeDropInfo | null;
  /** Typical (P50) vs busy (P90) peak-wait stats — render when `displayable`. */
  typicalWaits?: TypicalWaits | null;
  /** Curated ride profile (track figures, ride type, builder) — see `RideProfile`. */
  rideProfile?: RideProfile | null;
}

/**
 * The paid (or free) queue-jump product a ride sells.
 *
 * Hand-curated: no feed publishes these, they live in park apps and on ticket
 * pages. The API sends the parts and this app composes them, because "12 €" and
 * "€12" are the same price in two locales and only the frontend knows which one
 * the reader is in.
 *
 * **An absent `fastPass` is not "this ride has no fast pass."** It covers both
 * "nobody has checked" and "somebody checked and the park sells none" — the
 * admin keeps those apart, the payload deliberately does not. Most of the ~7000
 * attractions have never been looked at, so rendering "kein Fastpass" from an
 * absence would state the park's position on our behalf. Badge what is there;
 * render nothing for what is not.
 */
export interface FastPass {
  /** The park's brand, the ride's override, or the neutral "Fast Pass". */
  name: string;
  /**
   * What it costs, in `currency`.
   *
   * **`0` means free** — Europa-Park's Virtual Line is included with admission.
   * `null` means unknown, which includes the products priced per day. Test
   * `price != null`, never `if (price)`.
   */
  price?: number | null;
  /**
   * What the park's cheapest version costs, for the parks that sell one pass
   * per visit rather than one per ride — which is nearly all of them.
   *
   * Render as "ab 25 €". Null whenever `price` is set: they answer the same
   * question, and showing both says one of them is wrong.
   */
  priceFrom?: number | null;
  /** ISO-4217, for `Intl.NumberFormat`. Null when there is no price to denominate. */
  currency?: string | null;
  /** Glossary term id explaining the product kind, e.g. `quick-pass`. */
  termId?: string | null;
}

/**
 * The curated "what kind of ride is this, and what does it do" record.
 *
 * Every id in here is a **glossary term id** (`lib/glossary/data.ts`). The API
 * only stores ids; this app owns the glossary, so it resolves each one to a
 * localized name and a link and silently drops any id it does not know — which
 * is what keeps the API free to be seeded ahead of a term landing here.
 */
export interface RideProfile {
  /**
   * Track figures **in ride order**. Repeats are meaningful: a layout that hits
   * two corkscrews in a row lists `corkscrew` twice. Empty for rides with no
   * track figures (dark rides, flat rides).
   */
  elements: string[];
  /** Ride-type terms (`coasters` / `attractions` categories). Unordered. */
  types: string[];
  /**
   * Everything below is OPTIONAL as well as nullable, and the `?` is the
   * important half: the API strips null-valued keys from its responses, so an
   * unknown value arrives as a MISSING key, not as `null`. Guard with `!= null`
   * — `!== null` passes `undefined` straight through, which is how a ride with
   * no inversion count rendered a badge reading "Inversions:" and nothing else.
   */
  /** Builder's display name. */
  manufacturer?: string | null;
  /** Builder's glossary term id — absent means render the name without a link. */
  manufacturerTermId?: string | null;
  /** The builder's own model name, e.g. "Blitz Coaster". */
  model?: string | null;
  openedYear?: number | null;
  /** As the park publishes it; may legitimately differ from `elements`. */
  inversions?: number | null;
  /**
   * Measurements. Null for rides we hold no measurement of at all, and every
   * field inside is independently nullable — read each one defensively.
   */
  stats?: RideStats | null;
}

/**
 * A ride's measurements, always metric — the display unit is the visitor's
 * (see `lib/utils/temperature.ts`: the C/F choice drives every secondary unit).
 * Merged field by field from a hand-curated seed and the Wikidata (CC0) import,
 * curated winning. Every field is independently nullable: a ride is listed the
 * moment one number is known, not once all four are.
 */
export interface RideStats {
  /** Top speed in km/h. */
  topSpeedKmh: number | null;
  /** Highest point in metres. */
  heightM: number | null;
  /** Track length in metres. */
  lengthM: number | null;
  /** Ride duration in seconds. */
  durationSeconds: number | null;
  /**
   * Which side of the merge the surviving values came from. Provenance only —
   * to render the credit line, read {@link RideStats.attribution}.
   */
  source: 'curated' | 'wikidata' | 'mixed';
  /** Wikidata entity id — `attribution.url` already points at it. */
  sourceId?: string | null;
  /**
   * Who to credit, resolved by the API: null exactly when every surviving
   * number is hand-curated and nobody outside is owed one.
   *
   * Render it when it is there and nothing when it is not. Do **not** rebuild
   * the rule from `source`/`sourceId` — doing that is what credited RCDB for
   * numbers RCDB never supplied.
   */
  attribution?: RideStatsAttribution | null;
}

/** A credit line the API has already resolved: who, and where they say it. */
export interface RideStatsAttribution {
  /** Source name to credit, e.g. "Wikidata". Localize the sentence, not this. */
  label: string;
  /** The record the numbers are stated on. Absolute, ready to link. */
  url: string;
}

/** One ride in the glossary → rides direction (`/v1/glossary/terms/:id/attractions`). */
export interface TermAttraction {
  name: string;
  slug: string;
  parkName: string;
  url: string;
  continentSlug: string;
  countrySlug: string;
  citySlug: string;
  parkSlug: string;
  /** Where the term matched on this ride. */
  kind: 'element' | 'type' | 'manufacturer';
  /** Optional as well as nullable — the API strips null-valued keys. */
  openedYear?: number | null;
  /**
   * Typical peak wait in minutes — the API's P90 over 548 days, not a live
   * reading.
   *
   * OPTIONAL rather than merely nullable, and that distinction matters: the API
   * runs a global interceptor that deletes null-valued keys from every
   * response, so a ride without a baseline omits this field entirely. Check for
   * absence (`!= null`), never render a `0` fallback — that would read as "this
   * ride never has a queue".
   */
  typicalPeakWait?: number | null;
  /** Whether the API classes this ride as one of its park's headliners. */
  isHeadliner?: boolean;
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
  /**
   * Thumbnail path. NOT from the backend — the `/api/search` proxy resolves it from the media
   * database, which lives in this repo (see `lib/utils/search-assets.ts`).
   */
  imageUrl?: string;
  /** The thumbnail's focal point as a CSS `object-position`, from the same sidecar. */
  imagePosition?: string;
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
  /** Park position — null for parks the backend could not geocode. Feeds the "X km away" line
   *  on the hub-page park cards without a per-park lookup. */
  latitude?: number | null;
  longitude?: number | null;
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
  /**
   * Whether this park's wait times are readable — see {@link LiveWaitTimes}. The `/api/parks/live`
   * projection reads it to decide whether the `analytics` block above means anything, and drops
   * the wait-derived fields when it does not, so the flag itself never reaches the client.
   */
  liveWaitTimes?: LiveWaitTimes;
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

/** A single headliner ride's expected wait for a calendar day. */
export interface HeadlinerWaitForecast {
  attractionId: string;
  name: string;
  /** Expected (predicted) standby wait for this day, in minutes. */
  waitTime: number;
}

/** Expected headliner waits for a calendar day — grounds the abstract crowd
 *  level in concrete numbers. Present on days with ML predictions (today +
 *  future), absent on completed/closed days. */
export interface HeadlinerForecast {
  /** Average wait across the park's headliners (minutes, rounded to 5). */
  avgWait: number;
  /** Top headliner rides for this day, sorted by wait desc (minutes, rounded to 5). */
  rides: HeadlinerWaitForecast[];
  /** true = actual recorded averages for a PAST day; false/absent = forecast. */
  actual?: boolean;
}

/** A holiday in a NEIGHBOURING region (top influencing regions only) whose
 *  day-trippers raise local crowds. Distinct from the local holiday flags. */
export interface NeighborHoliday {
  name: string;
  source: {
    countryCode: string;
    regionCode?: string | null;
  };
  /** 'public' | 'school' | 'bank'. */
  holidayType: string;
  /** Influence rank: 1 = nearest/most important region (strongest crowd impact). */
  priority: number;
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

/**
 * Everything a ParkCard overlays on top of its prerendered shell — i.e. every field that can
 * change during the day. This is the whole response shape of `/api/parks/live`, keyed by park id.
 *
 * The card grids (hub pages, featured strip, blog references) render structure server-side and
 * leave these nine fields blank until the batch call lands, which is what lets those shells cache
 * for a day. Keep it a projection: a field added here is a field re-downloaded for every park in
 * the region on every 5-minute poll.
 */
export interface LiveParkFields {
  status?: ParkStatus;
  crowdLevel?: CrowdLevel;
  averageWaitTime?: number;
  operatingAttractions?: number;
  totalAttractions?: number;
  timezone?: string;
  hasOperatingSchedule?: boolean;
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
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

/**
 * How far a park's published schedule reaches — MIN/MAX of its park-level OPERATING rows.
 *
 * Both ends are `null` for a park that has none, and the whole field is absent on a payload the
 * API cached before it shipped (3 min open, up to 6 h closed), so always read it optionally.
 *
 * Past `to` the API is no longer reporting a status, it is inferring one, and the inference is
 * worthless in both directions: a seasonal park comes back `CLOSED` for every day (Phantasialand
 * answered CLOSED for all of July 2027, mid-season, because its 2027 hours were not out yet) and a
 * year-round one comes back `UNKNOWN` with the constant `moderate` fallback and no hours
 * (Disneyland Paris and Toverland, same month). Neither is a page worth publishing.
 */
export interface ScheduleCoverage {
  /** `YYYY-MM-DD` in park timezone, or null when the park publishes no schedule at all. */
  from: string | null;
  /** `YYYY-MM-DD` in park timezone, or null. The last date the API actually knows about. */
  to: string | null;
}

export interface CalendarMeta {
  slug: string;
  timezone: string;
  hasOperatingSchedule: boolean;
  /** Absent on a response the API cached before this field shipped — read it optionally. */
  scheduleCoverage?: ScheduleCoverage;
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
  /** Total precipitation for the day in mm (legacy name — NOT a percentage). */
  rainChance: number;
  /** Total precipitation for the day, in mm. */
  precipitationMm?: number;
  /** Total snowfall for the day, in cm. */
  snowMm?: number;
  /** Maximum wind speed for the day, in km/h. */
  windMax?: number;
  /** Relative humidity (%), when available (today). */
  humidity?: number;
  /** Apparent ("feels like") temperature, when available (today). */
  apparentTemp?: number;
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
   *  `crowdLevel` on today and every future day — it used to differ on TODAY, where
   *  `crowdLevel` was overridden with a live occupancy spot reading, and the override is
   *  gone. Kept as its own field because a past day's `crowdLevel` is a measurement and
   *  this one stays a prediction. Optional: absent on API builds predating the field, and
   *  on days with no ratable prediction. */
  predictedCrowdLevel?: CrowdLevel;
  /** TODAY ONLY: how today has actually gone SO FAR — a day-so-far aggregate, against
   *  `crowdLevel`'s forecast for the same day. The pair is what makes „heute bisher /
   *  Prognose" mean something; both are a day aggregate ÷ typical-day-peak, so they are on
   *  one scale. Absent before the day has enough samples to rate, on unratable parks, on
   *  closed days and on every non-today day (there `crowdLevel` is already a measurement). */
  todayCrowdLevel?: CrowdLevel;
  /** How many observations {@link todayCrowdLevel} was rated from — lets a surface hide a
   *  thin morning reading instead of showing "very low" next to a "very high" forecast. */
  todayCrowdLevelSamples?: number;
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
  /** Expected headliner waits (avg + top rides) — decodes the crowd level into
   *  concrete "what to expect at THIS park" numbers. Today + future days only. */
  headlinerForecast?: HeadlinerForecast;
  /** Priority-ranked holidays in neighbouring regions (top influencing regions
   *  only) that raise local crowds. Shown as a distinct calendar-cell marker. */
  neighborHolidays?: NeighborHoliday[];
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
  /**
   * The land the ride stands in, curated value winning over the Queue-Times one.
   *
   * OPTIONAL as well as nullable: the API strips null-valued keys from every response, and
   * Queue-Times publishes no land at all for whole parks. Render the column only when at least
   * one row in the table carries a value, or a park with no lands gets a column of dashes.
   */
  land?: string | null;
  /**
   * Coarse ride type ("Roller Coaster"), curated value winning. This is the free-text
   * `attraction_type` column, NOT the ride-type glossary terms in `rideProfile` — those answer a
   * different question ("launch coaster", "omnimover") and must not be joined onto this one.
   */
  attractionType?: string | null;
}

export interface ParkHistoricalStats {
  byMonth: MonthStat[];
  byDayOfWeek: DayOfWeekStat[];
  topAttractions: TopAttractionStat[];
  meta: {
    totalSampleDays: number;
    windowYears: number;
    displayable: boolean;
    /**
     * Measured days an attraction needed to enter `topAttractions`. Optional: responses cached
     * before schemaVersion 3 do not carry it, and nothing renders it — it is here so a reader of
     * the payload can tell a filtered ranking from an unfiltered one.
     */
    minAttractionDays?: number;
  };
}

// ============================================================================
// Park Hourly Profile  (GET /v1/parks/.../stats/hourly)
// ============================================================================

export interface HourlyProfileAttraction {
  attractionSlug: string;
  attractionName: string;
  land?: string | null;
  /**
   * Quiet-hour wait (P25), aligned with `hours` the same way as {@link p50}.
   *
   * Optional because it is newer than the endpoint: a deployment answering the
   * v3 projection sends no `p25` at all, and a chart that assumed one would
   * draw a band with no lower edge. Every reader treats an absent array as
   * "no spread available" and falls back to the median line.
   */
  p25?: Array<number | null>;
  /**
   * Median wait per hour, POSITIONAL: `p50[i]` belongs to `hours[i]`, never to `i` o'clock.
   * `null` is a gap — the ride reported nothing in that hour — and is not the same claim as a
   * zero, which would say the queue was empty.
   */
  p50: Array<number | null>;
  /** Busy-hour wait (P90), aligned with `hours` the same way. */
  p90: Array<number | null>;
  /** The hour in `hours` where this ride's own median peaks. */
  peakHour: number | null;
  sampleDays: number;
}

/**
 * One ride's day: what it normally does, what it has done so far today, and what
 * the model expects for the rest.
 *
 * Everything is POSITIONAL against `hours`, and `today`/`forecast` never overlap
 * — an hour already measured carries `forecast: null`, so a chart cannot draw
 * the model's guess on top of the fact. See docs/frontend/ride-day-curve.md in
 * the API repo.
 */
export interface RideDayCurve {
  hours: number[];
  attractionSlug: string;
  attractionName: string;
  p25: Array<number | null>;
  p50: Array<number | null>;
  p90: Array<number | null>;
  /** Measured today. `null` for an hour not yet reached, or one the ride reported nothing in. */
  today: Array<number | null>;
  /** Expected, for hours not yet measured. */
  forecast: Array<number | null>;
  /**
   * What the model said for each hour BEFORE it happened — every hour it has an
   * opinion about, measured or not.
   *
   * Optional: an API still on the older schema sends none, and the chart then
   * draws no comparison line rather than an empty one.
   */
  predicted?: Array<number | null>;
  /**
   * The ride's own mean absolute error in minutes.
   *
   * A measured, published figure — a caller may draw the forecast as
   * `± forecastError`, but must NOT fan it out with the horizon, which nothing
   * measures. `null` where the ride has not been scored.
   */
  forecastError: number | null;
  /** False for a park not open yet, a closed ride, an out-of-season ride. */
  measuredToday: boolean;
  sampleDays: number;
  timezone: string;
  generatedAt: string;
  schemaVersion: number;
}

/**
 * The park's day shape, ride by ride — the matrix behind a "when is the queue longest" table.
 *
 * A lean projection rather than a slice of the attraction detail endpoint: that one costs ~53 KB
 * per ride (45 % of it a `schedule` nobody renders), so an eight-ride table cost 424 KB there and
 * ~2 KB here. See docs/architecture/api-budget.md.
 */
export interface ParkHourlyProfile {
  /**
   * Hours the table has columns for, park-local and ascending. Derived from the data, so a park
   * that opens at 11 starts at 11 — never assume a fixed 9–18 window.
   */
  hours: number[];
  attractions: HourlyProfileAttraction[];
  meta: {
    parkSlug: string;
    dataFrom: string;
    dataTo: string;
    windowYears: number;
    totalSampleDays: number;
    displayable: boolean;
    generatedAt: string;
    schemaVersion: number;
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
  /** Absent for a park whose wait times are unreadable — see {@link LiveWaitTimes}. */
  operatingAttractions?: number;
  analytics?: {
    avgWaitTime?: number;
    crowdLevel?: string;
    occupancy?: number;
  };
  url: string | null;
  timezone: string;
  hasOperatingSchedule: boolean;
  liveWaitTimes?: LiveWaitTimes;
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

// ============================================================================
// Trip planner — one day, ride by ride
// ============================================================================

/**
 * How a plan number was arrived at. It travels with every curve because the
 * three are not equally trustworthy and nothing about a rendered bar says which
 * one produced it.
 *
 * - `measured` — the model's own hourly prediction. Today and tomorrow only:
 *   the ML service generates 24 hours ahead (`HOURLY_PREDICTIONS`).
 * - `composed` — a day-level prediction scaled by the ride's historical hour
 *   shape. The level is predicted, the shape is historical.
 * - `long_range` — the same composition past the stored 60-day daily horizon,
 *   where the day level itself is thinner.
 *
 * A surface MUST render the three differently. A composed curve is not a
 * measured one, and they draw identically unless something is done about it.
 */
/**
 * How a curve was produced. `observed` is the one that points BACKWARDS and is
 * not a forecast at all: a date in the past is answered from what the queues
 * actually did, out of the nightly 15-minute rollup, so a day somebody already
 * walked stops predicting at itself.
 */
export type PlanDayTier = 'observed' | 'measured' | 'composed' | 'long_range';

export interface PlanDayHour {
  /** Park-local hour, 0–23. */
  hour: number;
  /** Expected wait in minutes, already rounded to 5. */
  wait: number;
  /**
   * Set only where THIS hour did not come from the day's {@link PlanDay.tier}.
   *
   * A day inside the 24-hour window is part measured and part composed — today
   * has no measurement for the hours before now, tomorrow none for the hours
   * after it — so the tier names the day's regime and this names the exceptions.
   * Absent means "the day's tier", never "unknown".
   */
  source?: PlanDayTier | null;
}

export interface PlanDayRide {
  attractionSlug: string;
  attractionName: string;
  land?: string | null;
  /** One entry per open hour. */
  hours: PlanDayHour[];
  /** The day-level prediction this ride's curve was scaled to. */
  dayPeak: number;
  /**
   * Half-width of the model's uncertainty band in minutes (its top trained
   * quantile minus the served median). `null` where the model reports no
   * spread — which is NOT a band of width zero and must not be drawn as one.
   */
  uncertaintyMinutes?: number | null;
  /**
   * When THIS ride starts, park-local `HH:mm`, rounded to the quarter hour.
   *
   * A fact the planner had no source for until the API grew it, and the gap it
   * closes is not small: Phantasialand's gates open at 09:00 and sixteen of its
   * rides — Taron, F.L.Y., both Winja's, Talocan, Crazy Bats, Mystery Castle,
   * River Quest, Colorado Adventure, Raik and more — do not run until 10:00, so
   * the planner offered two hours of queue that did not exist.
   *
   * `hours` already begins here, so nothing needs clamping or filtering; this
   * field is for SAYING it. Absent means the ride opens with the park, or that
   * too few openings have been observed to tell — the two are the same to a
   * reader, so absent renders nothing and `hours` is right either way.
   *
   * The rounding is deliberate: a raw 10:10 is five-minute polling plus feed
   * lag on top of a 10:00 opening. There is no `closesAt` and there will not be
   * one — feeds do not reliably flip back to CLOSED in the evening, so a
   * closing time would be a guess.
   */
  opensAt?: string | null;
  /** Measured days behind the historical shape. */
  sampleDays: number;
  /**
   * The typical error of this ride's own numbers, in minutes.
   *
   * Per RIDE and not per day, because it depends on both the lead time and the
   * level: a queue that peaks over an hour is typically 21–25 minutes out, one
   * under half an hour 8–13. It is a TYPICAL error and not a bound — half the
   * days are further off than this — so it may never be drawn as an interval
   * that contains the answer. Absent where the backend has not measured one.
   */
  expectedError?: number | null;
  /**
   * Where the ride is, so the planner can say how far apart two consecutive
   * entries are without fetching forty attraction payloads.
   *
   * A geodesic distance between two of these is a LOWER BOUND on the walk and
   * nothing more — park paths bend around water, queues and one-way routing, and
   * Phantasialand stacks two lands vertically. State a floor; never present the
   * straight line as a walking time.
   */
  latitude?: number | null;
  longitude?: number | null;
  /**
   * The ride's photo, added by the proxy route rather than by the API: the media
   * database is a filesystem catalogue in this repo, not something api.park.fan
   * knows about. Carries the content hash as a query, because retargeting a
   * focal point rewrites a crop's bytes at an unchanged URL.
   */
  backgroundImage?: string | null;
  /** `object-position` from the image's curated focal point. */
  backgroundPosition?: string;
  /**
   * The ride was observed all through the previous operating day and was never
   * OPERATING in any of it — down for the whole day rather than unobserved. A
   * ride with no observations at all is silence and is not reported here.
   * Absent past tomorrow: yesterday's downtime says nothing a visitor can act on
   * for a Tuesday in November.
   */
  downYesterday?: boolean;

  /**
   * Whether the park counts this ride among its headliners.
   *
   * The API's CURATED answer, never re-derived here from `dayPeak`: the day's
   * tallest bars are whatever happens to be busy, and pointing at those would
   * recommend the queue rather than the ride. Absent on an ordinary ride.
   */
  isHeadliner?: boolean;
  /**
   * Minimum rider height in centimetres, the curated answer over the synced one.
   *
   * Here so the planner can answer "can the six-year-old ride this" for a whole
   * day at once — the alternative is forty attraction payloads at 425 KB each.
   * Absent where there is no minimum to state, which covers both "nothing
   * recorded" and "a curator says there is none", and must never be turned into
   * a promise that anyone may ride (`canRideAtHeight` treats it that way for
   * the same reason `isCurrentlyInSeason` uses `!== false`).
   */
  minimumHeight?: number | null;
  /** Whether the ride may soak you. Absent is unknown, never "dry". */
  mayGetWet?: boolean | null;
}

export interface PlanDayContext {
  date: string;
  status: ParkStatus | string;
  /** First and last park-local hour the park is open. `null` on a closed day. */
  openHour: number | null;
  closeHour: number | null;
  /**
   * Where {@link openHour}/{@link closeHour} came from.
   *
   * `schedule` is the park's published calendar. `observed` is the window
   * DERIVED from hours we measured, which is what the API falls back to past the
   * publication horizon — about 60 days for half the parks — and it is narrower
   * than the truth by construction: it can only span hours somebody recorded. On
   * such a day `status` is not a promise either.
   */
  hoursSource?: 'schedule' | 'observed' | null;
  crowdLevel?: CrowdLevel | 'closed' | null;
  /**
   * Absent past the forecast's reach (about 14 days). The API does NOT
   * substitute a climate normal there, so a caller must not present a missing
   * value as "no rain expected".
   */
  weather?: WeatherSummary | null;
  isHoliday: boolean;
  isBridgeDay: boolean;
  isSchoolVacation: boolean;
  /** Derived by the API — `CalendarDay` carries no such field. */
  isWeekend: boolean;
  neighborHolidays?: NeighborHoliday[];
}

export interface PlanDay {
  parkSlug: string;
  timezone: string;
  context: PlanDayContext;
  tier: PlanDayTier;
  /** Whole days from today to this date, in the park's timezone. */
  leadDays: number;
  /**
   * Measured mean absolute error for predictions made this far ahead, in
   * minutes. `null` until the backend's lead-time archive has been running that
   * long — and `null` is the honest answer rather than a gap to fill: nothing
   * measures how wrong the model is at this distance yet. Widen the band with
   * distance WITHOUT attaching a figure.
   */
  leadTimeMae?: number | null;
  /**
   * Whether anybody has checked how wrong the forecast is at this distance.
   *
   * `measured` means the error at this lead time has been compared against days
   * that then happened; `unmeasured` means a prediction exists and nothing has
   * ever verified it. `null` where the API says nothing at all.
   *
   * It behaves as documented again. Between 2026-09-02 and 2026-09-03 the API
   * answered `unmeasured` for TODAY (`leadDays: 0`), which is why the note that
   * stood here said the field could not be wired to anything: applying "never
   * present an unmeasured day as a plannable day" literally would have refused
   * every day the planner has. Re-measured on 2026-09-04 across six lead times
   * at Phantasialand — 0, 1, 3, 16 and 41 days all answer `measured` with a
   * `typicalError`, 87 days answers `unmeasured` with none. So `unmeasured` is
   * what it says: past the horizon where anybody has checked.
   *
   * This is also the field that replaced the `long_range` tier in practice. The
   * tier still types it, and the same six probes never returned it: what a day
   * three months out actually looks like is `tier: 'composed'` with
   * `basis: 'unmeasured'`, so the band reads the basis rather than waiting for a
   * tier the API has stopped sending.
   */
  accuracy?: {
    basis?: 'measured' | 'unmeasured' | null;
    /**
     * The day's own typical error in minutes, over every ride and hour in it.
     *
     * A TYPICAL error and not a bound — half the days are further off — so it
     * may never be drawn as an interval that contains the answer, which is the
     * same rule `PlanDayRide.expectedError` carries per ride. Present only
     * where `basis` is `measured`; 8.9 minutes for today at Phantasialand,
     * 14.3 at sixteen days.
     */
    typicalError?: number | null;
    /**
     * Observations behind that figure. It GROWS with the lead time (50,759 for
     * today, 1,155,876 at sixteen days) because a composed day is scaled from a
     * far wider historical window than a measured one, so it is a statement
     * about the method rather than about the day's own quality.
     */
    sampleSize?: number | null;
  } | null;
  /**
   * The park's own photo, added by the proxy route rather than by the API — the
   * media database is a filesystem catalogue in this repo. It is what the
   * planner panel sits on; `null` where the park has no picture, which is most
   * of them.
   */
  parkBackgroundImage?: string | null;
  /** `object-position` from the image's curated focal point. */
  parkBackgroundPosition?: string;
  rides: PlanDayRide[];
  shows: PlanDayShow[];
}

/**
 * Where a showtime came from, and the one thing a surface may not blur.
 *
 * - `scheduled` — the operator's own listing. Published for today and for days
 *   already past, and for nothing else: no source anywhere knows showtimes in
 *   advance.
 * - `projected` — this app's upstream carrying the last matching weekday
 *   forward. It is an observation of a different day, not a promise about this
 *   one, and the API says so explicitly with {@link PlanDayShow.observedOn}.
 *
 * The two MUST be drawn differently. They are the same shape and the same
 * fields, so nothing but a deliberate difference separates them, and a
 * projection presented as a listing is this app promising a performance that
 * nobody has scheduled.
 */
export type PlanDayShowSource = 'scheduled' | 'projected';

export interface PlanDayShow {
  showSlug: string;
  showName: string;
  /** Park-local `HH:mm`, ascending. */
  times: string[];
  source: PlanDayShowSource;
  /**
   * `projected` only: the date these times were actually observed on — the most
   * recent same weekday. Absent on a `scheduled` entry, which speaks for the
   * date it was asked about.
   */
  observedOn?: string | null;
  /** `projected` only: how many measured days stand behind the projection. */
  sampleDays?: number | null;
}
