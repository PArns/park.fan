// ============================================================================
// Enums and Constants
// ============================================================================

export type ParkStatus = 'OPERATING' | 'CLOSED';
export type AttractionStatus = 'OPERATING' | 'DOWN' | 'CLOSED' | 'REFURBISHMENT';
export type QueueType =
  | 'STANDBY'
  | 'SINGLE_RIDER'
  | 'RETURN_TIME'
  | 'BOARDING_GROUP'
  | 'PAID_RETURN_TIME'
  | 'PAID_STANDBY';
export type CrowdLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme';
export type ParkCrowdLevel = 'very_low' | 'low' | 'normal' | 'higher' | 'high' | 'extreme';
export type AccuracyBadge = 'excellent' | 'good' | 'fair' | 'poor' | 'insufficient_data';
export type Recommendation =
  | 'highly_recommended'
  | 'recommended'
  | 'neutral'
  | 'avoid'
  | 'strongly_avoid'
  | 'closed';
export type ScheduleType = 'OPERATING' | 'CLOSED';
export type Trend = 'up' | 'stable' | 'down';
export type ComparisonStatus = 'lower' | 'typical' | 'higher' | 'closed';
export type HolidayType = 'public' | 'observance' | 'school' | 'bank';

// ============================================================================
// Pagination
// ============================================================================
// Breadcrumb Type
export interface Breadcrumb {
  name: string;
  url: string;
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
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

export interface WeatherData {
  current?: WeatherDay;
  forecast?: WeatherDay[];
}

// ============================================================================
// Queue Data
// ============================================================================

export interface QueueDataItem {
  queueType: QueueType;
  status: AttractionStatus;
  waitTime: number | null;
  state: string | null;
  returnStart: string | null;
  returnEnd: string | null;
  price: unknown | null;
  allocationStatus: string | null;
  currentGroupStart: number | null;
  currentGroupEnd: number | null;
  estimatedWait: number | null;
  lastUpdated: string;
  trend?: Trend;
}

// ============================================================================
// Forecast / Predictions
// ============================================================================

export interface ForecastItem {
  predictedTime: string;
  predictedWaitTime: number;
  confidencePercentage: number | null;
  source: string;
  trend?: Trend;
}

export interface ParkDailyPrediction {
  date: string;
  crowdLevel: CrowdLevel | 'closed';
  confidencePercentage: number;
  recommendation?: Recommendation;
  source: string;
}

// ============================================================================
// Park Load & Analytics
// ============================================================================

export interface ParkLoad {
  crowdLevel: ParkCrowdLevel;
  baseline: number;
  currentWaitTime: number;
  trend?: Trend;
  comparisonStatus?: ComparisonStatus;
}

export interface ParkOccupancy {
  current: number;
  trend: Trend;
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
  last30Days: Record<string, unknown>;
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
  latitude: number | null;
  longitude: number | null;
  queues?: QueueDataItem[];
  land: string | null;
  status?: AttractionStatus;
  hourlyForecast?: ForecastItem[];
  predictionAccuracy?: PredictionAccuracy | null;
  currentLoad?: ParkLoad | null;
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
  showtimes?: ShowtimeEntry[];
  operatingHours?: string[];
  lastUpdated?: string;
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
  waitTime: number | null;
  partySize: number | null;
  operatingHours?: string[];
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
  crowdForecast?: ParkDailyPrediction[];
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
  hourlyForecast?: string[];
  forecasts?: ForecastItem[];
  latitude: number | null;
  longitude: number | null;
  park?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  statistics?: Record<string, unknown>;
  predictionAccuracy?: PredictionAccuracy | null;
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
  type: 'park' | 'attraction' | 'show' | 'restaurant';
  id: string;
  name: string;
  slug: string;
  url?: string;
  latitude?: number;
  longitude?: number;
  continent?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  resort?: string;
  status?: ParkStatus | AttractionStatus;
  load?: ParkCrowdLevel;
  parkHours?: { open: string; close: string; type: string };
  waitTime?: number;
  showTimes?: string[];
  parentPark?: { id: string; name: string; slug: string; url: string };
}

export interface SearchResult {
  query: string;
  results: SearchResultItem[];
  counts: Record<string, { returned: number; total: number }>;
}

// ============================================================================
// Discovery / Geo Types
// ============================================================================

export interface AttractionReference {
  id: string;
  name: string;
  slug: string;
  url: string;
}

export interface ParkReference {
  id: string;
  name: string;
  slug: string;
  country: string;
  attractions: AttractionReference[];
  attractionCount: number;
  // New backend fields (optional as backend might not always populate them?)
  // Actually, for discovery endpoints they ARE populated now.
  status?: ParkStatus;
  currentLoad?: {
    crowdLevel: CrowdLevel; // or string if purely from backend
    value: number;
    trend: Trend;
    percentage: number;
    queueSize: number;
  };
  analytics?: ParkAnalytics;
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
  closedParks: number;
  parks: number;
  parksOpenPercentage: number;
  openAttractions: number;
  closedAttractions: number;
  attractions: number;
  attractionsOpenPercentage: number;
  shows: number;
  restaurants: number;
  queueDataRecords: number;
  weatherDataRecords: number;
  scheduleEntries: number;
  restaurantLiveDataRecords: number;
  showLiveDataRecords: number;
  waitTimePredictions: number;
}

export interface ParkStatsItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  countrySlug?: string;
  averageWaitTime: number | null;
  url: string;
  crowdLevel: CrowdLevel | null;
  occupancy: number | null;
  comparedToTypical: string | null;
  totalAttractions: number;
  operatingAttractions: number;
  closedAttractions: number;
}

export interface AttractionStatsItem {
  id: string;
  name: string;
  slug: string;
  parkName: string;
  parkSlug: string;
  parkCity: string;
  parkCountry: string;
  parkCountrySlug?: string;
  waitTime: number;
  url: string;
  crowdLevel: CrowdLevel | null;
  baseline: number | null;
  comparison: string | null;
}

export interface GlobalStats {
  counts: GlobalCounts;
  mostCrowdedPark: ParkStatsItem | null;
  leastCrowdedPark: ParkStatsItem | null;
  longestWaitRide: AttractionStatsItem | null;
  shortestWaitRide: AttractionStatsItem | null;
  lastUpdated: string;
}

export interface GeoLiveStatsDto {
  continents: ContinentLiveStats[];
  generatedAt: string;
}

export interface ContinentLiveStats {
  slug: string;
  openParkCount: number;
  averageWaitTime: number | null;
  countries: CountryLiveStats[];
}

export interface CountryLiveStats {
  slug: string;
  openParkCount: number;
  averageWaitTime: number | null;
  cities: CityLiveStats[];
}

export interface CityLiveStats {
  slug: string;
  openParkCount: number;
  averageWaitTime: number | null;
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
// Health Types
// ============================================================================

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  services: Record<string, unknown>;
  data: Record<string, unknown>;
}
