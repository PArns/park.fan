/** A park's overall status. */
export type ParkStatus = 'OPERATING' | 'CLOSED' | 'UNKNOWN';
/**
 * An attraction's status. `UNKNOWN` means „no information", never closed: the whole park's wait
 * times are unreadable (see `LiveWaitTimes`), or no upstream source has reported the ride for a
 * day while the park runs normally. `queues` is empty in both cases.
 */
export type AttractionStatus = 'OPERATING' | 'DOWN' | 'CLOSED' | 'REFURBISHMENT' | 'UNKNOWN';

/**
 * What an attraction is FOR, decided by an editor; the API's `ATTRACTION_KIND_VALUES` is the same
 * four. Not the upstream's free-text `attractionType`, which files water rides as ATTRACTION and
 * walkthroughs as RIDE. Contract: `docs/frontend/attraction-kind.md` in v4.api.park.fan.
 */
export type AttractionKind = 'RIDE' | 'TRANSPORT' | 'SHOW' | 'WALKTHROUGH' | 'MAZE';

/**
 * Where an attraction stands in the weather: the ride under a roof (`indoor`), in the open
 * (`outdoor`), or in the open behind a roofed queue (`covered_queue`). Curated per ride.
 */
export type IndoorOutdoor = 'indoor' | 'outdoor' | 'covered_queue';

/**
 * Why a park's wait times cannot be read: `in_park_app_only` (only in the park's own app, inside
 * the park) or `not_published`. Contract: `docs/frontend/live-wait-times-availability.md` in
 * v4.api.park.fan.
 */
export type NoLiveWaitTimesReason = 'in_park_app_only' | 'not_published';

/**
 * Whether a park's wait times are readable at all. Permanent, not a freshness signal: `false`
 * means no number will ever arrive. Read it via `noLiveWaitTimesReason()`, which treats an absent
 * field as available. See docs/rules/parks-we-cannot-read.md.
 */
export interface LiveWaitTimes {
  available: boolean;
  reason: NoLiveWaitTimesReason | null;
}

/** A good time to ride, from the model's forecast. */
export interface BestVisitSlot {
  time: string; // ISO 8601
  predictedWaitTime: number;
  rating: 'optimal' | 'good';
}
/**
 * The crowd scale. `unknown` means „no forecast": nothing to rate against (a park with too little
 * history, a ride without its own P50, or no live sample). It renders as a neutral badge, never as
 * a tier and never as `moderate`. A wait of 0 against a real baseline is a walk-on, `very_low`.
 */
export type CrowdLevel =
  'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme' | 'unknown';
/** The prediction-accuracy grade. */
export type AccuracyBadge = 'excellent' | 'good' | 'fair' | 'poor' | 'insufficient_data';
/** How strongly a day or slot is recommended. */
export type Recommendation =
  'highly_recommended' | 'recommended' | 'neutral' | 'avoid' | 'strongly_avoid' | 'closed';
/** A schedule day's type. */
export type ScheduleType = 'OPERATING' | 'CLOSED' | 'UNKNOWN';
/** A trend direction; the API uses several spellings. */
export type TrendDirection =
  'up' | 'stable' | 'down' | 'increasing' | 'decreasing' | 'rising' | 'falling';
/** How a reading compares with the usual. */
export type ComparisonStatus =
  'much_lower' | 'lower' | 'typical' | 'higher' | 'much_higher' | 'closed';
/** The kind of holiday a day falls in. */
export type HolidayType = 'public' | 'observance' | 'school' | 'bank';

/** One step of a breadcrumb trail. */
export interface Breadcrumb {
  name: string;
  url: string;
  className?: string;
}

/** Paging info of a paginated API answer. */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** A paginated API answer. */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

/**
 * Paid skip-the-line offer attached to a schedule day (Disney parks: Lightning Lane passes and
 * packages). A `price` of 0 or „Unknown" is a placeholder; treat it as no price.
 */
export interface SchedulePurchaseItem {
  id?: string;
  name: string;
  type?: 'ATTRACTION' | 'PACKAGE' | string;
  price: { amount: number; currency: string; formatted?: string } | null;
  available?: boolean;
}

/** One day of a park's schedule. */
export interface ScheduleItem {
  date: string;
  scheduleType: ScheduleType;
  openingTime: string | null;
  closingTime: string | null;
  description: string | null;
  purchases: SchedulePurchaseItem[] | null;
  isHoliday?: boolean;
  holidayName: string | null;
  /** What `holidayName` names, so a school break is not shown with the public-holiday chip;
   *  `isHoliday` alone cannot tell the two apart. */
  holidayType?: HolidayType | string | null;
  isBridgeDay?: boolean;
  isSchoolVacation?: boolean;
  isPublicHoliday?: boolean;
  isSchoolHoliday?: boolean;
  isInferred?: boolean;
  influencingHolidays?: InfluencingHoliday[];
}

/** API `nextSchedule` shape: often only openingTime, closingTime and scheduleType, no date. */
export type NextScheduleItem = Omit<ScheduleItem, 'date'> & { date?: string };

/** Compact schedule summary used in park cards and nearby responses. */
export interface ScheduleSummary {
  openingTime: string;
  closingTime: string;
  scheduleType: string;
}

/** One day of weather, current or forecast; numbers arrive as strings. */
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

/** The weather right now. */
export interface WeatherNow {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
}

/** CAP severity of a weather warning. */
export type WeatherWarningSeverity = 'Minor' | 'Moderate' | 'Severe' | 'Extreme';

/**
 * Official severe-weather warning: DWD (via Bright Sky) for German parks, MeteoAlarm (via
 * MeteoGate) for the rest of Europe, none elsewhere. Pick the `*En` field per locale and fall back
 * to German when it is null.
 */
export interface WeatherWarning {
  /** Stable id (CAP alert id), usable as a list key. */
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

/** A park's weather block. */
export interface WeatherData {
  current?: WeatherDay;
  now?: WeatherNow | null;
  forecast?: WeatherDay[];
  /** Active severe-weather warnings (empty/absent when none). */
  warnings?: WeatherWarning[];
}

/** Rain intensity in the nowcast. */
export type RainIntensity = 'light' | 'moderate' | 'heavy';

/** One 15-minute step of the nowcast. */
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

/** Source credit for the nowcast data. */
export interface WeatherNowcastAttribution {
  url: string;
  license: string;
  attribution: string;
}

/** The park's short-term weather nowcast (15-minute steps, about two hours ahead). */
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
  // Event timestamps: the backend omits them when no event is forecast.
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

/** One hour of today's forecast (proxied from Open-Meteo). */
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

/** Today's hour-by-hour weather forecast. */
export interface WeatherHourlyToday {
  /** IANA timezone the point times are local to. */
  timezone: string;
  points: WeatherHourlyPoint[];
}

/** The kinds of queue a ride can have. */
export type QueueType =
  | 'STANDBY'
  | 'SINGLE_RIDER'
  | 'RETURN_TIME'
  | 'PAID_RETURN_TIME'
  | 'BOARDING_GROUP'
  | 'PAID_STANDBY';

/** A queue's own status. */
export type QueueStatus = 'OPERATING' | 'DOWN' | 'CLOSED' | 'REFURBISHMENT';

/** Short-term wait-time trend the API attaches to live queues (STANDBY, SINGLE_RIDER). */
export interface QueueTrend {
  direction: TrendDirection;
  changeRate: number;
  recentAverage: number;
  previousAverage: number;
}

/** Fields every queue kind shares. */
export interface BaseQueue {
  queueType: QueueType;
  status: QueueStatus;
  lastUpdated: string;
  /** Present on live standby/single-rider queues; absent from the park-list snapshot. */
  trend?: QueueTrend;
}

/** The regular standby line. */
export interface StandbyQueue extends BaseQueue {
  queueType: 'STANDBY';
  waitTime: number | null;
}

/** The single-rider line. */
export interface SingleRiderQueue extends BaseQueue {
  queueType: 'SINGLE_RIDER';
  waitTime: number | null;
}

/** A free virtual queue with return times. */
export interface ReturnTimeQueue extends BaseQueue {
  queueType: 'RETURN_TIME';
  state: string | null;
  returnStart: string | null;
  returnEnd: string | null;
}

/** A paid return-time offer (e.g. Lightning Lane). */
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

/** A boarding-group virtual queue. */
export interface BoardingGroupQueue extends BaseQueue {
  queueType: 'BOARDING_GROUP';
  allocationStatus: string | null;
  currentGroupStart: number | null;
  currentGroupEnd: number | null;
  estimatedWait: number | null;
}

/** A paid standby line. */
export interface PaidStandbyQueue extends BaseQueue {
  queueType: 'PAID_STANDBY';
  waitTime: number | null;
  price: {
    amount: number;
    currency: string;
    formatted: string;
  } | null;
}

/** Any queue an attraction can carry. */
export type QueueDataItem =
  | StandbyQueue
  | SingleRiderQueue
  | ReturnTimeQueue
  | PaidReturnTimeQueue
  | BoardingGroupQueue
  | PaidStandbyQueue;

/** One external wait-time forecast entry. */
export interface ForecastItem {
  predictedTime: string;
  predictedWaitTime: number;
  confidencePercentage: number | null;
  source: string;
  trend?: TrendDirection;
}

/**
 * One entry of an attraction's `hourlyForecast` (park.fan's own ML forecast). Not the external
 * `forecasts` shape (`ForecastItem`): there is no `confidencePercentage` and no `source` here.
 */
export interface HourlyForecastItem {
  predictedTime: string;
  predictedWaitTime: number;
  /** 0–100; `null` for a slot more than 24 h out, where the model only has its floor of 50. */
  confidence: number | null;
  /** Half-width of the uncertainty band in minutes; absent or null when the model gives none. */
  uncertaintyMinutes?: number | null;
  trend: TrendDirection;
}

/** One day of a park's long-range crowd forecast. */
export interface ParkDailyPrediction {
  date: string;
  crowdLevel: CrowdLevel | 'closed';
  confidencePercentage: number;
  recommendation?: Recommendation;
  source: string;
  avgWaitTime?: number;
}

/** The park's current load against its baseline. */
export interface ParkLoad {
  crowdLevel: CrowdLevel;
  baseline: number;
  currentWaitTime: number;
  trend?: TrendDirection;
  comparisonStatus?: ComparisonStatus;
}

/** How full the park is right now compared with a typical day. */
export interface ParkOccupancy {
  current: number;
  trend: TrendDirection;
  comparedToTypical: number;
  comparisonStatus: ComparisonStatus;
  baseline90thPercentile: number;
  updatedAt: string;
  breakdown?: Record<string, unknown>;
}

/** Where a park's peak hour comes from. */
export type PeakHourSource = 'observed_today' | 'prediction' | 'historical_fallback';

/** Today's park-wide wait statistics. */
export interface ParkStatistics {
  // The three wait aggregates are `null` when a park's wait times are unknowable (no readable
  // source, or a feed silent for 30 days); `occupancy` is omitted then too.
  avgWaitTime: number | null;
  avgWaitToday: number | null;
  peakHour: string | null;
  peakHourSource: PeakHourSource | null;
  crowdLevel: CrowdLevel;
  totalAttractions: number;
  operatingAttractions: number;
  closedAttractions: number;
  timestamp: string;
  peakWaitToday: number | null;
}

/** A park's live analytics block. */
export interface ParkAnalytics {
  occupancy?: ParkOccupancy;
  statistics: ParkStatistics;
  percentiles?: Record<string, unknown>;
}

/** How accurate the model's predictions were over the last 30 days. */
export interface PredictionAccuracy {
  badge: AccuracyBadge;
  last30Days: {
    comparedPredictions: number;
    totalPredictions: number;
  };
  message: string;
}

/** How strongly rope drop is recommended. */
export type RopeDropStrength = 'high' | 'moderate';
/** How much data the rope-drop recommendation rests on. */
export type RopeDropConfidence = 'high' | 'medium' | 'low';

/** Per-day-type levels (absolute minutes, trailing window). */
export interface RopeDropDayBucket {
  /** Typical wait right after opening (minutes). */
  openWait: number;
  /** Typical daily peak wait (minutes). */
  busyPeak: number;
  /** busyPeak − openWait: minutes saved by rope-dropping. */
  savings: number;
}

/**
 * Rope-drop recommendation on tier-1 and tier-2 headliners in parks with a schedule. Present even
 * when `worth` is false, so check `worth`, not existence. Headline levels come from the busier of
 * the two day-type buckets.
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
  /** busyPeak − openWait, in minutes. */
  savings: number;
  /** Advantage window: ride within X minutes after opening. */
  rideByMinutesAfterOpen: number;
  /** Minutes after opening of the day's absolute lowest wait (often evening). */
  bestSlotMinutesAfterOpen: number;
  /** Expected wait (minutes) at that trough, the payoff for coming back later; absent on older
   *  recommendations. */
  bestSlotWait?: number | null;
  /**
   * Server verdict: better saved for late in the day than rope-dropped (the trough falls late in
   * the operating day, pre-closing line drain excluded). Absent on older recommendations.
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

/** A themed area of a park. */
export interface Land {
  name: string;
}

/**
 * A curated „this ride is being rebuilt from … to …" window, written under
 * `/admin/attractions/<id>` because no feed can tell a breakdown from a rebuild. Served beside
 * `outage`, never inside it: an outage is a fault reported now, this is planned work.
 *
 * Both days are the PARK's and inclusive, and either may stand alone. The API does not say whether
 * the window covers today (that needs the park's zone); `lib/utils/works-period.ts` does.
 */
export interface WorksPeriod {
  /** First park-local day, inclusive, or null for a window with no start. */
  from: string | null;
  /** Last park-local day, inclusive, or null while nobody knows when it ends. */
  to: string | null;
  /** Whether `to` is our estimate rather than a date the park published. */
  toUncertain: boolean;
}

/**
 * A ride that has not run yet today, and when it last did. Separate from `outage` because it claims
 * nothing about why (a cold day, a late opening, maintenance), so the page shows it neutrally,
 * never in the outage colour. Present only while the ride reads CLOSED a quarter hour into an open
 * park with no run since the last close; see `docs/frontend/not-run-today.md` in the API repo.
 */
export interface NotRunToday {
  /** ISO 8601 UTC, the end of the last run clipped to that day's close; always within seven days,
   *  so a weekday names it unambiguously. */
  lastRunAt: string;
}

/**
 * When a ride that is down right now was first reported down. `startedAt` is a clock time only;
 * the duration shown beside it is `estimate.elapsedMinutes` (operating minutes), never
 * `now - startedAt`, which overstates long outages. `outageElapsedMinutes` is the only reader.
 */
export interface AttractionOutage {
  /** ISO 8601 UTC. */
  startedAt: string;
  /**
   * Whether the transition into DOWN was seen. False: the outage was already running at the edge
   * of the seven-day window, so `startedAt` is the oldest reading and the UI names the day instead.
   */
  startObserved: boolean;
  /**
   * Which signal placed this outage, and it changes the wording. `down` is the operator's feed
   * („Störung gemeldet seit …"). `closed_gap` is INFERRED, a ride shut inside opening hours apart
   * from the rest of the park, for parks whose feed never emits DOWN; nobody reported it, so the
   * sentence may not say „gemeldet" („Steht seit … still").
   */
  signal: 'down' | 'closed_gap';
  /**
   * How long outages like this usually still take. Absent when the curve cannot answer (too early,
   * too thin, or no opening hours to count against). Absence never means nearly over.
   */
  estimate?: OutageEstimate;
}

/**
 * The measured answer to „how much longer", never a prediction: what happened to outages that got
 * this far, calibrated out of sample.
 *
 * `elapsedMinutes` is operating minutes, not wall time; never compute it from `startedAt`. Never
 * show the median without the spread: the distribution is heavy-tailed, and `remaining` is absent
 * past about two hours, so render the probability there.
 */
export interface OutageEstimate {
  /** Operating minutes elapsed, NOT `now - startedAt`. */
  elapsedMinutes: number;
  /** P(reported running again within 30 more operating minutes), 0-1. */
  recoveryWithin30: number;
  /** P(reported running again within 60 more operating minutes), 0-1. */
  recoveryWithin60: number;
  /**
   * Remaining operating minutes at the quartiles; absent past about two hours. Past that point the
   * API also drops the `p75` KEY instead of sending `null`, so read it through
   * `outageRemainingWindow`, which treats both shapes as an open range.
   */
  remaining?: { p25: number; median: number; p75?: number | null };
  /**
   * The same quartiles placed on the park's opening calendar, as instants: the only field a clock
   * time may be built from, since operating minutes cannot be added to a wall clock across a
   * closing. Absent without opening hours or calendar reach; read it through `outageRecoveryClock`.
   * `to` is absent (never `null`) when `p75` does not resolve. `from` may be a few minutes past on
   * a cached copy, which reads as „any moment now" and stays consistent with `elapsedMinutes`.
   */
  recoveryWindow?: { from: string; to?: string };
  /** Whether the park carried its own curve here. Diagnostic, not for display. */
  basis: 'park' | 'pooled';
}

/**
 * What may be said about how often a ride is reported down, or why nothing is. A discriminated
 * union, not nullable numbers: the inputs of the verdict do not travel, so no client can re-derive
 * it differently. Several withheld reasons are about OUR data, not the ride: `not_down_capable` is
 * „no source here reports outages", never „this ride never breaks".
 */
export type DowntimeBlock =
  | {
      kind: 'figures';
      windowDays: number;
      /** Reported outages, works periods excluded. */
      outages: number;
      observedDays: number;
      /** Empirical median over the outages with an observed end. */
      medianMinutes: number;
      /** How many outages that median is taken over. */
      usableDurations: number;
      longestMinutes: number;
      /** Down over (down + operating) minutes. The only denominator shown. */
      downShare: number;
    }
  | {
      kind: 'withheld';
      reason:
        | 'not_down_capable'
        /**
         * The park's feed is listed but has never once said DOWN, an observed silence rather than
         * configuration. Like `not_down_capable` it means „we cannot see this ride's outages",
         * and neither may be rendered as „no outages".
         */
        | 'park_never_reports'
        | 'artefact_regime'
        | 'no_schedule'
        /**
         * The park publishes opening hours, but none inside the measured window (a seasonal park
         * between seasons), so there is no operating time to divide by. `outages` is 0 and means
         * „no operating day", not „no outage".
         */
        | 'outside_window'
        | 'thin_events'
        | 'thin_exposure'
        | 'inhomogeneous'
        | 'recently_merged'
        | 'new_ride'
        /**
         * The figures exist but are no longer current. Reusing `thin_events` would show a real
         * count beside „too few", and zeroing it would claim „0 Störungen"; `outages` keeps the
         * real value, which this reason's copy does not use.
         */
        | 'stale_data'
        /**
         * Plenty of outages, too few seen to END: the opposite claim to `thin_events`. Strongly
         * seasonal (a run cut off by the winter closure), so it comes and goes without the ride
         * changing.
         */
        | 'heavily_censored';
      /** 0 for the reasons above that are about us, where it means „we cannot see". */
      outages: number;
      windowDays: number;
    };

/** An attraction as the park payload and the attraction detail carry it. */
export interface ParkAttraction {
  id: string;
  name: string;
  slug: string;
  url?: string; // API URL, e.g. /v1/parks/europe/germany/bruhl/phantasialand/attractions/taron
  latitude: number | null;
  longitude: number | null;
  queues?: QueueDataItem[];
  land: string | null;
  status?: AttractionStatus;
  currentLoad?: ParkLoad | null;
  crowdLevel?: CrowdLevel;
  /**
   * The wait `crowdLevel` was rated against, in minutes: the ride's P50 (P90 for a ride too new to
   * have one). Turns the badge's word back into minutes (see `rideCrowdMinuteRanges`). Present only
   * while the ride is rated: operating, with a live wait, in a ratable park.
   */
  baseline?: number | null;
  trend?: TrendDirection;
  statistics?: AttractionStatistics;
  history?: AttractionHistoryDay[];
  isHeadliner?: boolean;
  isSeasonal?: boolean;
  seasonMonths?: number[] | null;
  isCurrentlyInSeason?: boolean | null;
  /**
   * The running outage, present only while the ride reads DOWN. Absent is not „running": it is also
   * every park whose sources cannot report outages and every ride in a works period. Never render a
   * „no outages" state.
   */
  outage?: AttractionOutage;
  /**
   * The ride reads CLOSED in an open park and has not run since the park last closed, with when it
   * last did. The poll sends `null` for every other ride (see `LiveAttractionSnapshot.outage`).
   */
  notRunToday?: NotRunToday | null;
  /**
   * The curated rebuild window, absent for nearly every ride. Day-stable, so it rides the server
   * render and not the poll; it says nothing about today on its own (see {@link WorksPeriod}).
   */
  worksPeriod?: WorksPeriod | null;
  /**
   * Reported-outage figures, or the reason there are none. Attraction detail response only: the
   * park page renders none of it, so the park list and the poll do not carry it.
   */
  downtime?: DowntimeBlock;
  /** Minimum rider height in cm. Null/absent = unrestricted or unknown. */
  minimumHeight?: number | null;
  /** Maximum rider height in cm (kiddie rides). */
  maximumHeight?: number | null;
  /** Whether riders may get wet. Null/absent = unknown, not „dry". */
  mayGetWet?: boolean | null;
  /** RCDB (rcdb.com) database id → https://rcdb.com/{id}.htm */
  rcdbId?: number | null;
  /**
   * Whether the ride has a single-rider line at all: a static fact, not whether it is open now
   * (the live `queues` say that). Null/absent means unknown, never „no".
   */
  hasSingleRider?: boolean | null;
  /**
   * What this attraction is for: a ride, a transport system, a show or a walkthrough, curated per
   * attraction. Null or absent means nobody has judged it, never „it is a ride"; render nothing.
   */
  attractionKind?: AttractionKind | null;
  /**
   * Indoor, outdoor or outdoor with a roofed queue (see {@link IndoorOutdoor}). Curated and
   * day-stable, so it rides the server render, not the poll. Null or absent means unchecked,
   * never „outdoor".
   */
  indoorOutdoor?: IndoorOutdoor | null;
  /**
   * Whether the ride runs a virtual queue (return times or boarding groups) at all: curated, not
   * today's reading (the live `queues` entries say that). Null or absent means unknown, never „no".
   */
  hasVirtualLine?: boolean | null;
  /** Curated queue-jump product. Absent is not „there is none"; see `FastPass`. */
  fastPass?: FastPass | null;
  bestVisitTimes?: BestVisitSlot[] | null;
  /** Only set for tier1/tier2 headliners in parks with a schedule. */
  ropeDrop?: RopeDropInfo | null;
  /** Precomputed P50/P90 peak-wait stats, present for displayable headliners. */
  typicalWaits?: TypicalWaits | null;
  // Only on the attraction detail page, merged from a dedicated endpoint.
  hourlyForecast?: HourlyForecastItem[];
  predictionAccuracy?: PredictionAccuracy | null;
  /** Curated ride profile (track figures, ride type, builder); see `RideProfile`. */
  rideProfile?: RideProfile | null;
}

/** One showtime with its type. */
export interface ShowtimeEntry {
  type: string;
  startTime: string;
}

/** A show in the park payload. */
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

/** A restaurant in the park payload. */
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

/** Identity and location fields every park shape shares. */
export interface ParkBase {
  id: string;
  name: string;
  /**
   * The German article the park's name takes (`der`, `die`, `das`), or absent for none. German copy
   * needs it („im Phantasialand", „in der Movie World", „in Toverland"): pass it through
   * `parkArgs()` and use `{inPark}` / `{forPark}` rather than writing the preposition.
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

/** A park with its live status, weather, analytics and schedule. */
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
 * How settled a season is: „the park published these dates" differs from „it did this last year
 * and has announced nothing" for anyone planning around it.
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
 * The park facts a human wrote, from the API's `info` block. Every field is optional twice over:
 * the API strips nulls, and the object is absent until something is curated. Detail payload only.
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

/** A park with its attractions, shows, restaurants and schedule: the park page's payload. */
export interface ParkWithAttractions extends ParkBase {
  status?: ParkStatus;
  /** Curated facts no feed carries. Day-stable, so the live merge keeps it. */
  info?: ParkInfo | null;
  currentLoad?: ParkLoad | null;
  weather?: WeatherData;
  attractions: ParkAttraction[];
  /**
   * The park's rides that closed for good, newest first; never part of `attractions`, so nothing
   * that counts, filters or plans today sees them. A ride an editor hid is left out.
   * See docs/rules/a-closed-ride-keeps-its-page.md.
   */
  closedAttractions?: ClosedAttraction[];
  /** Headliners worth rope-dropping (worth=true), sorted by minutes saved. */
  ropeDropHeadliners?: RopeDropHeadliner[];
  shows?: ParkShow[];
  restaurants?: ParkRestaurant[];
  analytics?: ParkAnalytics | null;
  schedule?: ScheduleItem[];
  nextSchedule?: NextScheduleItem | null;
  hasOperatingSchedule: boolean;
  /**
   * Day-stable like `liveWaitTimes`, so it rides the server render and never the live poll.
   */
  scheduleCoverage?: ScheduleCoverage;
  /** Day-stable, so it rides on the server render and the live merge carries it. */
  liveWaitTimes?: LiveWaitTimes;
}

/**
 * Lean live snapshot from `GET /v1/parks/{geo}/{park}/wait-times`: the park's status plus every
 * attraction's current queues and nothing else, small enough to be a batch live source for
 * surfaces that only need „open or closed, and how long" (the blog's inline ride references).
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

/**
 * Typical-vs-busy peak waits from the distribution of daily peak waits over a year: `typical` is
 * the P50 (a normal day's peak), `busy` the P90, in whole minutes, null without data.
 */
export interface TypicalWaitBucket {
  typical: number | null;
  busy: number | null;
  sampleDays: number;
}

/** Peak waits for one weekday. */
export interface DayOfWeekWait extends TypicalWaitBucket {
  /** 0=Sunday … 6=Saturday. */
  dayOfWeek: number;
  isWeekend: boolean;
}

/** A ride's typical and busy peak waits, by day type and weekday. */
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

/** The attraction detail response. */
export interface AttractionResponse {
  id: string;
  name: string;
  slug: string;
  status?: AttractionStatus;
  land: Land | null;
  queues?: QueueDataItem[];
  currentLoad?: ParkLoad | null;
  hourlyForecast?: HourlyForecastItem[];
  forecasts?: ForecastItem[];
  latitude: number | null;
  longitude: number | null;
  /**
   * Parent park block, with `timezone` and the park's live `status`, so a ride page can render
   * from this response alone (see `useLiveAttractionData`).
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
    /** Whether this park's wait times are readable; see {@link LiveWaitTimes}. */
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
  /** Whether riders may get wet. Null/absent = unknown, not „dry". */
  mayGetWet?: boolean | null;
  /** RCDB (rcdb.com) database id → https://rcdb.com/{id}.htm */
  rcdbId?: number | null;
  /**
   * Whether the ride has a single-rider line at all: a static fact, not whether it is open now
   * (the live `queues` say that). Null/absent means unknown, never „no".
   */
  hasSingleRider?: boolean | null;
  /**
   * What this attraction is for: a ride, a transport system, a show or a walkthrough, curated per
   * attraction. Null or absent means nobody has judged it, never „it is a ride"; render nothing.
   */
  attractionKind?: AttractionKind | null;
  /**
   * Indoor, outdoor or outdoor with a roofed queue (see {@link IndoorOutdoor}). Curated and
   * day-stable, so it rides the server render, not the poll. Null or absent means unchecked,
   * never „outdoor".
   */
  indoorOutdoor?: IndoorOutdoor | null;
  /**
   * Whether the ride runs a virtual queue (return times or boarding groups) at all: curated, not
   * today's reading (the live `queues` entries say that). Null or absent means unknown, never „no".
   */
  hasVirtualLine?: boolean | null;
  /** Curated queue-jump product. Absent is not „there is none"; see `FastPass`. */
  fastPass?: FastPass | null;
  bestVisitTimes?: BestVisitSlot[] | null;
  /** Only set for tier1/tier2 headliners in parks with a schedule. */
  ropeDrop?: RopeDropInfo | null;
  /** Typical (P50) vs busy (P90) peak-wait stats; render when `displayable`. */
  typicalWaits?: TypicalWaits | null;
  /** Curated ride profile (track figures, ride type, builder); see `RideProfile`. */
  rideProfile?: RideProfile | null;
  /**
   * How often this ride has been reported down, or the reason nothing is said. Absent while the
   * reconstruction has never run; present-and-withheld carries the reason.
   */
  downtime?: DowntimeBlock;
  /**
   * The outage running right now. `useLiveAttractionData` overlays exactly the fields this type
   * names, so it must be declared, or the ride page reads it off the day-cached shell.
   */
  outage?: AttractionOutage;
  /** Same field as on the park's ride list, overlaid by `useLiveAttractionData`. */
  notRunToday?: NotRunToday | null;
  /**
   * When the ride stopped operating for good (ISO 8601), or absent while it runs. Only this
   * endpoint carries a retired ride, so a ride page missing from the park payload asks here before
   * answering 404. Read it with {@link retiredKind}: a row can be retired without anything closing.
   */
  retiredAt?: string | null;
  /**
   * Why it was retired and on whose authority: free English text, often just a source URL. Never
   * shown as it stands; see `lib/parks/closed-ride.ts` for what is read out of it.
   */
  retiredReason?: string | null;
  /**
   * `closed`: the ride stopped for good, and its page says so. `reclassified`: the source now lists
   * it as a show or restaurant, so nothing closed and the ride page stays a 404. Absent while not
   * retired.
   */
  retiredKind?: RetiredKind | null;
}

/** A ride of the park that closed for good, as the park payload lists it. */
export interface ClosedAttraction {
  id: string;
  name: string;
  slug: string;
  land?: string | null;
  /** The day it closed (ISO 8601, midnight UTC of that day). */
  retiredAt: string;
}

/** Which of the two retirements `retiredAt` is; see {@link AttractionResponse.retiredKind}. */
export type RetiredKind = 'closed' | 'reclassified';

/**
 * The paid (or free) queue-jump product a ride sells, hand-curated from park apps and ticket pages.
 * The API sends the parts and this app composes them, because „12 €" and „€12" differ by locale.
 *
 * An absent `fastPass` is not „no fast pass": it also covers „nobody has checked", which is most
 * of the catalogue. Badge what is there; render nothing for what is not.
 */
export interface FastPass {
  /** The park's brand, the ride's override, or the neutral "Fast Pass". */
  name: string;
  /**
   * What it costs, in `currency`. `0` means free (e.g. Europa-Park's Virtual Line); `null` means
   * unknown, including per-day pricing. Test `price != null`, never `if (price)`.
   */
  price?: number | null;
  /**
   * What the park's cheapest version costs, for parks that sell one pass per visit (nearly all);
   * render as „ab 25 €". Null whenever `price` is set, since showing both says one is wrong.
   */
  priceFrom?: number | null;
  /** ISO-4217, for `Intl.NumberFormat`. Null when there is no price to denominate. */
  currency?: string | null;
  /** Glossary term id explaining the product kind, e.g. `quick-pass`. */
  termId?: string | null;
}

/**
 * The curated „what kind of ride is this, and what does it do" record. Every id is a glossary term
 * id (`lib/glossary/data.ts`); this app resolves each to a localized name and link and silently
 * drops unknown ids, so the API can be seeded ahead of a term.
 * See docs/rules/ride-and-glossary-link.md.
 */
export interface RideProfile {
  /**
   * Track figures **in ride order**; repeats are meaningful (two corkscrews in a row list
   * `corkscrew` twice). Empty for rides without track figures.
   */
  elements: string[];
  /** Ride-type terms (`coasters` / `attractions` categories). Unordered. */
  types: string[];
  // Everything below is optional as well as nullable: the API strips null-valued keys, so an
  // unknown value arrives as a missing key. Guard with `!= null`, never `!== null`.
  /** Builder's display name. */
  manufacturer?: string | null;
  /** Builder's glossary term id; absent means render the name without a link. */
  manufacturerTermId?: string | null;
  /** The builder's own model name, e.g. "Blitz Coaster". */
  model?: string | null;
  openedYear?: number | null;
  /** As the park publishes it; may legitimately differ from `elements`. */
  inversions?: number | null;
  /** Measurements; null when we hold none, and every field inside is independently nullable. */
  stats?: RideStats | null;
}

/**
 * A ride's measurements, always metric; the display unit is the visitor's
 * (`lib/utils/temperature.ts`). Merged per field from the curated seed and the Wikidata (CC0)
 * import, curated winning, and listed as soon as one number is known.
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
  /** Which side of the merge the values came from; provenance only. For the credit line read
   *  {@link RideStats.attribution}. */
  source: 'curated' | 'wikidata' | 'mixed';
  /** Wikidata entity id; `attribution.url` already points at it. */
  sourceId?: string | null;
  /**
   * Who to credit, resolved by the API; null exactly when every value is hand-curated. Render it
   * when present; never rebuild the rule from `source`/`sourceId`, which credits the wrong source.
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
  /** Optional as well as nullable: the API strips null-valued keys. */
  openedYear?: number | null;
  /**
   * Typical peak wait in minutes (the API's P90 over a long window, not a live reading). Missing
   * when the ride has no baseline; check `!= null` and never fall back to 0, which would read as
   * „never has a queue".
   */
  typicalPeakWait?: number | null;
  /** Whether the API classes this ride as one of its park's headliners. */
  isHeadliner?: boolean;
}

/** One day of an attraction's history: its utilization and hourly P90 waits. */
export interface AttractionHistoryDay {
  date: string;
  utilization: CrowdLevel;
  hourlyP90: Array<{
    hour: string;
    value: number;
  }>;
}

/** Today's wait statistics for one attraction. */
export interface AttractionStatistics {
  avgWaitToday: number | null;
  minWaitToday: number | null;
  maxWaitToday: number | null;
  peakWaitToday: number | null;
  peakWaitTimestamp: string | null;
  /** Sparkline series. Stripped from the ISR shell snapshot and re-supplied by the live poll;
   *  present on live and detail responses. */
  history?: {
    timestamp: string;
    waitTime: number;
  }[];
}

/** A show as its detail endpoint returns it. */
export interface ShowResponse {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  park?: { id: string; name: string; slug: string } | null;
}

/** A show with today's status and showtimes. */
export interface ShowWithLiveData extends ShowResponse {
  status: string;
  showtimes: string[] | null;
  operatingHours: string[] | null;
  lastUpdated: string;
}

/** A restaurant as its detail endpoint returns it. */
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

/** One hit of `/v1/search`. */
export interface SearchResultItem {
  type: 'park' | 'attraction' | 'show' | 'restaurant' | 'location' | 'glossary';
  id: string; // "city:slug" or "country:slug" for locations
  name: string;
  slug: string;
  url?: string;
  latitude?: number;
  longitude?: number;
  // Location fields, filled for every type where they apply.
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
   * Thumbnail path, resolved by the `/api/search` proxy from the media database, not by the
   * backend (see `lib/utils/search-assets.ts`).
   */
  imageUrl?: string;
  /** The thumbnail's focal point as a CSS `object-position`, from the same sidecar. */
  imagePosition?: string;
}

/** The `/v1/search` answer. */
export interface SearchResult {
  query: string;
  results: SearchResultItem[];
  counts: Record<string, { returned: number; total: number }>;
}

/** A park in the discovery tree, with live status for cards. */
export interface ParkReference {
  id: string;
  name: string;
  slug: string;
  country: string;
  /** Park position, null when the backend could not geocode it; feeds the hub cards' „X km away"
   *  line without a per-park lookup. */
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
   * Whether this park's wait times are readable (see {@link LiveWaitTimes}). The `/api/parks/live`
   * projection drops the wait-derived `analytics` when they are not, so the flag never reaches the
   * client.
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

/** A city in the discovery tree. */
export interface City {
  name: string;
  slug: string;
  parks: ParkReference[];
  parkCount: number;
  openParkCount: number;
}

/** A country in the discovery tree. */
export interface Country {
  name: string;
  slug: string;
  code: string;
  cities: City[];
  cityCount: number;
  parkCount: number;
  openParkCount: number;
}

/** A continent in the discovery tree. */
export interface Continent {
  name: string;
  slug: string;
  countries: Country[];
  countryCount: number;
  parkCount: number;
  openParkCount: number;
}

/** One attraction URL for the sitemap. */
export interface SitemapAttraction {
  url: string;
  slug: string;
}

/** The whole geographic tree (`/v1/discovery/geo`). */
export interface GeoStructure {
  continents: Continent[];
  continentCount: number;
  countryCount: number;
  cityCount: number;
  parkCount: number;
  attractionCount: number;
  generatedAt: string;
}

/** Site-wide live counts. */
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

/** A park in the global stats (most or least crowded). */
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

/** A ride in the global stats (longest or shortest wait). */
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

/** The global real-time statistics (`/v1/analytics/realtime`). */
export interface GlobalStats {
  counts: GlobalCounts;
  mostCrowdedPark: ParkStatsItem | null;
  leastCrowdedPark: ParkStatsItem | null;
  longestWaitRide: AttractionStatsItem | null;
  shortestWaitRide: AttractionStatsItem | null;
}

/** One entry of the live ticker. */
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

/** The ticker endpoint's answer. */
export interface TickerResponse {
  items: TickerItem[];
  generatedAt: string;
}

/** Open-park counts per continent and country (`/v1/analytics/geo-live`). */
export interface GeoLiveStatsDto {
  continents: ContinentLiveStats[];
}

/** Open-park counts for one continent. */
export interface ContinentLiveStats {
  slug: string;
  openParkCount: number;
  countries: CountryLiveStats[];
}

/** Open-park count for one country. */
export interface CountryLiveStats {
  slug: string;
  openParkCount: number;
}

/** One public or school holiday. */
export interface HolidayItem {
  date: string;
  name: string;
  localName: string | null;
  country: string;
  region: string | null;
  holidayType: HolidayType;
  isNationwide: boolean;
}

/** A list of holidays. */
export interface HolidayResponse {
  holidays: HolidayItem[];
}

/** A holiday in a neighbouring region that influences the park's crowds. */
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
  /**
   * Half-width of the model's uncertainty band in minutes, the „± n Min." the trip planner prints.
   * `null`/absent means no spread was reported, never zero. Never subtract it from `waitTime`
   * (rounded and floored on the way out, so the result can go negative); print it on its own.
   * Absent on an `actual` day, since a measurement has no spread.
   */
  uncertaintyMinutes?: number | null;
}

/** Expected headliner waits for a calendar day, grounding the crowd level in numbers. Present on
 *  days with predictions (today and later), absent on completed or closed days. */
export interface HeadlinerForecast {
  /** Average wait across the park's headliners (minutes, rounded to 5). */
  avgWait: number;
  /** Top headliner rides for this day, sorted by wait desc (minutes, rounded to 5). */
  rides: HeadlinerWaitForecast[];
  /** true: actual recorded averages for a PAST day; false/absent: forecast. */
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
  /** Influence rank: 1 = the nearest, most important region. */
  priority: number;
}

/** A city in a discovery listing. */
export interface DiscoveryCity {
  name: string;
  slug: string;
  parks: ParkReference[];
  parkCount: number;
}

/** A country in a discovery listing. */
export interface DiscoveryCountry {
  name: string;
  slug: string;
  cities: DiscoveryCity[];
  cityCount: number;
  parkCount: number;
}

/** The countries of a continent, with breadcrumbs. */
export interface DiscoveryCountryResponse {
  data: DiscoveryCountry[]; // 'data', not 'countries'
  breadcrumbs: Breadcrumb[];
}

/** The cities of a country, with breadcrumbs. */
export interface DiscoveryCityResponse {
  data: DiscoveryCity[]; // 'data', not 'cities'
  breadcrumbs: Breadcrumb[];
}

/**
 * Everything a ParkCard overlays on its prerendered shell, i.e. every field that changes during
 * the day: the `/api/parks/live` response, keyed by park id. Keep it a projection, since each
 * field is re-downloaded for every park in the region on every poll.
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

/** Health of the model's drift. */
export type DriftStatus = 'healthy' | 'warning' | 'critical';

/** The ML dashboard (`/v1/ml/dashboard`). */
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
    /** Served intraday accuracy (PCN champion-swap): what users get for 15-min slots, where
     *  `live`/`byPredictionType.HOURLY` measure the CatBoost fallback. null when PCN is not
     *  serving. */
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

/** One trained model version with its error metrics. */
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

/** The model metrics history (`/v1/ml/models/metrics-history`). */
export interface ModelMetricsHistoryResponse {
  history: ModelMetricsSnapshot[];
  total: number;
}

/** The API's health check. */
export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  services: Record<string, unknown>;
  data: Record<string, unknown>;
}

/** What a calendar event carries. */
export interface CalendarEventData {
  type: 'schedule' | 'weather' | 'holiday' | 'crowd' | 'recommendation' | 'special_event' | 'show';
  icon?: string;
  // Older shape:
  data?: ScheduleItem | WeatherDay | HolidayItem | ParkDailyPrediction;
  timezone?: string;
  details?: string;
  // Integrated calendar shape:
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

/** An event placed on the calendar. */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: CalendarEventData;
}

/**
 * How far a park's published schedule reaches: MIN and MAX of its park-level OPERATING rows. Both
 * ends are `null` for a park with none, and the field is absent on older cached payloads, so read
 * it optionally. Past `to` the API infers a status (all `CLOSED`, or `UNKNOWN` with a constant
 * fallback), and neither is a page worth publishing.
 */
export interface ScheduleCoverage {
  /** `YYYY-MM-DD` in park timezone, or null when the park publishes no schedule at all. */
  from: string | null;
  /** `YYYY-MM-DD` in park timezone, or null: the last date the API actually knows about. */
  to: string | null;
}

/** The calendar response's park metadata. */
export interface CalendarMeta {
  slug: string;
  timezone: string;
  hasOperatingSchedule: boolean;
  /** Absent on a response cached before this field shipped; read it optionally. */
  scheduleCoverage?: ScheduleCoverage;
}

/** A calendar day's opening hours. */
export interface OperatingHours {
  openingTime: string;
  closingTime: string;
  type: 'OPERATING' | 'CLOSED';
  isInferred: boolean;
}

/** A calendar day's weather. */
export interface WeatherSummary {
  condition: string;
  icon: number;
  tempMin: number;
  tempMax: number;
  /** Total precipitation for the day in mm, despite the name; NOT a percentage. */
  rainChance: number;
  /** Total precipitation for the day, in mm. */
  precipitationMm?: number;
  /** Total snowfall for the day, in cm. */
  snowMm?: number;
  /** Maximum wind speed for the day, in km/h. */
  windMax?: number;
  /** Relative humidity (%), when available (today). */
  humidity?: number;
  /** Apparent („feels like") temperature, when available (today). */
  apparentTemp?: number;
}

/** A named event or holiday on a calendar day. */
export interface CalendarEventItem {
  name: string;
  type: string;
  isNationwide?: boolean;
}

/**
 * One bar of a day's hour-by-hour crowd curve. Only today and tomorrow carry these, whatever
 * `includeHourly` asks for.
 */
export interface HourlyPrediction {
  /**
   * Hour of day in **UTC**, 0–23: not the park's local hour and not the reader's. Printed as a
   * clock time it would show UTC on a park-local calendar, so convert first with
   * `hourlyPredictionInstants` (`lib/utils/calendar-utils.ts`) and render in park time.
   */
  hour: number;
  crowdLevel: CrowdLevel;
  predictedWaitTime: number;
  probability?: number;
}

/** A calendar day's ticket price and availability. */
export interface TicketInfo {
  price?: { amount: number; currency: string };
  tier?: 'budget' | 'standard' | 'peak';
  status?: 'available' | 'sold_out';
}

/** A show on a calendar day. */
export interface ShowTime {
  name: string;
  time: string;
  endTime?: string;
}

/** One day of the integrated calendar. */
export interface CalendarDay {
  date: string;
  status: ParkStatus;
  isToday: boolean;
  /** Declared by the API but never sent. Derive the day after `isToday` from the park's timezone
   *  instead of gating anything on this. */
  isTomorrow?: boolean;
  isEstimated?: boolean;
  hours?: OperatingHours;
  crowdLevel: CrowdLevel | 'closed';
  /** The model's forward prediction for this day (predicted peak ÷ typical-day peak). Equals
   *  `crowdLevel` from today on; its own field because a past day's `crowdLevel` is a measurement
   *  and this stays a prediction. Absent on older API builds and on days with no ratable
   *  prediction. */
  predictedCrowdLevel?: CrowdLevel;
  /** TODAY ONLY: how today has gone so far, on the same scale as `crowdLevel`'s forecast, which
   *  is what makes „heute bisher / Prognose" meaningful. Absent before enough samples, on unratable
   *  parks, on closed days and on every other day. */
  todayCrowdLevel?: CrowdLevel;
  /** How many observations {@link todayCrowdLevel} was rated from, so a surface can hide a thin
   *  morning reading. */
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
  /** Expected headliner waits (average and top rides), turning the crowd level into this park's
   *  numbers. Today and future days only. */
  headlinerForecast?: HeadlinerForecast;
  /** Priority-ranked holidays in neighbouring regions that raise local crowds; a distinct
   *  calendar-cell marker. */
  neighborHolidays?: NeighborHoliday[];
  hourly?: HourlyPrediction[];
  refurbishments?: string[];
  ticket?: TicketInfo;
  recommendation?: string;
  advisoryKeys?: string[];
  showTimes?: ShowTime[];
}

/** The integrated calendar response (`/calendar`). */
export interface IntegratedCalendarResponse {
  meta: CalendarMeta;
  days: CalendarDay[];
}

/** One month of a park's historical aggregate (`/stats`). */
export interface MonthStat {
  month: number; // 1–12
  avgCrowdScore: number;
  avgCrowdLevel: CrowdLevel;
  avgWaitP50: number;
  avgWaitP90: number;
  sampleDays: number;
}

/** One weekday of a park's historical aggregate. */
export interface DayOfWeekStat {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  avgCrowdScore: number;
  avgCrowdLevel: CrowdLevel;
  avgWaitP50: number;
  avgWaitP90: number;
  sampleDays: number;
}

/** One ride in a park's historical ranking. */
export interface TopAttractionStat {
  attractionSlug: string;
  attractionName: string;
  avgWaitP50: number;
  avgWaitP90: number;
  sampleDays: number;
  rank: number;
  /**
   * The land the ride stands in, curated value winning. Optional and nullable (the API strips
   * nulls, and some parks publish no lands), so render the column only when a row carries one.
   */
  land?: string | null;
  /**
   * Coarse ride type („Roller Coaster"), curated value winning: the free-text `attraction_type`,
   * NOT the ride-type glossary terms in `rideProfile`, which answer a different question.
   */
  attractionType?: string | null;
}

/** A park's historical crowd and wait aggregate (`GET /v1/parks/.../stats`). */
export interface ParkHistoricalStats {
  byMonth: MonthStat[];
  byDayOfWeek: DayOfWeekStat[];
  topAttractions: TopAttractionStat[];
  meta: {
    totalSampleDays: number;
    windowYears: number;
    displayable: boolean;
    /**
     * Measured days a ride needed to enter `topAttractions`; absent on older cached responses.
     * Not rendered, only there to tell a filtered ranking from an unfiltered one.
     */
    minAttractionDays?: number;
  };
}

/** One ride's hourly wait profile (`GET /v1/parks/.../stats/hourly`). */
export interface HourlyProfileAttraction {
  attractionSlug: string;
  attractionName: string;
  land?: string | null;
  /**
   * Quiet-hour wait (P25), aligned with `hours` like {@link p50}. Optional because older
   * deployments send none; readers treat an absent array as „no spread" and draw the median only.
   */
  p25?: Array<number | null>;
  /**
   * Median wait per hour, POSITIONAL: `p50[i]` belongs to `hours[i]`, never to `i` o'clock.
   * `null` is a gap (nothing reported that hour), not a zero, which would say the queue was empty.
   */
  p50: Array<number | null>;
  /** Busy-hour wait (P90), aligned with `hours` the same way. */
  p90: Array<number | null>;
  /** The hour in `hours` where this ride's own median peaks. */
  peakHour: number | null;
  sampleDays: number;
}

/**
 * One ride's day: what it normally does, what it has done so far today, and what the model expects
 * for the rest. Everything is POSITIONAL against `hours`, and `today` and `forecast` never overlap,
 * so a chart cannot draw a guess over a fact. See docs/frontend/ride-day-curve.md in the API repo.
 */
export interface RideDayCurve {
  hours: number[];
  attractionSlug: string;
  attractionName: string;
  p25: Array<number | null>;
  p50: Array<number | null>;
  p90: Array<number | null>;
  /** Measured today; `null` for an hour not yet reached or one the ride reported nothing in. */
  today: Array<number | null>;
  /** Expected, for hours not yet measured. */
  forecast: Array<number | null>;
  /**
   * What the model said for each hour BEFORE it happened. Optional: older APIs send none, and the
   * chart then draws no comparison line.
   */
  predicted?: Array<number | null>;
  /**
   * The ride's own mean absolute error in minutes, or `null` when unscored. Draw the forecast as
   * `± forecastError`, but never fan it out with the horizon: measured error grows by roughly the
   * same few minutes across the horizon for every band, so a multiplier is wrong at both ends.
   * Where the horizon matters, read `/plan/day`'s `rides[].expectedError` and `accuracy`.
   */
  forecastError: number | null;
  /** False for a park not open yet, a closed ride or an out-of-season ride. */
  measuredToday: boolean;
  sampleDays: number;
  timezone: string;
  generatedAt: string;
  schemaVersion: number;
}

/**
 * The park's day shape, ride by ride: the matrix behind a „when is the queue longest" table. A lean
 * projection, far smaller than slicing the attraction detail endpoint per ride.
 * See docs/architecture/api-budget.md.
 */
export interface ParkHourlyProfile {
  /**
   * Hours the table has columns for, park-local and ascending, derived from the data: a park that
   * opens at 11 starts at 11, so never assume a fixed window.
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

/** A park near a point, from `/v1/discovery/nearby`. */
export interface NearbyParkItem {
  id: string;
  name: string;
  slug: string;
  distance: number;
  city: string | null;
  country: string | null;
  status: string;
  totalAttractions: number;
  /** Absent for a park whose wait times are unreadable; see {@link LiveWaitTimes}. */
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

/** A top park in a country summary. */
export interface TopParkSummary {
  name: string;
  slug: string;
  city: string;
  path: string;
  avgAnnualCrowdScore: number;
}

/** A country's summary (`GET /v1/discovery/continents/:continent/:country/summary`). */
export interface CountrySummary {
  countrySlug: string;
  parkCount: number;
  cityCount: number;
  topParks: TopParkSummary[];
  avgPeakMonths: number[];
  avgQuietMonths: number[];
}

/** A park ranked by tracked request volume (`GET /v1/parks/popular`), the cache-prewarm signal. */
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

/**
 * How a plan curve was produced; it travels with every curve because the kinds are not equally
 * trustworthy and a rendered bar does not say which it is. `observed` points backwards: a past date
 * answered from what the queues did. `measured` is the model's hourly prediction (today and
 * tomorrow). `composed` scales a day-level prediction by the ride's historical hour shape, and
 * `long_range` is the same past the 60-day daily horizon. A surface MUST draw them differently.
 */
export type PlanDayTier = 'observed' | 'measured' | 'composed' | 'long_range';

/** One hour of a ride's planned day. */
export interface PlanDayHour {
  /** Park-local hour, 0–23. */
  hour: number;
  /** Expected wait in minutes, already rounded to 5. */
  wait: number;
  /**
   * Set only where THIS hour did not come from the day's {@link PlanDay.tier}: a day inside the
   * 24-hour window is part measured, part composed. Absent means „the day's tier", never „unknown".
   */
  source?: PlanDayTier | null;
}

/** One ride's planned day: an expected wait per open hour, with its uncertainty. */
export interface PlanDayRide {
  attractionSlug: string;
  attractionName: string;
  land?: string | null;
  /** One entry per open hour. */
  hours: PlanDayHour[];
  /** The day-level prediction this ride's curve was scaled to. */
  dayPeak: number;
  /**
   * Half-width of the model's uncertainty band in minutes (its top trained quantile minus the
   * served median). `null` means no spread was reported, NOT a band of width zero.
   */
  uncertaintyMinutes?: number | null;
  /**
   * When THIS ride starts, park-local `HH:mm`, rounded to the quarter hour (a raw 10:10 is polling
   * plus feed lag on a 10:00 opening). Many rides open later than their park. `hours` already
   * begins here, so this is only for saying it; absent means it opens with the park or too few
   * openings were seen. There is no `closesAt`: feeds do not reliably flip back to CLOSED.
   */
  opensAt?: string | null;
  /**
   * How many days of watching `opensAt` rests on: `high` from 40, `medium` from 20, `low` below.
   * Present exactly when `opensAt` is. A grade of the time, never an interval to derive minutes
   * from.
   */
  opensAtConfidence?: 'high' | 'medium' | 'low';
  /** Measured days behind the historical shape. */
  sampleDays: number;
  /**
   * The typical error of this ride's numbers, in minutes; it depends on lead time and level. A
   * TYPICAL error, not a bound (half the days are further off), so never draw it as an interval
   * that contains the answer. Absent where the backend has not measured one.
   */
  expectedError?: number | null;
  /**
   * Where the ride is, so the planner can say how far apart two entries are without fetching every
   * attraction. A straight-line distance is only a LOWER BOUND on the walk; never present it as a
   * walking time.
   */
  latitude?: number | null;
  longitude?: number | null;
  /**
   * The ride's photo, added by the proxy route from this repo's media database. Carries the
   * content hash as a query, because retargeting a focal point rewrites a crop at an unchanged URL.
   */
  backgroundImage?: string | null;
  /** `object-position` from the image's curated focal point. */
  backgroundPosition?: string;
  /**
   * Observed all through the previous operating day and never OPERATING: down for the day, not
   * unobserved. Absent past tomorrow, where yesterday's downtime says nothing actionable.
   */
  downYesterday?: boolean;

  /**
   * Whether the park counts this ride among its headliners: the API's curated answer, never
   * re-derived from `dayPeak`, which would recommend the queue rather than the ride.
   */
  isHeadliner?: boolean;
  /**
   * Minimum rider height in cm, curated over synced, so the planner can answer „can the
   * six-year-old ride this" for the whole day. Absent covers both „not recorded" and „none", so it
   * is never a promise that anyone may ride (see `canRideAtHeight`).
   */
  minimumHeight?: number | null;
  /** Whether the ride may soak you. Absent is unknown, never „dry". */
  mayGetWet?: boolean | null;
}

/** The day and park around a plan: hours, crowd, weather, holidays, early entry. */
export interface PlanDayContext {
  date: string;
  status: ParkStatus | string;
  /** First and last park-local hour the park is open. `null` on a closed day. */
  openHour: number | null;
  closeHour: number | null;
  /**
   * Where {@link openHour}/{@link closeHour} came from: `schedule` is the published calendar,
   * `observed` a window derived from measured hours past the publication horizon, narrower than
   * the truth by construction. On an `observed` day `status` is no promise either.
   */
  hoursSource?: 'schedule' | 'observed' | null;
  crowdLevel?: CrowdLevel | 'closed' | null;
  /**
   * Absent past the forecast's reach (about two weeks). There is no climate-normal fallback, so a
   * missing value must not read as „no rain expected".
   */
  weather?: WeatherSummary | null;
  isHoliday: boolean;
  isBridgeDay: boolean;
  isSchoolVacation: boolean;
  /** Derived by the API; `CalendarDay` carries no such field. */
  isWeekend: boolean;
  neighborHolidays?: NeighborHoliday[];
  /**
   * Whether this park's wait times are readable at all, repeated here because the planner never
   * fetches the park payload; without it, a park with no source looks like rides without history.
   * Read it through `noLiveWaitTimesReason()`. See docs/rules/parks-we-cannot-read.md.
   */
  liveWaitTimes?: LiveWaitTimes;
  /**
   * Present only where a human confirmed that the park lets hotel guests in before opening; absent
   * means „no" and „unchecked" alike, so test `=== true`. It covers the park's headliners.
   */
  hasEarlyEntry?: true;
  /** Minutes before `openHour` the early-entry rides open now; only with `hasEarlyEntry`. */
  earlyEntryMinutesPeak?: number;
  /** The park's second value, for its quieter weeks. Only with `hasEarlyEntry`. */
  earlyEntryMinutesOffPeak?: number;
  /**
   * Whether the VISITOR holds early entry on this day. Never sent by the API: the planner sets it
   * from the visitor's answer through `withEarlyEntry()` (`lib/planner/day-grid.ts`). Absent reads
   * as `false`. Read it only through `earlyEntryOpenMin()`, which also checks
   * {@link hasEarlyEntry}.
   */
  earlyEntry?: boolean;
}

/** The trip planner's day for one park (`/plan/day`). See docs/features/trip-planner.md. */
export interface PlanDay {
  parkSlug: string;
  timezone: string;
  context: PlanDayContext;
  tier: PlanDayTier;
  /** Whole days from today to this date, in the park's timezone. */
  leadDays: number;
  /**
   * Measured mean absolute error for predictions this far ahead, in minutes. `null` until enough
   * scored rows exist at this distance; then widen the band with distance WITHOUT a figure.
   * `accuracy.typicalError` and `rides[].expectedError` carry distance-dependent errors of their
   * own.
   */
  leadTimeMae?: number | null;
  /**
   * Whether anybody has checked how wrong the forecast is at this distance: `measured` means
   * compared against days that then happened, `unmeasured` means never verified, `null` means the
   * API says nothing. In practice a far-out day is `tier: 'composed'` with `basis: 'unmeasured'`
   * rather than `long_range`, so the band reads the basis.
   */
  accuracy?: {
    basis?: 'measured' | 'unmeasured' | null;
    /**
     * The day's typical error in minutes over every ride and hour. A TYPICAL error, not a bound,
     * like `PlanDayRide.expectedError`. Present only where `basis` is `measured`.
     */
    typicalError?: number | null;
    /**
     * Observations behind that figure. It grows with lead time, because a composed day is scaled
     * from a wider historical window, so it describes the method, not the day's quality.
     */
    sampleSize?: number | null;
  } | null;
  /**
   * The park's photo for the planner panel, added by the proxy route from this repo's media
   * database; `null` for most parks.
   */
  parkBackgroundImage?: string | null;
  /** `object-position` from the image's curated focal point. */
  parkBackgroundPosition?: string;
  rides: PlanDayRide[];
  shows: PlanDayShow[];
}

/**
 * Where a showtime came from. `scheduled` is the operator's listing (today and past days only; no
 * source knows showtimes in advance). `projected` carries the last matching weekday forward: an
 * observation of another day (see {@link PlanDayShow.observedOn}), not a promise. The two MUST be
 * drawn differently, or the app promises a performance nobody scheduled.
 */
export type PlanDayShowSource = 'scheduled' | 'projected';

/** One show's times on the planned day. */
export interface PlanDayShow {
  showSlug: string;
  showName: string;
  /**
   * Where the show is: present on nearly every show; absent is the normal case for one nobody has
   * located, not an error.
   */
  latitude?: number | null;
  longitude?: number | null;
  /** Park-local `HH:mm`, ascending. */
  times: string[];
  source: PlanDayShowSource;
  /**
   * `projected` only: the date these times were observed on (the most recent same weekday).
   * Absent on a `scheduled` entry, which speaks for the date asked about.
   */
  observedOn?: string | null;
  /** `projected` only: how many measured days stand behind the projection. */
  sampleDays?: number | null;
}
