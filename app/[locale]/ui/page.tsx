import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import Image from 'next/image';
import {
  Users,
  Clock,
  TrendingUp,
  MapPin,
  Star,
  Zap,
  Map,
  Palette,
  Layers,
  TreePalm,
  Ticket,
  CloudSun,
  CalendarDays,
  Info,
  LayoutGrid,
  Activity,
  BarChart2,
  Wrench,
  BookOpen,
  Sparkles,
} from 'lucide-react';

// Base UI
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Domain Badges
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { ComparisonBadge } from '@/components/parks/comparison-badge';
import { PeakHourBadge } from '@/components/parks/peak-hour-badge';

// Park Cards
import { ParkCard } from '@/components/parks/park-card';
import { ParkCardNearby } from '@/components/parks/park-card-nearby';
import { ParkCardNearbySkeleton } from '@/components/parks/park-card-nearby-skeleton';

// Attraction / Show / Restaurant Cards
import { AttractionCard } from '@/components/parks/attraction-card';
import { AttractionCardSkeleton } from '@/components/parks/attraction-card-skeleton';
import { ShowCard } from '@/components/parks/show-card';
import { ShowCardSkeleton } from '@/components/parks/show-card-skeleton';
import { RestaurantCardSkeleton } from '@/components/parks/restaurant-card-skeleton';

// Park Status + sparklines
import { ParkStatus } from '@/components/parks/park-status';
import { ParkTimeInfo } from '@/components/parks/park-time-info';
import { WaitTimeSparkline } from '@/components/parks/wait-time-sparkline';
import { HourlyP90Sparkline } from '@/components/parks/hourly-p90-sparkline';

// Attraction details
import { LandSection } from '@/components/parks/land-section';
import { RestaurantCard } from '@/components/parks/restaurant-card';
import { AttractionHistoryDay } from '@/components/parks/attraction-history-day';
import type { DayDataProps } from '@/components/parks/attraction-history-day';

// Weather + Calendar
import { WeatherCard } from '@/components/parks/weather-card';
import { ParkCalendarDay } from '@/components/parks/park-calendar-day';

// Background overlay
import { BackgroundOverlay } from '@/components/common/background-overlay';

// Home stat cards
import { ParkStatCard } from '@/components/home/park-stat-card';
import { AttractionStatCard } from '@/components/home/attraction-stat-card';

// Common Components
import { StatsCard } from '@/components/common/stats-card';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { FavoriteStar } from '@/components/common/favorite-star';
import { GlassCard } from '@/components/common/glass-card';
import { SectionHeader } from '@/components/common/section-header';
import { OpenStatusProgress } from '@/components/common/open-status-progress';
import { CompactNumberWithTooltip } from '@/components/common/compact-number-with-tooltip';
import { StatusInfoCard } from '@/components/common/status-info-card';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { LocaleSwitcher } from '@/components/common/locale-switcher';
import { DistanceBadge } from '@/components/common/distance-badge';
import { OperatingHoursDisplay } from '@/components/common/operating-hours-display';

// Gap components
import { TrendIndicator } from '@/components/parks/trend-indicator';
import { WaitTimeBadge } from '@/components/parks/wait-time-badge';
import { QueueTypeBadge } from '@/components/parks/queue-type-badge';

// Glossary inject
import { GlossaryInject } from '@/components/glossary/glossary-inject';

// Search
import { SearchCommand } from '@/components/search/search-bar';

// Refractive
import { RefractivePanel } from '@/components/common/refractive-panel';
import { RefractivePlayground } from '@/components/common/refractive-playground';
import { WaitTimeInfoCard } from '@/components/parks/wait-time-info-card';

import type {
  ParkResponse,
  ParkAttraction,
  WeatherData,
  CalendarDay,
  CrowdLevel,
  AttractionHistoryDay as AttractionHistoryDayType,
  ScheduleItem,
} from '@/lib/api/types';

// ============================================================================
// Layout helpers
// ============================================================================

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-8">
      <div className="flex items-center gap-3 border-b border-white/20 pb-3">
        <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
          <Icon className="text-primary h-4 w-4" />
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ComponentLabel({ name, file }: { name: string; file: string }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <code className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-bold">
        &lt;{name}&gt;
      </code>
      <span className="text-muted-foreground font-mono text-[10px]">{file}</span>
    </div>
  );
}

function Row({ children, wrap = true }: { children: React.ReactNode; wrap?: boolean }) {
  return <div className={`flex items-start gap-3 ${wrap ? 'flex-wrap' : ''}`}>{children}</div>;
}

// ============================================================================
// Mock data
// ============================================================================

const NOW_MS = Date.now();
const now = new Date(NOW_MS).toISOString();
const hourAgo = new Date(NOW_MS - 3600000).toISOString();
const halfHourAgo = new Date(NOW_MS - 1800000).toISOString();
const twoHoursAgo = new Date(NOW_MS - 7200000).toISOString();
const show1HAhead = new Date(NOW_MS + 5400000).toISOString();
const show3HAhead = new Date(NOW_MS + 10800000).toISOString();
const showYesterday = new Date(NOW_MS - 86400000 + 3600000).toISOString();
const returnStart = new Date(NOW_MS + 3600000).toISOString();
const returnEnd = new Date(NOW_MS + 5400000).toISOString();

const MOCK_PARK = {
  id: 'phantasialand',
  slug: 'phantasialand',
  name: 'Phantasialand',
  city: 'Brühl',
  country: 'Germany',
  continent: 'Europe',
  timezone: 'Europe/Berlin',
  status: 'OPERATING' as const,
  currentLoad: { crowdLevel: 'high' as CrowdLevel, baseline: 30, currentWaitTime: 35 },
  analytics: {
    occupancy: {
      current: 67,
      trend: 'stable' as const,
      comparedToTypical: 5,
      comparisonStatus: 'typical' as const,
      baseline90thPercentile: 75,
      updatedAt: now,
    },
    statistics: {
      avgWaitTime: 35,
      avgWaitToday: 40,
      peakHour: '14:30',
      crowdLevel: 'high' as CrowdLevel,
      totalAttractions: 42,
      operatingAttractions: 38,
      closedAttractions: 4,
      timestamp: now,
      peakWaitToday: 75,
    },
  },
  latitude: 50.7989,
  longitude: 6.879,
  url: '/europe/germany/bruhl/phantasialand',
} as unknown as ParkResponse;

const SPARKLINE_HISTORY = [
  { timestamp: twoHoursAgo, waitTime: 20 },
  { timestamp: new Date(NOW_MS - 5400000).toISOString(), waitTime: 35 },
  { timestamp: hourAgo, waitTime: 30 },
  { timestamp: halfHourAgo, waitTime: 55 },
  { timestamp: new Date(NOW_MS - 900000).toISOString(), waitTime: 48 },
  { timestamp: now, waitTime: 45 },
];

const HOURLY_P90 = [
  { hour: '09:00', value: 10 },
  { hour: '10:00', value: 25 },
  { hour: '11:00', value: 45 },
  { hour: '12:00', value: 60 },
  { hour: '13:00', value: 75 },
  { hour: '14:00', value: 80 },
  { hour: '15:00', value: 70 },
  { hour: '16:00', value: 55 },
  { hour: '17:00', value: 35 },
  { hour: '18:00', value: 15 },
];

const MOCK_ATTRACTION_OPERATING = {
  id: 'taron',
  slug: 'taron',
  name: 'Taron',
  land: 'Rookburgh',
  status: 'OPERATING' as const,
  queues: [
    { queueType: 'STANDBY' as const, status: 'OPERATING' as const, waitTime: 45, lastUpdated: now },
    {
      queueType: 'SINGLE_RIDER' as const,
      status: 'OPERATING' as const,
      waitTime: 20,
      lastUpdated: now,
    },
  ],
  currentLoad: { crowdLevel: 'high' as CrowdLevel, baseline: 30, currentWaitTime: 45 },
  trend: 'up' as const,
  statistics: {
    avgWaitToday: 40,
    minWaitToday: 15,
    maxWaitToday: 75,
    peakWaitToday: 75,
    peakWaitTimestamp: null,
    history: SPARKLINE_HISTORY,
  },
} as unknown as ParkAttraction;

const MOCK_ATTRACTION_VRT = {
  id: 'black-mamba',
  slug: 'black-mamba',
  name: 'Black Mamba',
  land: 'Africa',
  status: 'OPERATING' as const,
  queues: [
    { queueType: 'STANDBY' as const, status: 'OPERATING' as const, waitTime: 60, lastUpdated: now },
    {
      queueType: 'PAID_RETURN_TIME' as const,
      status: 'OPERATING' as const,
      returnStart: show1HAhead,
      returnEnd: new Date(NOW_MS + 7200000).toISOString(),
      price: 8,
      lastUpdated: now,
    },
  ],
  currentLoad: { crowdLevel: 'very_high' as CrowdLevel, baseline: 40, currentWaitTime: 60 },
  trend: 'stable' as const,
  statistics: {
    avgWaitToday: 55,
    minWaitToday: 20,
    maxWaitToday: 90,
    peakWaitToday: 90,
    peakWaitTimestamp: null,
    history: SPARKLINE_HISTORY,
  },
} as unknown as ParkAttraction;

const MOCK_ATTRACTION_DOWN = {
  id: 'maus-au-chocolat',
  slug: 'maus-au-chocolat',
  name: 'Maus au Chocolat',
  land: 'Wuze Town',
  status: 'DOWN' as const,
  queues: [
    { queueType: 'STANDBY' as const, status: 'DOWN' as const, waitTime: null, lastUpdated: now },
  ],
  currentLoad: null,
  trend: null,
  statistics: null,
} as unknown as ParkAttraction;

const MOCK_ATTRACTION_CLOSED = {
  id: 'mystery-castle',
  slug: 'mystery-castle',
  name: 'Mystery Castle',
  land: 'Mystery',
  status: 'CLOSED' as const,
  queues: [],
  currentLoad: null,
  trend: null,
  statistics: null,
} as unknown as ParkAttraction;

const MOCK_ATTRACTION_REFURB = {
  id: 'fly',
  slug: 'fly',
  name: 'FLY',
  land: 'Rookburgh',
  status: 'REFURBISHMENT' as const,
  queues: [],
  currentLoad: null,
  trend: null,
  statistics: null,
} as unknown as ParkAttraction;

// Trend variants
const MOCK_ATTRACTION_TREND_DOWN = {
  id: 'colorado-adventure',
  slug: 'colorado-adventure',
  name: 'Colorado Adventure',
  land: 'Mexico',
  status: 'OPERATING' as const,
  queues: [
    { queueType: 'STANDBY' as const, status: 'OPERATING' as const, waitTime: 25, lastUpdated: now },
  ],
  currentLoad: { crowdLevel: 'low' as CrowdLevel, baseline: 20, currentWaitTime: 25 },
  trend: 'down' as const,
  statistics: {
    avgWaitToday: 45,
    peakWaitToday: 60,
    minWaitToday: 10,
    maxWaitToday: 60,
    peakWaitTimestamp: null,
    history: SPARKLINE_HISTORY,
  },
} as unknown as ParkAttraction;

const MOCK_ATTRACTION_TREND_STABLE = {
  id: 'river-quest',
  slug: 'river-quest',
  name: 'River Quest',
  land: 'Deep in Africa',
  status: 'OPERATING' as const,
  queues: [
    { queueType: 'STANDBY' as const, status: 'OPERATING' as const, waitTime: 35, lastUpdated: now },
  ],
  currentLoad: { crowdLevel: 'moderate' as CrowdLevel, baseline: 25, currentWaitTime: 35 },
  trend: 'stable' as const,
  statistics: {
    avgWaitToday: 35,
    peakWaitToday: 50,
    minWaitToday: 20,
    maxWaitToday: 55,
    peakWaitTimestamp: null,
    history: SPARKLINE_HISTORY,
  },
} as unknown as ParkAttraction;

// Operating but no wait time in standby
const MOCK_ATTRACTION_NO_WAIT = {
  id: 'chiapas',
  slug: 'chiapas',
  name: 'Chiapas',
  land: 'Mexico',
  status: 'OPERATING' as const,
  queues: [
    {
      queueType: 'STANDBY' as const,
      status: 'OPERATING' as const,
      waitTime: null,
      lastUpdated: now,
    },
  ],
  currentLoad: null,
  trend: null,
  statistics: null,
} as unknown as ParkAttraction;

// Favorites mode: has park sub-object, url (for link), backgroundImage passed as prop
const MOCK_ATTRACTION_FAVORITES = {
  id: 'taron-fav',
  slug: 'taron',
  name: 'Taron',
  url: '/v1/parks/europe/germany/bruhl/phantasialand/attractions/taron',
  park: { id: 'phantasialand', name: 'Phantasialand', slug: 'phantasialand' },
  status: 'OPERATING' as const,
  queues: [
    { queueType: 'STANDBY' as const, status: 'OPERATING' as const, waitTime: 45, lastUpdated: now },
  ],
  trend: 'up' as const,
  statistics: {
    avgWaitToday: 40,
    peakWaitToday: 75,
    minWaitToday: 15,
    maxWaitToday: 75,
    peakWaitTimestamp: null,
    history: SPARKLINE_HISTORY,
  },
} as unknown as ParkAttraction;

// AttractionHistoryDay mocks
const MOCK_HISTORY_DAY_OPEN: DayDataProps = {
  dateStr: '2026-03-07',
  dayOfWeek: 'Sa',
  dayOfMonth: '7',
  month: 'Mar',
  attractionStatus: 'OPEN',
  isToday: true,
  historyData: {
    date: '2026-03-07',
    utilization: 'high',
    hourlyP90: HOURLY_P90,
  } as unknown as AttractionHistoryDayType,
  scheduleData: {
    openingTime: '2026-03-07T09:00:00+01:00',
    closingTime: '2026-03-07T18:00:00+01:00',
    scheduleType: 'OPERATING',
  } as unknown as ScheduleItem,
};
const MOCK_HISTORY_DAY_HOLIDAY: DayDataProps = {
  dateStr: '2026-04-05',
  dayOfWeek: 'So',
  dayOfMonth: '5',
  month: 'Apr',
  attractionStatus: 'OPEN',
  isToday: false,
  historyData: {
    date: '2026-04-05',
    utilization: 'very_high',
    hourlyP90: HOURLY_P90.map((h) => ({ ...h, value: Math.min(h.value + 20, 100) })),
  } as unknown as AttractionHistoryDayType,
  scheduleData: {
    openingTime: '2026-04-05T09:00:00+02:00',
    closingTime: '2026-04-05T20:00:00+02:00',
    scheduleType: 'OPERATING',
    isPublicHoliday: true,
  } as unknown as ScheduleItem,
};
const MOCK_HISTORY_DAY_SCHOOL: DayDataProps = {
  dateStr: '2026-07-18',
  dayOfWeek: 'Sa',
  dayOfMonth: '18',
  month: 'Jul',
  attractionStatus: 'OPEN',
  isToday: false,
  historyData: {
    date: '2026-07-18',
    utilization: 'extreme',
    hourlyP90: HOURLY_P90.map((h) => ({ ...h, value: Math.min(h.value + 30, 100) })),
  } as unknown as AttractionHistoryDayType,
  scheduleData: {
    openingTime: '2026-07-18T09:00:00+02:00',
    closingTime: '2026-07-18T22:00:00+02:00',
    scheduleType: 'OPERATING',
    isSchoolHoliday: true,
  } as unknown as ScheduleItem,
};
const MOCK_HISTORY_DAY_PARK_CLOSED: DayDataProps = {
  dateStr: '2026-03-10',
  dayOfWeek: 'Di',
  dayOfMonth: '10',
  month: 'Mar',
  attractionStatus: 'PARK_CLOSED',
  isToday: false,
  scheduleData: { scheduleType: 'CLOSED' } as unknown as ScheduleItem,
};
const MOCK_HISTORY_DAY_CLOSED_RIDE: DayDataProps = {
  dateStr: '2026-03-08',
  dayOfWeek: 'So',
  dayOfMonth: '8',
  month: 'Mar',
  attractionStatus: 'CLOSED_RIDE',
  isToday: false,
  scheduleData: {
    openingTime: '2026-03-08T10:00:00+01:00',
    closingTime: '2026-03-08T18:00:00+01:00',
    scheduleType: 'OPERATING',
  } as unknown as ScheduleItem,
};

const MOCK_FORECAST_BASE = [
  {
    date: '2026-03-08',
    dataType: 'forecast' as const,
    temperatureMax: '15',
    temperatureMin: '7',
    precipitationSum: '0',
    rainSum: '0',
    snowfallSum: '0',
    weatherCode: 1,
    weatherDescription: 'Mainly clear',
    windSpeedMax: '10',
  },
  {
    date: '2026-03-09',
    dataType: 'forecast' as const,
    temperatureMax: '12',
    temperatureMin: '6',
    precipitationSum: '3',
    rainSum: '3',
    snowfallSum: '0',
    weatherCode: 61,
    weatherDescription: 'Rain',
    windSpeedMax: '18',
  },
  {
    date: '2026-03-10',
    dataType: 'forecast' as const,
    temperatureMax: '16',
    temperatureMin: '8',
    precipitationSum: '0',
    rainSum: '0',
    snowfallSum: '0',
    weatherCode: 2,
    weatherDescription: 'Partly cloudy',
    windSpeedMax: '12',
  },
  {
    date: '2026-03-11',
    dataType: 'forecast' as const,
    temperatureMax: '19',
    temperatureMin: '10',
    precipitationSum: '0',
    rainSum: '0',
    snowfallSum: '0',
    weatherCode: 0,
    weatherDescription: 'Clear sky',
    windSpeedMax: '8',
  },
  {
    date: '2026-03-12',
    dataType: 'forecast' as const,
    temperatureMax: '11',
    temperatureMin: '5',
    precipitationSum: '8',
    rainSum: '8',
    snowfallSum: '0',
    weatherCode: 63,
    weatherDescription: 'Moderate rain',
    windSpeedMax: '25',
  },
  {
    date: '2026-03-13',
    dataType: 'forecast' as const,
    temperatureMax: '14',
    temperatureMin: '7',
    precipitationSum: '0',
    rainSum: '0',
    snowfallSum: '0',
    weatherCode: 3,
    weatherDescription: 'Overcast',
    windSpeedMax: '15',
  },
  {
    date: '2026-03-14',
    dataType: 'forecast' as const,
    temperatureMax: '17',
    temperatureMin: '9',
    precipitationSum: '0',
    rainSum: '0',
    snowfallSum: '0',
    weatherCode: 1,
    weatherDescription: 'Mainly clear',
    windSpeedMax: '12',
  },
  {
    date: '2026-03-15',
    dataType: 'forecast' as const,
    temperatureMax: '18',
    temperatureMin: '10',
    precipitationSum: '0',
    rainSum: '0',
    snowfallSum: '0',
    weatherCode: 0,
    weatherDescription: 'Clear sky',
    windSpeedMax: '10',
  },
  {
    date: '2026-03-16',
    dataType: 'forecast' as const,
    temperatureMax: '13',
    temperatureMin: '7',
    precipitationSum: '4',
    rainSum: '4',
    snowfallSum: '0',
    weatherCode: 80,
    weatherDescription: 'Showers',
    windSpeedMax: '20',
  },
  {
    date: '2026-03-17',
    dataType: 'forecast' as const,
    temperatureMax: '10',
    temperatureMin: '4',
    precipitationSum: '2',
    rainSum: '2',
    snowfallSum: '0',
    weatherCode: 71,
    weatherDescription: 'Snow',
    windSpeedMax: '15',
  },
  {
    date: '2026-03-18',
    dataType: 'forecast' as const,
    temperatureMax: '12',
    temperatureMin: '5',
    precipitationSum: '0',
    rainSum: '0',
    snowfallSum: '0',
    weatherCode: 2,
    weatherDescription: 'Partly cloudy',
    windSpeedMax: '10',
  },
  {
    date: '2026-03-19',
    dataType: 'forecast' as const,
    temperatureMax: '15',
    temperatureMin: '7',
    precipitationSum: '0',
    rainSum: '0',
    snowfallSum: '0',
    weatherCode: 1,
    weatherDescription: 'Mainly clear',
    windSpeedMax: '8',
  },
  {
    date: '2026-03-20',
    dataType: 'forecast' as const,
    temperatureMax: '18',
    temperatureMin: '9',
    precipitationSum: '0',
    rainSum: '0',
    snowfallSum: '0',
    weatherCode: 0,
    weatherDescription: 'Clear sky',
    windSpeedMax: '12',
  },
  {
    date: '2026-03-21',
    dataType: 'forecast' as const,
    temperatureMax: '16',
    temperatureMin: '8',
    precipitationSum: '1',
    rainSum: '1',
    snowfallSum: '0',
    weatherCode: 51,
    weatherDescription: 'Drizzle',
    windSpeedMax: '14',
  },
  {
    date: '2026-03-22',
    dataType: 'forecast' as const,
    temperatureMax: '14',
    temperatureMin: '6',
    precipitationSum: '0',
    rainSum: '0',
    snowfallSum: '0',
    weatherCode: 3,
    weatherDescription: 'Overcast',
    windSpeedMax: '16',
  },
  {
    date: '2026-03-23',
    dataType: 'forecast' as const,
    temperatureMax: '19',
    temperatureMin: '11',
    precipitationSum: '0',
    rainSum: '0',
    snowfallSum: '0',
    weatherCode: 0,
    weatherDescription: 'Clear sky',
    windSpeedMax: '10',
  },
];

const MOCK_WEATHER_SUNNY: WeatherData = {
  current: {
    date: '2026-03-07',
    dataType: 'current',
    temperatureMax: '18',
    temperatureMin: '9',
    precipitationSum: '0',
    rainSum: '0',
    snowfallSum: '0',
    weatherCode: 0,
    weatherDescription: 'Clear sky',
    windSpeedMax: '12',
  },
  now: {
    temperature: 15,
    apparentTemperature: 14,
    humidity: 48,
    weatherCode: 0,
    weatherDescription: 'Clear sky',
    isDay: true,
  },
  forecast: MOCK_FORECAST_BASE,
};
const MOCK_WEATHER_PARTLY: WeatherData = {
  current: {
    date: '2026-03-07',
    dataType: 'current',
    temperatureMax: '14',
    temperatureMin: '8',
    precipitationSum: '2',
    rainSum: '2',
    snowfallSum: '0',
    weatherCode: 2,
    weatherDescription: 'Partly cloudy',
    windSpeedMax: '18',
  },
  now: {
    temperature: 11,
    apparentTemperature: 9,
    humidity: 62,
    weatherCode: 2,
    weatherDescription: 'Partly cloudy',
    isDay: true,
  },
  forecast: MOCK_FORECAST_BASE,
};
const MOCK_WEATHER_RAINY: WeatherData = {
  current: {
    date: '2026-03-07',
    dataType: 'current',
    temperatureMax: '10',
    temperatureMin: '6',
    precipitationSum: '14',
    rainSum: '14',
    snowfallSum: '0',
    weatherCode: 63,
    weatherDescription: 'Moderate rain',
    windSpeedMax: '28',
  },
  now: {
    temperature: 8,
    apparentTemperature: 5,
    humidity: 91,
    weatherCode: 63,
    weatherDescription: 'Moderate rain',
    isDay: true,
  },
  forecast: MOCK_FORECAST_BASE,
};
const MOCK_WEATHER_STORMY: WeatherData = {
  current: {
    date: '2026-03-07',
    dataType: 'current',
    temperatureMax: '8',
    temperatureMin: '4',
    precipitationSum: '25',
    rainSum: '25',
    snowfallSum: '0',
    weatherCode: 95,
    weatherDescription: 'Thunderstorm',
    windSpeedMax: '55',
  },
  now: {
    temperature: 6,
    apparentTemperature: 1,
    humidity: 96,
    weatherCode: 95,
    weatherDescription: 'Thunderstorm',
    isDay: true,
  },
  forecast: MOCK_FORECAST_BASE,
};
const MOCK_WEATHER_SNOWY: WeatherData = {
  current: {
    date: '2026-03-07',
    dataType: 'current',
    temperatureMax: '-1',
    temperatureMin: '-6',
    precipitationSum: '8',
    rainSum: '0',
    snowfallSum: '8',
    weatherCode: 73,
    weatherDescription: 'Moderate snow',
    windSpeedMax: '20',
  },
  now: {
    temperature: -3,
    apparentTemperature: -8,
    humidity: 85,
    weatherCode: 73,
    weatherDescription: 'Moderate snow',
    isDay: true,
  },
  forecast: MOCK_FORECAST_BASE,
};
const MOCK_WEATHER_FOG: WeatherData = {
  current: {
    date: '2026-03-07',
    dataType: 'current',
    temperatureMax: '6',
    temperatureMin: '3',
    precipitationSum: '0',
    rainSum: '0',
    snowfallSum: '0',
    weatherCode: 45,
    weatherDescription: 'Fog',
    windSpeedMax: '5',
  },
  now: {
    temperature: 4,
    apparentTemperature: 3,
    humidity: 97,
    weatherCode: 45,
    weatherDescription: 'Fog',
    isDay: false,
  },
  forecast: MOCK_FORECAST_BASE,
};

const MOCK_CAL_OPERATING: CalendarDay = {
  date: '2026-03-07',
  status: 'OPERATING',
  isToday: true,
  isTomorrow: false,
  crowdLevel: 'high',
  avgWaitTime: 38,
  isHoliday: false,
  isBridgeDay: false,
  isSchoolVacation: false,
  hours: {
    openingTime: '2026-03-07T09:00:00+01:00',
    closingTime: '2026-03-07T18:00:00+01:00',
    type: 'OPERATING',
    isInferred: false,
  },
  weather: { condition: 'partly_cloudy', icon: 2, tempMin: 8, tempMax: 15, rainChance: 10 },
};
const MOCK_CAL_CLOSED: CalendarDay = {
  date: '2026-03-10',
  status: 'CLOSED',
  isToday: false,
  isTomorrow: false,
  crowdLevel: 'closed',
  isHoliday: false,
  isBridgeDay: false,
  isSchoolVacation: false,
};
const MOCK_CAL_HOLIDAY: CalendarDay = {
  date: '2026-04-05',
  status: 'OPERATING',
  isToday: false,
  isTomorrow: false,
  crowdLevel: 'very_high',
  avgWaitTime: 68,
  isHoliday: true,
  isBridgeDay: false,
  isSchoolVacation: false,
  isPublicHoliday: true,
  hours: {
    openingTime: '2026-04-05T09:00:00+02:00',
    closingTime: '2026-04-05T20:00:00+02:00',
    type: 'OPERATING',
    isInferred: false,
  },
  weather: { condition: 'clear', icon: 0, tempMin: 14, tempMax: 22, rainChance: 5 },
};
const MOCK_CAL_SCHOOL: CalendarDay = {
  date: '2026-07-18',
  status: 'OPERATING',
  isToday: false,
  isTomorrow: false,
  crowdLevel: 'extreme',
  avgWaitTime: 85,
  isHoliday: false,
  isBridgeDay: false,
  isSchoolVacation: true,
  isSchoolHoliday: true,
  hours: {
    openingTime: '2026-07-18T09:00:00+02:00',
    closingTime: '2026-07-18T22:00:00+02:00',
    type: 'OPERATING',
    isInferred: false,
  },
  weather: { condition: 'clear', icon: 0, tempMin: 20, tempMax: 31, rainChance: 0 },
};
const MOCK_CAL_BRIDGE: CalendarDay = {
  date: '2026-05-08',
  status: 'OPERATING',
  isToday: false,
  isTomorrow: false,
  crowdLevel: 'moderate',
  avgWaitTime: 28,
  isHoliday: false,
  isBridgeDay: true,
  isSchoolVacation: false,
  hours: {
    openingTime: '2026-05-08T09:00:00+02:00',
    closingTime: '2026-05-08T18:00:00+02:00',
    type: 'OPERATING',
    isInferred: true,
  },
  weather: { condition: 'partly_cloudy', icon: 2, tempMin: 12, tempMax: 19, rainChance: 20 },
};
const MOCK_CAL_UNKNOWN: CalendarDay = {
  date: '2026-11-15',
  status: 'UNKNOWN',
  isToday: false,
  isTomorrow: false,
  crowdLevel: 'closed',
  isHoliday: false,
  isBridgeDay: false,
  isSchoolVacation: false,
};

// ============================================================================
// Color table data
// ============================================================================

const COLOR_TABLE = [
  // Brand
  {
    category: 'Brand',
    variable: '--primary',
    light: 'oklch(0.628 0.137 241.275)',
    dark: 'same',
    hex: '#2191D3',
    usage: 'Buttons, links, focus rings, brand accent',
  },
  {
    category: 'Brand',
    variable: '--primary-foreground',
    light: 'oklch(0.991 0 0)',
    dark: 'same',
    hex: '#FCFCFC',
    usage: 'Text on primary bg',
  },
  {
    category: 'Brand',
    variable: '--ring',
    light: 'oklch(0.628 0.137 241.275)',
    dark: 'same',
    hex: '#2191D3',
    usage: 'Focus ring (= primary)',
  },
  // Layout
  {
    category: 'Layout',
    variable: '--background',
    light: 'oklch(1 0 0)',
    dark: 'oklch(0.145 0 0)',
    hex: '#fff / #1a1f2e',
    usage: 'Page background',
  },
  {
    category: 'Layout',
    variable: '--foreground',
    light: 'oklch(0.145 0 0)',
    dark: 'oklch(0.985 0 0)',
    hex: '#1a1f2e / #fafafa',
    usage: 'Main text color',
  },
  {
    category: 'Layout',
    variable: '--border',
    light: 'oklch(0.922 0 0)',
    dark: 'oklch(1 0 0 / 10%)',
    hex: '#ebebeb / white/10%',
    usage: 'Card borders, dividers',
  },
  // Cards
  {
    category: 'Cards',
    variable: '--card',
    light: 'oklch(1 0 0)',
    dark: 'oklch(0.205 0 0)',
    hex: '#fff / #252a38',
    usage: 'Card backgrounds',
  },
  {
    category: 'Cards',
    variable: '--card-foreground',
    light: 'oklch(0.145 0 0)',
    dark: 'oklch(0.985 0 0)',
    hex: 'same as foreground',
    usage: 'Text on cards',
  },
  {
    category: 'Cards',
    variable: '--popover',
    light: 'oklch(1 0 0)',
    dark: 'oklch(0.205 0 0)',
    hex: 'same as card',
    usage: 'Dropdown / popover bg',
  },
  // Neutral
  {
    category: 'Neutral',
    variable: '--secondary',
    light: 'oklch(0.97 0 0)',
    dark: 'oklch(0.269 0 0)',
    hex: '#f7f7f7 / #2e3546',
    usage: 'Secondary buttons, muted badges',
  },
  {
    category: 'Neutral',
    variable: '--muted',
    light: 'oklch(0.97 0 0)',
    dark: 'oklch(0.269 0 0)',
    hex: 'same as secondary',
    usage: 'Muted backgrounds (skeletons, chips)',
  },
  {
    category: 'Neutral',
    variable: '--muted-foreground',
    light: 'oklch(0.556 0 0)',
    dark: 'oklch(0.708 0 0)',
    hex: '#747474 / #aaaaaa',
    usage: 'Placeholder, label, meta text',
  },
  {
    category: 'Neutral',
    variable: '--accent',
    light: 'oklch(0.97 0 0)',
    dark: 'oklch(0.269 0 0)',
    hex: 'same as secondary',
    usage: 'Hover highlights',
  },
  // Semantic
  {
    category: 'Semantic',
    variable: '--destructive',
    light: 'oklch(0.577 0.245 27.325)',
    dark: 'oklch(0.704 0.191 22.216)',
    hex: '#e5394b / #f66',
    usage: 'Error, delete, destructive actions',
  },
  {
    category: 'Semantic',
    variable: '--success',
    light: 'oklch(0.55 0.21 142.136)',
    dark: 'same',
    hex: '#24a054',
    usage: 'Success (= status-operating)',
  },
  {
    category: 'Semantic',
    variable: '--warning',
    light: 'oklch(0.795 0.184 86.047)',
    dark: 'same',
    hex: '#e8b000',
    usage: 'Warning yellow',
  },
  // Status
  {
    category: 'Status',
    variable: '--status-operating',
    light: 'oklch(0.55 0.21 142.136)',
    dark: 'same',
    hex: '#24a054',
    usage: 'Attraction OPERATING — green',
  },
  {
    category: 'Status',
    variable: '--status-down',
    light: 'oklch(0.705 0.213 47.604)',
    dark: 'same',
    hex: '#e07c2f',
    usage: 'Attraction DOWN — orange',
  },
  {
    category: 'Status',
    variable: '--status-closed',
    light: 'oklch(0.556 0 0)',
    dark: 'same',
    hex: '#737373',
    usage: 'Attraction CLOSED — gray',
  },
  {
    category: 'Status',
    variable: '--status-refurbishment',
    light: 'oklch(0.623 0.214 259.815)',
    dark: 'same',
    hex: '#5b5bd6',
    usage: 'Attraction REFURBISHMENT — purple',
  },
  // Crowd
  {
    category: 'Crowd',
    variable: '--crowd-very-low',
    light: 'oklch(0.52 0.14 192)',
    dark: 'same',
    hex: '#1b8f8f',
    usage: 'Crowd very_low — teal',
  },
  {
    category: 'Crowd',
    variable: '--crowd-low',
    light: 'oklch(0.65 0.19 158)',
    dark: 'same',
    hex: '#22a968',
    usage: 'Crowd low — emerald',
  },
  {
    category: 'Crowd',
    variable: '--crowd-moderate',
    light: 'oklch(0.68 0.18 142)',
    dark: 'same',
    hex: '#3bb554',
    usage: 'Crowd moderate — green (P50)',
  },
  {
    category: 'Crowd',
    variable: '--crowd-high',
    light: 'oklch(0.68 0.18 55)',
    dark: 'same',
    hex: '#c9a000',
    usage: 'Crowd high — yellow',
  },
  {
    category: 'Crowd',
    variable: '--crowd-very-high',
    light: 'oklch(0.58 0.22 15)',
    dark: 'same',
    hex: '#d0611a',
    usage: 'Crowd very_high — orange',
  },
  {
    category: 'Crowd',
    variable: '--crowd-extreme',
    light: 'oklch(0.52 0.22 27)',
    dark: 'same',
    hex: '#c13b1b',
    usage: 'Crowd extreme — red',
  },
];

const COLOR_CATEGORIES = [
  'Brand',
  'Layout',
  'Cards',
  'Neutral',
  'Semantic',
  'Status',
  'Crowd',
] as const;

// ============================================================================
// Page
// ============================================================================

interface UiPageProps {
  params: Promise<{ locale: string }>;
}

export default async function UiStyleGuidePage({ params }: UiPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="relative min-h-screen">
      {/* Fixed non-scrolling background — needed for glass effects */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/images/parks/phantasialand/background.jpg"
          alt="Phantasialand background"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="bg-background/65 absolute inset-0" />
      </div>

      {/* Scrollable content */}
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 pb-32">
        {/* Page header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">park.fan UI Style Guide</h1>
          <p className="text-muted-foreground">
            Background: Phantasialand (fixed, non-scrolling) — glass and transparency effects
            visible while scrolling.
          </p>
        </div>

        {/* ================================================================
            1. FOUNDATION — Colors & Typography
        ================================================================ */}
        <Section title="Foundation — Colors & Typography" icon={Palette}>
          <Sub title="Complete Color Token Table">
            <GlassCard variant="medium" className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-border/50 bg-muted/40 border-b">
                      <th className="text-muted-foreground px-4 py-3 text-left font-semibold">
                        Category
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left font-semibold">
                        CSS Variable
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left font-semibold">
                        Light
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left font-semibold">
                        Dark
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left font-semibold">
                        ~Hex
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-left font-semibold">
                        Used for
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COLOR_CATEGORIES.map((cat) => {
                      const rows = COLOR_TABLE.filter((r) => r.category === cat);
                      return rows.map((row, i) => (
                        <tr
                          key={row.variable}
                          className="border-border/30 hover:bg-muted/20 border-b transition-colors"
                        >
                          {i === 0 && (
                            <td
                              rowSpan={rows.length}
                              className="text-foreground border-border/30 border-r px-4 py-2 align-top font-medium"
                            >
                              <Badge variant="outline" className="text-xs">
                                {cat}
                              </Badge>
                            </td>
                          )}
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="border-border/30 inline-block h-4 w-4 flex-shrink-0 rounded-sm border shadow-sm"
                                style={{ backgroundColor: `var(${row.variable})` }}
                              />
                              <code className="text-primary font-mono text-xs">{row.variable}</code>
                            </div>
                          </td>
                          <td className="text-muted-foreground px-4 py-2 font-mono text-xs">
                            {row.light}
                          </td>
                          <td className="text-muted-foreground px-4 py-2 font-mono text-xs">
                            {row.dark}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">{row.hex}</td>
                          <td className="text-muted-foreground px-4 py-2 text-xs">{row.usage}</td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </Sub>

          <Sub title="Brand & UI Palette — Visual">
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Primary', cssVar: '--primary' },
                { label: 'Secondary', cssVar: '--secondary' },
                { label: 'Muted', cssVar: '--muted' },
                { label: 'Accent', cssVar: '--accent' },
                { label: 'Background', cssVar: '--background' },
                { label: 'Card', cssVar: '--card' },
                { label: 'Destructive', cssVar: '--destructive' },
                { label: 'Warning', cssVar: '--warning' },
                { label: 'Border', cssVar: '--border' },
              ].map(({ label, cssVar }) => (
                <div key={cssVar} className="flex flex-col gap-1">
                  <div
                    className="border-border/40 h-14 w-24 rounded-lg border shadow-sm"
                    style={{ backgroundColor: `var(${cssVar})` }}
                  />
                  <span className="text-xs font-medium">{label}</span>
                  <code className="text-muted-foreground font-mono text-[10px]">{cssVar}</code>
                </div>
              ))}
            </div>
          </Sub>

          <Sub title="Status Colors — Visual">
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'OPERATING', cssVar: '--status-operating' },
                { label: 'DOWN', cssVar: '--status-down' },
                { label: 'CLOSED', cssVar: '--status-closed' },
                { label: 'REFURBISHMENT', cssVar: '--status-refurbishment' },
              ].map(({ label, cssVar }) => (
                <div key={cssVar} className="flex flex-col gap-1">
                  <div
                    className="flex h-14 w-28 items-center justify-center rounded-lg shadow-sm"
                    style={{ backgroundColor: `var(${cssVar})`, opacity: 0.85 }}
                  >
                    <span className="text-xs font-bold text-white">{label}</span>
                  </div>
                  <code className="text-muted-foreground font-mono text-[10px]">{cssVar}</code>
                </div>
              ))}
            </div>
          </Sub>

          <Sub title="Crowd Level Colors — Visual (very_low → extreme)">
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'very_low', cssVar: '--crowd-very-low' },
                { label: 'low', cssVar: '--crowd-low' },
                { label: 'moderate', cssVar: '--crowd-moderate' },
                { label: 'high', cssVar: '--crowd-high' },
                { label: 'very_high', cssVar: '--crowd-very-high' },
                { label: 'extreme', cssVar: '--crowd-extreme' },
              ].map(({ label, cssVar }) => (
                <div key={cssVar} className="flex flex-col gap-1">
                  <div
                    className="flex h-14 w-24 items-center justify-center rounded-lg shadow-sm"
                    style={{ backgroundColor: `var(${cssVar})`, opacity: 0.85 }}
                  >
                    <span className="text-[10px] font-bold text-white">{label}</span>
                  </div>
                  <code className="text-muted-foreground font-mono text-[10px]">{cssVar}</code>
                </div>
              ))}
            </div>
          </Sub>

          <Sub title="Typography Scale">
            <GlassCard variant="medium" className="space-y-3">
              <h1 className="text-5xl font-bold">H1 — Page Title (5xl bold)</h1>
              <h2 className="text-4xl font-bold">H2 — Section Title (4xl bold)</h2>
              <h3 className="text-3xl font-semibold">H3 — Card Heading (3xl semibold)</h3>
              <h4 className="text-2xl font-semibold">H4 — Sub-section (2xl semibold)</h4>
              <h5 className="text-xl font-medium">H5 — Label (xl medium)</h5>
              <h6 className="text-lg font-medium">H6 — Small Label (lg medium)</h6>
              <Separator />
              <p className="text-base">Body — Regular paragraph text at base (16px).</p>
              <p className="text-muted-foreground">
                Muted — Secondary text, descriptions, metadata.
              </p>
              <p className="text-sm">Small (sm) — 14px for compact UI elements.</p>
              <p className="text-muted-foreground text-xs">
                Extra Small (xs) — 12px for fine print and labels.
              </p>
              <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-sm">
                Monospace — slugs, IDs, code snippets
              </code>
            </GlassCard>
          </Sub>
        </Section>

        {/* ================================================================
            2. BASE UI COMPONENTS
        ================================================================ */}
        <Section title="Base UI Components" icon={LayoutGrid}>
          <ComponentLabel name="Badge" file="components/ui/badge.tsx" />
          <Sub title="Badge — Variants">
            <Row>
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </Row>
          </Sub>

          <ComponentLabel name="Button" file="components/ui/button.tsx" />
          <Sub title="Button — Variants">
            <Row>
              <Button>Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button disabled>Disabled</Button>
            </Row>
          </Sub>
          <Sub title="Button — Sizes">
            <Row>
              <Button size="lg">Large</Button>
              <Button size="default">Default</Button>
              <Button size="sm">Small</Button>
              <Button size="icon">
                <Star className="h-4 w-4" />
              </Button>
              <Button size="icon-sm">
                <Star className="h-3 w-3" />
              </Button>
              <Button size="icon-lg">
                <Star className="h-5 w-5" />
              </Button>
            </Row>
          </Sub>

          <ComponentLabel name="Separator" file="components/ui/separator.tsx" />
          <Sub title="Separator — Horizontal &amp; Vertical">
            <div className="space-y-4">
              <Separator />
              <div className="flex h-8 items-center gap-4">
                <span className="text-sm">Left</span>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-sm">Right</span>
              </div>
            </div>
          </Sub>

          <ComponentLabel name="Skeleton" file="components/ui/skeleton.tsx" />
          <Sub title="Skeleton — Loading Shapes">
            <div className="space-y-3">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-48" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          </Sub>

          <ComponentLabel name="Tabs" file="components/ui/tabs.tsx" />
          <Sub title="Tabs — Default (opaque bg-muted)">
            <Tabs defaultValue="overview" className="w-full max-w-md">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="attractions">Attractions</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-3">
                <div className="text-muted-foreground rounded-lg border p-4 text-sm">
                  Overview tab content
                </div>
              </TabsContent>
              <TabsContent value="attractions" className="mt-3">
                <div className="text-muted-foreground rounded-lg border p-4 text-sm">
                  Attractions tab content
                </div>
              </TabsContent>
              <TabsContent value="calendar" className="mt-3">
                <div className="text-muted-foreground rounded-lg border p-4 text-sm">
                  Calendar tab content
                </div>
              </TabsContent>
            </Tabs>
          </Sub>
          <Sub title="Tabs — Glass variant (as used on park page — bg-background/60 backdrop-blur-md)">
            <Tabs defaultValue="attractions" className="w-full max-w-lg">
              <TabsList className="border-border/50 bg-background/60 mb-2 flex h-auto w-full flex-wrap justify-start border backdrop-blur-md">
                <TabsTrigger value="attractions">Attractions (42)</TabsTrigger>
                <TabsTrigger value="shows">Shows (8)</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
              </TabsList>
              <TabsContent value="attractions" className="mt-3">
                <div className="text-muted-foreground rounded-lg border p-4 text-sm">
                  Attractions tab content
                </div>
              </TabsContent>
              <TabsContent value="shows" className="mt-3">
                <div className="text-muted-foreground rounded-lg border p-4 text-sm">
                  Shows tab content
                </div>
              </TabsContent>
            </Tabs>
          </Sub>

          <ComponentLabel name="Tooltip" file="components/ui/tooltip.tsx" />
          <Sub title="Tooltip — Hover Demo">
            <Row>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>This is a tooltip with helpful info</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="sm">
                    Top tooltip
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Tooltip on top</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Right tooltip
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Tooltip on the right</TooltipContent>
              </Tooltip>
            </Row>
          </Sub>

          <ComponentLabel name="Input" file="components/ui/input.tsx" />
          <Sub title="Input — States">
            <div className="flex flex-wrap gap-3">
              <Input placeholder="Default input..." className="max-w-xs" />
              <Input placeholder="Disabled..." disabled className="max-w-xs" />
              <Input defaultValue="With value" className="max-w-xs" />
            </div>
          </Sub>

          <ComponentLabel name="Progress" file="components/ui/progress.tsx" />
          <Sub title="Progress — Values">
            <div className="max-w-md space-y-3">
              {[0, 25, 50, 75, 100].map((v) => (
                <div key={v} className="flex items-center gap-3">
                  <span className="text-muted-foreground w-10 text-right text-xs">{v}%</span>
                  <Progress value={v} className="flex-1" />
                </div>
              ))}
            </div>
          </Sub>
        </Section>

        {/* ================================================================
            3. GLASS UI
        ================================================================ */}
        <Section title="Glass UI" icon={Layers}>
          <p className="text-muted-foreground -mt-4 text-sm">
            The fixed background makes transparency effects visible while scrolling.
          </p>

          <ComponentLabel name="GlassCard" file="components/common/glass-card.tsx" />
          <Sub title="GlassCard — light / medium / strong">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <GlassCard variant="light">
                <p className="font-semibold">light</p>
                <p className="text-muted-foreground text-sm">bg-background/40 + blur-sm</p>
              </GlassCard>
              <GlassCard variant="medium">
                <p className="font-semibold">medium (default)</p>
                <p className="text-muted-foreground text-sm">bg-background/60 + blur-md</p>
              </GlassCard>
              <GlassCard variant="strong">
                <p className="font-semibold">strong</p>
                <p className="text-muted-foreground text-sm">bg-background/80 + blur-lg</p>
              </GlassCard>
            </div>
          </Sub>

          <Sub title="CSS Glass Utility Classes — .glass-light / .glass / .glass-strong / .glass-heavy">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {['.glass-light', '.glass', '.glass-strong', '.glass-heavy'].map((cls) => (
                <div key={cls} className={`${cls.slice(1)} rounded-xl border p-4`}>
                  <code className="font-mono text-xs font-semibold">{cls}</code>
                </div>
              ))}
            </div>
          </Sub>

          <ComponentLabel name="WaitTimeInfoCard" file="components/parks/wait-time-info-card.tsx" />
          <Sub title="WaitTimeInfoCard — operating / closed / no data">
            <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
              <WaitTimeInfoCard
                waitTime={45}
                trend="up"
                minWaitToday={15}
                maxWaitToday={70}
                labels={{
                  title: 'Wait Time',
                  minutes: 'Minutes',
                  todayMin: 'Min.',
                  todayMax: 'Max.',
                  min: 'min.',
                  trendLabel: 'Rising',
                }}
              />
              <WaitTimeInfoCard
                waitTime={20}
                trend="down"
                minWaitToday={10}
                maxWaitToday={55}
                labels={{
                  title: 'Wait Time',
                  minutes: 'Minutes',
                  todayMin: 'Min.',
                  todayMax: 'Max.',
                  min: 'min.',
                  trendLabel: 'Falling',
                }}
              />
              <WaitTimeInfoCard
                waitTime={null}
                statusLabel="Closed"
                labels={{
                  title: 'Wait Time',
                  minutes: 'Minutes',
                  todayMin: 'Min.',
                  todayMax: 'Max.',
                  min: 'min.',
                }}
              />
            </div>
          </Sub>

          <ComponentLabel name="StatusInfoCard" file="components/common/status-info-card.tsx" />
          <Sub title="StatusInfoCard — glass=true / glass=false">
            <div className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
              <StatusInfoCard title="Wait Times" icon={Clock} glass={true}>
                <p className="text-muted-foreground text-sm">
                  Glass enabled (default) — blurred card.
                </p>
              </StatusInfoCard>
              <StatusInfoCard title="Attractions" icon={Activity} glass={false}>
                <p className="text-muted-foreground text-sm">
                  Glass disabled — solid card background.
                </p>
              </StatusInfoCard>
            </div>
          </Sub>

          <ComponentLabel
            name="BackgroundOverlay"
            file="components/common/background-overlay.tsx"
          />
          <Sub title="BackgroundOverlay — intensity: light / medium / heavy (used inside park + attraction cards)">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(['light', 'medium', 'heavy'] as const).map((intensity) => (
                <div key={intensity} className="relative h-36 overflow-hidden rounded-xl border">
                  <BackgroundOverlay
                    imageSrc="/images/parks/phantasialand/background.jpg"
                    alt="Phantasialand"
                    intensity={intensity}
                    hoverEffect
                  />
                  <div className="relative z-10 flex h-full flex-col justify-end p-4">
                    <code className="font-mono text-xs font-semibold">
                      intensity=&quot;{intensity}&quot;
                    </code>
                    <p className="text-muted-foreground text-xs">Hover for brightness effect</p>
                  </div>
                </div>
              ))}
            </div>
          </Sub>
        </Section>

        {/* ================================================================
            4. DOMAIN BADGES
        ================================================================ */}
        <Section title="Domain Badges" icon={Zap}>
          <ComponentLabel name="CrowdLevelBadge" file="components/parks/crowd-level-badge.tsx" />
          <Sub title="CrowdLevelBadge — All 7 Levels (incl. closed)">
            <Row>
              <CrowdLevelBadge level="very_low" />
              <CrowdLevelBadge level="low" />
              <CrowdLevelBadge level="moderate" />
              <CrowdLevelBadge level="high" />
              <CrowdLevelBadge level="very_high" />
              <CrowdLevelBadge level="extreme" />
              <CrowdLevelBadge level={'closed' as CrowdLevel} />
            </Row>
            <div className="mt-2">
              <p className="text-muted-foreground mb-2 text-xs">showLabel=false</p>
              <Row>
                <CrowdLevelBadge level="very_low" showLabel={false} />
                <CrowdLevelBadge level="low" showLabel={false} />
                <CrowdLevelBadge level="moderate" showLabel={false} />
                <CrowdLevelBadge level="high" showLabel={false} />
                <CrowdLevelBadge level="very_high" showLabel={false} />
                <CrowdLevelBadge level="extreme" showLabel={false} />
              </Row>
            </div>
          </Sub>

          <ComponentLabel name="ParkStatusBadge" file="components/parks/park-status-badge.tsx" />
          <Sub title="ParkStatusBadge — All 5 Statuses (AttractionStatus: OPERATING/DOWN/CLOSED/REFURBISHMENT + ParkStatus: UNKNOWN)">
            <Row>
              <ParkStatusBadge status="OPERATING" />
              <ParkStatusBadge status="DOWN" />
              <ParkStatusBadge status="CLOSED" />
              <ParkStatusBadge status="REFURBISHMENT" />
              <ParkStatusBadge status="UNKNOWN" />
            </Row>
            <p className="text-muted-foreground mt-1 text-xs">
              UNKNOWN = park-level only (no schedule data), falls through to CLOSED styling
            </p>
          </Sub>

          <ComponentLabel name="ComparisonBadge" file="components/parks/comparison-badge.tsx" />
          <Sub title="ComparisonBadge — All ComparisonStatus values (much_lower / lower / typical / higher / much_higher / closed)">
            <Row>
              <ComparisonBadge comparison="much_lower" />
              <ComparisonBadge comparison="lower" />
              <ComparisonBadge comparison="typical" />
              <ComparisonBadge comparison="higher" />
              <ComparisonBadge comparison="much_higher" />
              <ComparisonBadge comparison="closed" />
            </Row>
            <p className="text-muted-foreground mt-1 text-xs">
              much_lower / much_higher / closed → fallthrough to outline (no color). Consider
              extending the component.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <ComparisonBadge comparison="lower" showIcon={false} />
              <ComparisonBadge comparison="typical" showIcon={false} />
              <ComparisonBadge comparison="higher" showIcon={false} />
              <span className="text-muted-foreground self-center text-xs">showIcon=false</span>
            </div>
          </Sub>

          <ComponentLabel name="PeakHourBadge" file="components/parks/peak-hour-badge.tsx" />
          <Sub title="PeakHourBadge — renders after hydration if peak is in future">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Peak at 23:59:</span>
              <PeakHourBadge peakHour="23:59" timezone="Europe/Berlin" />
            </div>
          </Sub>
        </Section>

        {/* ================================================================
            5. PARK CARDS
        ================================================================ */}
        <Section title="Park Cards" icon={TreePalm}>
          <ComponentLabel name="ParkCard" file="components/parks/park-card.tsx" />
          <Sub title='ParkCard variant="compact" — OPERATING with bg / CLOSED / UNKNOWN / OPERATING no bg'>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ParkCard
                name="Phantasialand"
                slug="phantasialand"
                city="Brühl"
                country="Germany"
                href="/parks/europe/germany/bruhl/phantasialand"
                status="OPERATING"
                crowdLevel="high"
                averageWaitTime={35}
                operatingAttractions={38}
                totalAttractions={42}
                variant="compact"
                showBackground
                backgroundImage="/images/parks/phantasialand/background.jpg"
                timezone="Europe/Berlin"
                parkId="phantasialand-id"
              />
              <ParkCard
                name="Efteling"
                slug="efteling"
                city="Kaatsheuvel"
                country="Netherlands"
                href="/parks/europe/netherlands/kaatsheuvel/efteling"
                status="CLOSED"
                variant="compact"
                showBackground={false}
                timezone="Europe/Amsterdam"
                parkId="efteling-id"
              />
              <ParkCard
                name="Heide-Park"
                slug="heide-park"
                city="Soltau"
                country="Germany"
                href="/parks/europe/germany/soltau/heide-park"
                status="UNKNOWN"
                variant="compact"
                showBackground={false}
                timezone="Europe/Berlin"
              />
              <ParkCard
                name="Europa-Park"
                slug="europa-park"
                city="Rust"
                country="Germany"
                href="/parks/europe/germany/rust/europa-park"
                status="OPERATING"
                crowdLevel="low"
                averageWaitTime={12}
                operatingAttractions={55}
                totalAttractions={60}
                variant="compact"
                showBackground={false}
                timezone="Europe/Berlin"
              />
            </div>
          </Sub>

          <Sub title='ParkCard variant="detailed" — OPERATING (with schedule) / CLOSED (with next schedule)'>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ParkCard
                name="Phantasialand"
                slug="phantasialand"
                city="Brühl"
                country="Germany"
                href="/europe/germany/bruhl/phantasialand"
                status="OPERATING"
                crowdLevel="high"
                averageWaitTime={35}
                operatingAttractions={38}
                totalAttractions={42}
                variant="detailed"
                showBackground
                backgroundImage="/images/parks/phantasialand/background.jpg"
                timezone="Europe/Berlin"
                todaySchedule={{
                  openingTime: '2026-03-07T09:00:00+01:00',
                  closingTime: '2026-03-07T18:00:00+01:00',
                  scheduleType: 'OPERATING',
                }}
              />
              <ParkCard
                name="Efteling"
                slug="efteling"
                city="Kaatsheuvel"
                country="Netherlands"
                href="/europe/netherlands/kaatsheuvel/efteling"
                status="CLOSED"
                variant="detailed"
                showBackground={false}
                timezone="Europe/Amsterdam"
                nextSchedule={{
                  openingTime: '2026-03-08T10:00:00+01:00',
                  closingTime: '2026-03-08T18:00:00+01:00',
                  scheduleType: 'OPERATING',
                }}
              />
            </div>
          </Sub>

          <Sub title='ParkCard variant="hero" — OPERATING with distance'>
            <ParkCard
              name="Phantasialand"
              slug="phantasialand"
              city="Brühl"
              country="Germany"
              href="/europe/germany/bruhl/phantasialand"
              status="OPERATING"
              crowdLevel="very_high"
              averageWaitTime={68}
              operatingAttractions={38}
              totalAttractions={42}
              variant="hero"
              showBackground
              backgroundImage="/images/parks/phantasialand/background.jpg"
              timezone="Europe/Berlin"
              distance="3.2 km"
            />
          </Sub>

          <ComponentLabel name="ParkCardNearby" file="components/parks/park-card-nearby.tsx" />
          <Sub title="ParkCardNearby — OPERATING (nearest open) / CLOSED / REFURBISHMENT / OPERATING (no analytics)">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ParkCardNearby
                id="phantasialand"
                name="Phantasialand"
                city="Brühl"
                country="Germany"
                continent="Europe"
                distance={3200}
                status="OPERATING"
                timezone="Europe/Berlin"
                totalAttractions={42}
                operatingAttractions={38}
                analytics={{ avgWaitTime: 35, crowdLevel: 'high', occupancy: 67 }}
                url="/europe/germany/bruhl/phantasialand"
                backgroundImage="/images/parks/phantasialand/background.jpg"
                highlightAsNearestOpen
                todaySchedule={{
                  openingTime: '2026-03-07T09:00:00+01:00',
                  closingTime: '2026-03-07T18:00:00+01:00',
                  scheduleType: 'OPERATING',
                }}
              />
              <ParkCardNearby
                id="efteling"
                name="Efteling"
                city="Kaatsheuvel"
                country="Netherlands"
                continent="Europe"
                distance={120000}
                status="CLOSED"
                timezone="Europe/Amsterdam"
                totalAttractions={40}
                operatingAttractions={0}
                url="/europe/netherlands/kaatsheuvel/efteling"
                nextSchedule={{
                  openingTime: '2026-03-08T10:00:00+01:00',
                  closingTime: '2026-03-08T18:00:00+01:00',
                  scheduleType: 'OPERATING',
                }}
              />
              <ParkCardNearby
                id="heide-park"
                name="Heide-Park"
                city="Soltau"
                country="Germany"
                continent="Europe"
                distance={95000}
                status="REFURBISHMENT"
                timezone="Europe/Berlin"
                totalAttractions={30}
                operatingAttractions={0}
                url="/europe/germany/soltau/heide-park"
                nextSchedule={{
                  openingTime: '2026-04-01T10:00:00+02:00',
                  closingTime: '2026-04-01T18:00:00+02:00',
                  scheduleType: 'OPERATING',
                }}
              />
              <ParkCardNearby
                id="walibi-belgium"
                name="Walibi Belgium"
                city="Wavre"
                country="Belgium"
                continent="Europe"
                distance={85000}
                status="OPERATING"
                timezone="Europe/Brussels"
                totalAttractions={32}
                operatingAttractions={28}
                analytics={{ avgWaitTime: 18, crowdLevel: 'low', occupancy: 30 }}
                url="/europe/belgium/wavre/walibi-belgium"
              />
            </div>
          </Sub>

          <ComponentLabel
            name="ParkCardNearbySkeleton"
            file="components/parks/park-card-nearby-skeleton.tsx"
          />
          <Sub title="ParkCardNearbySkeleton — Loading State">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ParkCardNearbySkeleton />
              <ParkCardNearbySkeleton />
              <ParkCardNearbySkeleton />
            </div>
          </Sub>

          <ComponentLabel name="ParkStatCard" file="components/home/park-stat-card.tsx" />
          <Sub title="ParkStatCard — highest crowds / lowest wait">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ParkStatCard
                label="Highest crowds right now"
                park={{
                  id: 'phantasialand',
                  name: 'Phantasialand',
                  city: 'Brühl',
                  countryName: 'Germany',
                  url: '/europe/germany/bruhl/phantasialand',
                  averageWaitTime: 68,
                  crowdLevel: 'very_high',
                  operatingAttractions: 38,
                  totalAttractions: 42,
                }}
              />
              <ParkStatCard
                label="Lowest wait times right now"
                park={{
                  id: 'walibi-belgium',
                  name: 'Walibi Belgium',
                  city: 'Wavre',
                  countryName: 'Belgium',
                  url: '/europe/belgium/wavre/walibi-belgium',
                  averageWaitTime: 8,
                  crowdLevel: 'very_low',
                  operatingAttractions: 28,
                  totalAttractions: 32,
                }}
              />
            </div>
          </Sub>

          <ComponentLabel
            name="AttractionStatCard"
            file="components/home/attraction-stat-card.tsx"
          />
          <Sub title='AttractionStatCard — variant="high" (red) / variant="low" (green)'>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AttractionStatCard
                label="Longest wait right now"
                variant="high"
                attraction={{
                  id: 'taron',
                  name: 'Taron',
                  parkName: 'Phantasialand',
                  parkCity: 'Brühl',
                  countryName: 'Germany',
                  url: '/europe/germany/bruhl/phantasialand/attractions/taron',
                  waitTime: 90,
                  crowdLevel: 'extreme',
                }}
              />
              <AttractionStatCard
                label="Shortest wait right now"
                variant="low"
                attraction={{
                  id: 'river-quest',
                  name: 'River Quest',
                  parkName: 'Phantasialand',
                  parkCity: 'Brühl',
                  countryName: 'Germany',
                  url: '/europe/germany/bruhl/phantasialand/attractions/river-quest',
                  waitTime: 5,
                  crowdLevel: 'very_low',
                }}
              />
            </div>
          </Sub>
        </Section>

        {/* ================================================================
            6. ATTRACTION & SHOW CARDS
        ================================================================ */}
        <Section title="Attraction & Show Cards" icon={Ticket}>
          <ComponentLabel name="AttractionCard" file="components/parks/attraction-card.tsx" />
          <Sub title="AttractionCard — OPERATING: trend=up (rose) / trend=down (emerald) / trend=stable (gray)">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <AttractionCard
                attraction={MOCK_ATTRACTION_OPERATING}
                parkPath="/parks/europe/germany/bruhl/phantasialand"
                parkStatus="OPERATING"
              />
              <AttractionCard
                attraction={MOCK_ATTRACTION_TREND_DOWN}
                parkPath="/parks/europe/germany/bruhl/phantasialand"
                parkStatus="OPERATING"
              />
              <AttractionCard
                attraction={MOCK_ATTRACTION_TREND_STABLE}
                parkPath="/parks/europe/germany/bruhl/phantasialand"
                parkStatus="OPERATING"
              />
            </div>
          </Sub>
          <Sub title="AttractionCard — OPERATING + PAID_RETURN_TIME / OPERATING no wait time / DOWN / CLOSED / REFURBISHMENT">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <AttractionCard
                attraction={MOCK_ATTRACTION_VRT}
                parkPath="/parks/europe/germany/bruhl/phantasialand"
                parkStatus="OPERATING"
              />
              <AttractionCard
                attraction={MOCK_ATTRACTION_NO_WAIT}
                parkPath="/parks/europe/germany/bruhl/phantasialand"
                parkStatus="OPERATING"
              />
              <AttractionCard
                attraction={MOCK_ATTRACTION_DOWN}
                parkPath="/parks/europe/germany/bruhl/phantasialand"
                parkStatus="OPERATING"
              />
              <AttractionCard
                attraction={MOCK_ATTRACTION_CLOSED}
                parkPath="/parks/europe/germany/bruhl/phantasialand"
                parkStatus="OPERATING"
              />
              <AttractionCard
                attraction={MOCK_ATTRACTION_REFURB}
                parkPath="/parks/europe/germany/bruhl/phantasialand"
                parkStatus="OPERATING"
              />
            </div>
          </Sub>
          <Sub title="AttractionCard — Favorites mode (backgroundImage + showParkName + distance)">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AttractionCard
                attraction={MOCK_ATTRACTION_FAVORITES}
                backgroundImage="/images/parks/phantasialand/background.jpg"
                showParkName
                distance={3200}
              />
            </div>
          </Sub>

          <ComponentLabel
            name="AttractionCardSkeleton"
            file="components/parks/attraction-card-skeleton.tsx"
          />
          <Sub title="AttractionCardSkeleton — Loading State">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <AttractionCardSkeleton />
              <AttractionCardSkeleton />
              <AttractionCardSkeleton />
            </div>
          </Sub>

          <ComponentLabel name="ShowCard" file="components/parks/show-card.tsx" />
          <Sub title="ShowCard — OPERATING (4 showtimes, 2 past) / OPERATING no showtimes today / DOWN / CLOSED / with distance">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <ShowCard
                id="show-winjas"
                name="Winjas Stunt Show"
                slug="winjas-stunt-show"
                status="OPERATING"
                timezone="Europe/Berlin"
                href="/parks/europe/germany/bruhl/phantasialand#shows"
                parkName="Phantasialand"
                showtimes={[
                  { startTime: twoHoursAgo },
                  { startTime: hourAgo },
                  { startTime: show1HAhead },
                  { startTime: show3HAhead },
                ]}
              />
              <ShowCard
                id="show-no-today"
                name="Rookburgh Parade"
                slug="rookburgh-parade"
                status="OPERATING"
                timezone="Europe/Berlin"
                href="/parks/europe/germany/bruhl/phantasialand#shows"
                parkName="Phantasialand"
                showtimes={[{ startTime: showYesterday }]}
              />
              <ShowCard
                id="show-down"
                name="Mystery Show"
                slug="mystery-show"
                status="DOWN"
                timezone="Europe/Berlin"
                href="/parks/europe/germany/bruhl/phantasialand#shows"
                parkName="Phantasialand"
                showtimes={null}
              />
              <ShowCard
                id="show-chiapas"
                name="Chiapas Experience"
                slug="chiapas-experience"
                status="CLOSED"
                timezone="Europe/Berlin"
                href="/parks/europe/germany/bruhl/phantasialand#shows"
                parkName="Phantasialand"
                showtimes={null}
              />
              <ShowCard
                id="show-fav"
                name="Winjas Stunt Show"
                slug="winjas-stunt-show"
                status="OPERATING"
                timezone="Europe/Berlin"
                href="/parks/europe/germany/bruhl/phantasialand#shows"
                parkName="Phantasialand"
                distance={3200}
                showtimes={[{ startTime: show1HAhead }]}
              />
            </div>
          </Sub>

          <ComponentLabel name="ShowCardSkeleton" file="components/parks/show-card-skeleton.tsx" />
          <Sub title="ShowCardSkeleton — Loading State">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ShowCardSkeleton />
              <ShowCardSkeleton />
              <ShowCardSkeleton />
            </div>
          </Sub>

          <ComponentLabel name="RestaurantCard" file="components/parks/restaurant-card.tsx" />
          <Sub title="RestaurantCard — various states">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <RestaurantCard
                restaurant={{
                  id: 'rest-1',
                  name: 'Uhrwerk Restaurant',
                  slug: 'uhrwerk-restaurant',
                  cuisineType: 'German',
                  latitude: null,
                  longitude: null,
                  requiresReservation: false,
                  status: 'OPERATING',
                  waitTime: 15,
                }}
              />
              <RestaurantCard
                restaurant={{
                  id: 'rest-2',
                  name: 'Rookburgh Café',
                  slug: 'rookburgh-cafe',
                  cuisineType: 'Café',
                  latitude: null,
                  longitude: null,
                  requiresReservation: true,
                  status: 'OPERATING',
                  operatingHours: [{ type: 'OPERATING', startTime: '10:00', endTime: '20:00' }],
                }}
              />
              <RestaurantCard
                restaurant={{
                  id: 'rest-3',
                  name: 'La Cantina',
                  slug: 'la-cantina',
                  cuisineType: null,
                  latitude: null,
                  longitude: null,
                  requiresReservation: false,
                  status: 'CLOSED',
                }}
              />
            </div>
          </Sub>

          <ComponentLabel
            name="RestaurantCardSkeleton"
            file="components/parks/restaurant-card-skeleton.tsx"
          />
          <Sub title="RestaurantCardSkeleton — Loading State">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <RestaurantCardSkeleton />
              <RestaurantCardSkeleton />
              <RestaurantCardSkeleton />
            </div>
          </Sub>

          <ComponentLabel name="LandSection" file="components/parks/land-section.tsx" />
          <Sub title="LandSection — land header + attraction grid (as used in park attractions tab)">
            <LandSection
              landName="Rookburgh"
              attractions={[
                MOCK_ATTRACTION_OPERATING,
                MOCK_ATTRACTION_TREND_DOWN,
                MOCK_ATTRACTION_REFURB,
              ]}
              parkPath="/parks/europe/germany/bruhl/phantasialand"
              parkSlug="phantasialand"
              parkStatus="OPERATING"
            />
          </Sub>
        </Section>

        {/* ================================================================
            7. PARK STATUS & TIMING
        ================================================================ */}
        <Section title="Park Status & Timing" icon={Map}>
          <ComponentLabel name="ParkStatus" file="components/parks/park-status.tsx" />

          <Sub title='variant="compact" — OPERATING / CLOSED'>
            <Row>
              <GlassCard variant="medium" className="inline-block">
                <ParkStatus park={MOCK_PARK} variant="compact" />
              </GlassCard>
              <GlassCard variant="medium" className="inline-block">
                <ParkStatus
                  park={
                    {
                      ...MOCK_PARK,
                      status: 'CLOSED' as const,
                      currentLoad: null,
                    } as unknown as ParkResponse
                  }
                  variant="compact"
                />
              </GlassCard>
            </Row>
          </Sub>

          <Sub title='variant="card" — OPERATING / CLOSED'>
            <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
              <ParkStatus park={MOCK_PARK} variant="card" />
              <ParkStatus
                park={
                  {
                    ...MOCK_PARK,
                    status: 'CLOSED' as const,
                    currentLoad: null,
                  } as unknown as ParkResponse
                }
                variant="card"
              />
            </div>
          </Sub>

          <Sub title='variant="hero" — OPERATING'>
            <ParkStatus park={MOCK_PARK} variant="hero" />
          </Sub>

          <Sub title='variant="detailed" — OPERATING (crowd + wait + attractions cards)'>
            <ParkStatus park={MOCK_PARK} variant="detailed" />
          </Sub>

          <Sub title='variant="detailed" — CLOSED (renders nothing — expected)'>
            <GlassCard variant="medium" className="inline-flex items-center gap-2 px-4 py-3">
              <ParkStatus
                park={
                  {
                    ...MOCK_PARK,
                    status: 'CLOSED' as const,
                    currentLoad: null,
                  } as unknown as ParkResponse
                }
                variant="detailed"
              />
              <span className="text-muted-foreground text-xs italic">
                — detailed returns null when CLOSED (no stats)
              </span>
            </GlassCard>
          </Sub>

          <ComponentLabel name="ParkTimeInfo" file="components/parks/park-time-info.tsx" />
          <Sub title="ParkTimeInfo — with today schedule (live clock + opens/closes in countdown)">
            <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
              <ParkTimeInfo
                timezone="Europe/Berlin"
                todaySchedule={
                  {
                    openingTime: '2026-03-07T09:00:00+01:00',
                    closingTime: '2026-03-07T22:00:00+01:00',
                    scheduleType: 'OPERATING',
                  } as unknown as ScheduleItem
                }
              />
              <ParkTimeInfo
                timezone="America/New_York"
                todaySchedule={
                  {
                    openingTime: '2026-03-07T09:00:00-05:00',
                    closingTime: '2026-03-07T20:00:00-05:00',
                    scheduleType: 'OPERATING',
                  } as unknown as ScheduleItem
                }
                nextSchedule={
                  {
                    openingTime: '2026-03-08T09:00:00-05:00',
                    closingTime: '2026-03-08T20:00:00-05:00',
                    scheduleType: 'OPERATING',
                  } as unknown as ScheduleItem
                }
              />
            </div>
          </Sub>
        </Section>

        {/* ================================================================
            8. CHARTS & SPARKLINES
        ================================================================ */}
        <Section title="Charts & Sparklines" icon={BarChart2}>
          <ComponentLabel
            name="WaitTimeSparkline"
            file="components/parks/wait-time-sparkline.tsx"
          />
          <Sub title="WaitTimeSparkline — Hover for tooltip">
            <GlassCard variant="medium" className="max-w-xs p-4">
              <p className="text-muted-foreground mb-3 text-xs">Taron — last 2 hours</p>
              <WaitTimeSparkline history={SPARKLINE_HISTORY} className="h-16 w-full" />
            </GlassCard>
          </Sub>

          <ComponentLabel
            name="HourlyP90Sparkline"
            file="components/parks/hourly-p90-sparkline.tsx"
          />
          <Sub title="HourlyP90Sparkline — Daily wait curve (P90 per hour)">
            <GlassCard variant="medium" className="max-w-sm p-4">
              <p className="text-muted-foreground mb-3 text-xs">Taron — typical day (P90)</p>
              <HourlyP90Sparkline hourlyP90={HOURLY_P90} className="h-16 w-full" />
            </GlassCard>
          </Sub>
        </Section>

        {/* ================================================================
            9. COMMON COMPONENTS
        ================================================================ */}
        <Section title="Common Components" icon={Star}>
          <ComponentLabel name="StatsCard" file="components/common/stats-card.tsx" />
          <Sub title="StatsCard — title / value / description / icon">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatsCard
                title="Total Visitors Today"
                value="24,850"
                description="↑ 12% vs last Saturday"
                icon={Users}
              />
              <StatsCard
                title="Average Wait Time"
                value="35 min"
                description="Peak: 75 min at Taron"
                icon={Clock}
              />
              <StatsCard
                title="Operating Attractions"
                value="38 / 42"
                description="4 closed for maintenance"
                icon={TrendingUp}
              />
            </div>
          </Sub>

          <ComponentLabel
            name="OpenStatusProgress"
            file="components/common/open-status-progress.tsx"
          />
          <Sub title="OpenStatusProgress — open count / total count progress bar">
            <GlassCard variant="medium" className="max-w-sm space-y-4">
              <OpenStatusProgress openCount={38} totalCount={42} label="Attractions operating" />
              <OpenStatusProgress openCount={3} totalCount={12} label="Shows operating" />
              <OpenStatusProgress openCount={0} totalCount={8} label="Restaurants (all closed)" />
            </GlassCard>
          </Sub>

          <ComponentLabel name="BreadcrumbNav" file="components/common/breadcrumb-nav.tsx" />
          <Sub title='BreadcrumbNav variant="pill" (default) — park page / attraction page'>
            <div className="flex flex-col gap-4">
              <BreadcrumbNav
                breadcrumbs={[
                  { name: 'Europe', url: '/europe' },
                  { name: 'Germany', url: '/europe/germany' },
                  { name: 'Brühl', url: '/europe/germany/bruhl' },
                ]}
                currentPage="Phantasialand"
              />
              <BreadcrumbNav
                breadcrumbs={[
                  { name: 'Europe', url: '/europe' },
                  { name: 'Germany', url: '/europe/germany' },
                  { name: 'Brühl', url: '/europe/germany/bruhl' },
                  { name: 'Phantasialand', url: '/europe/germany/bruhl/phantasialand' },
                ]}
                currentPage="Taron"
                pinLastBreadcrumb
              />
            </div>
          </Sub>
          <Sub title='BreadcrumbNav variant="plain" — listing pages (no background)'>
            <BreadcrumbNav
              variant="plain"
              breadcrumbs={[
                { name: 'Europe', url: '/europe' },
                { name: 'Germany', url: '/europe/germany' },
              ]}
              currentPage="Brühl"
            />
          </Sub>

          <ComponentLabel name="FavoriteStar" file="components/common/favorite-star.tsx" />
          <Sub title="FavoriteStar — all 4 types × all 3 sizes">
            <div className="flex flex-wrap gap-6">
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <div key={size} className="flex flex-col gap-2">
                  <span className="text-muted-foreground font-mono text-xs">size={size}</span>
                  <div className="flex gap-3">
                    {(['park', 'attraction', 'show', 'restaurant'] as const).map((type) => (
                      <div key={type} className="flex items-center gap-1">
                        <FavoriteStar
                          type={type}
                          id={`demo-${type}-${size}`}
                          name={type}
                          size={size}
                        />
                        <span className="text-muted-foreground text-xs">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Sub>

          <ComponentLabel
            name="CompactNumberWithTooltip"
            file="components/common/compact-number-with-tooltip.tsx"
          />
          <Sub title="CompactNumberWithTooltip — hover to see full number">
            <GlassCard variant="medium" className="flex flex-wrap gap-6 p-4">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">4,900,000</span>
                <span className="text-2xl font-bold">
                  <CompactNumberWithTooltip value={4900000} />
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">125,430</span>
                <span className="text-2xl font-bold">
                  <CompactNumberWithTooltip value={125430} />
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">8,200</span>
                <span className="text-2xl font-bold">
                  <CompactNumberWithTooltip value={8200} />
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">430</span>
                <span className="text-2xl font-bold">
                  <CompactNumberWithTooltip value={430} />
                </span>
              </div>
            </GlassCard>
          </Sub>

          <ComponentLabel name="SectionHeader" file="components/common/section-header.tsx" />
          <Sub title="SectionHeader — icon + title + optional badge">
            <div className="space-y-3">
              <SectionHeader icon={MapPin} title="Parks in Germany" badge={42} />
              <SectionHeader icon={Ticket} title="Attractions" />
              <SectionHeader icon={Wrench} title="Under Refurbishment" badge={3} />
            </div>
          </Sub>

          <ComponentLabel name="ThemeToggle" file="components/common/theme-toggle.tsx" />
          <ComponentLabel name="LocaleSwitcher" file="components/common/locale-switcher.tsx" />
          <Sub title="ThemeToggle + LocaleSwitcher — Interactive dropdowns">
            <Row>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">ThemeToggle</span>
                <ThemeToggle />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">LocaleSwitcher</span>
                <LocaleSwitcher />
              </div>
            </Row>
          </Sub>

          <ComponentLabel name="SearchCommand" file="components/search/search-bar.tsx" />
          <Sub title='SearchCommand — trigger="button" opens dialog'>
            <SearchCommand trigger="button" size="lg" isGlobal />
          </Sub>
        </Section>

        {/* ================================================================
            10. WEATHER CARD
        ================================================================ */}
        <Section title="Weather Card" icon={CloudSun}>
          <ComponentLabel name="WeatherCard" file="components/parks/weather-card.tsx" />
          <Sub title="WeatherCard — As seen on Park Page (with Glass effect)">
            <div
              className="relative overflow-hidden rounded-xl bg-cover bg-center p-8"
              style={{
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1513889953751-09e9a5fc1c0c?auto=format&fit=crop&q=80&w=2000)',
              }}
            >
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
              <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-2">
                <ParkTimeInfo
                  timezone="Europe/Berlin"
                  status="OPERATING"
                  todaySchedule={{
                    date: '2026-03-07',
                    openingTime: '09:00',
                    closingTime: '20:00',
                    scheduleType: 'OPERATING',
                    description: null,
                    purchases: null,
                    holidayName: null,
                  }}
                />
                <WeatherCard weather={MOCK_WEATHER_SUNNY} />
              </div>
            </div>
          </Sub>

          <Sub title="WeatherCard — Different Conditions">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <WeatherCard weather={MOCK_WEATHER_PARTLY} />
              <WeatherCard weather={MOCK_WEATHER_RAINY} />
              <WeatherCard weather={MOCK_WEATHER_STORMY} />
              <WeatherCard weather={MOCK_WEATHER_SNOWY} />
              <WeatherCard weather={MOCK_WEATHER_FOG} />
            </div>
          </Sub>
        </Section>

        {/* ================================================================
            11. ATTRACTION HISTORY
        ================================================================ */}
        <Section title="Attraction History" icon={BarChart2}>
          <ComponentLabel
            name="AttractionHistoryDay"
            file="components/parks/attraction-history-day.tsx"
          />
          <Sub title="AttractionHistoryDay — All States (today / public holiday / school vacation / park closed / ride closed)">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <div className="space-y-1">
                <AttractionHistoryDay day={MOCK_HISTORY_DAY_OPEN} />
                <p className="text-muted-foreground text-center text-[10px]">OPEN · today · high</p>
              </div>
              <div className="space-y-1">
                <AttractionHistoryDay day={MOCK_HISTORY_DAY_HOLIDAY} />
                <p className="text-muted-foreground text-center text-[10px]">
                  OPEN · public holiday · very_high
                </p>
              </div>
              <div className="space-y-1">
                <AttractionHistoryDay day={MOCK_HISTORY_DAY_SCHOOL} />
                <p className="text-muted-foreground text-center text-[10px]">
                  OPEN · school vacation · extreme
                </p>
              </div>
              <div className="space-y-1">
                <AttractionHistoryDay day={MOCK_HISTORY_DAY_PARK_CLOSED} />
                <p className="text-muted-foreground text-center text-[10px]">PARK_CLOSED</p>
              </div>
              <div className="space-y-1">
                <AttractionHistoryDay day={MOCK_HISTORY_DAY_CLOSED_RIDE} />
                <p className="text-muted-foreground text-center text-[10px]">CLOSED_RIDE</p>
              </div>
            </div>
          </Sub>
        </Section>

        {/* ================================================================
            12. CALENDAR DAYS
        ================================================================ */}
        <Section title="Calendar Days" icon={CalendarDays}>
          <ComponentLabel name="ParkCalendarDay" file="components/parks/park-calendar-day.tsx" />
          <Sub title="ParkCalendarDay — All States">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <div className="space-y-1">
                <ParkCalendarDay day={MOCK_CAL_OPERATING} isToday={true} />
                <p className="text-muted-foreground text-center text-[10px]">
                  OPERATING · today · high
                </p>
              </div>
              <div className="space-y-1">
                <ParkCalendarDay day={MOCK_CAL_CLOSED} isToday={false} />
                <p className="text-muted-foreground text-center text-[10px]">CLOSED</p>
              </div>
              <div className="space-y-1">
                <ParkCalendarDay day={MOCK_CAL_HOLIDAY} isToday={false} />
                <p className="text-muted-foreground text-center text-[10px]">
                  Public holiday · very_high
                </p>
              </div>
              <div className="space-y-1">
                <ParkCalendarDay day={MOCK_CAL_SCHOOL} isToday={false} />
                <p className="text-muted-foreground text-center text-[10px]">
                  School vacation · extreme
                </p>
              </div>
              <div className="space-y-1">
                <ParkCalendarDay day={MOCK_CAL_BRIDGE} isToday={false} />
                <p className="text-muted-foreground text-center text-[10px]">
                  Bridge day · moderate
                </p>
              </div>
              <div className="space-y-1">
                <ParkCalendarDay day={MOCK_CAL_UNKNOWN} isToday={false} />
                <p className="text-muted-foreground text-center text-[10px]">UNKNOWN (no data)</p>
              </div>
            </div>
          </Sub>
        </Section>

        {/* ================================================================
            12. EXTRACTED SHARED COMPONENTS
        ================================================================ */}
        <Section title="Shared Micro-Components" icon={Info}>
          <ComponentLabel name="TrendIndicator" file="components/parks/trend-indicator.tsx" />
          <Sub title="TrendIndicator — variant=icon, size=sm (default) / size=md">
            <div className="space-y-3">
              <Row>
                {(['up', 'increasing', 'stable', 'down', 'decreasing'] as const).map((t) => (
                  <div key={t} className="flex flex-col items-center gap-1">
                    <TrendIndicator trend={t} size="sm" />
                    <span className="text-muted-foreground font-mono text-[10px]">{t}</span>
                  </div>
                ))}
                <span className="text-muted-foreground mb-0.5 self-end text-xs">sm</span>
              </Row>
              <Row>
                {(['up', 'stable', 'down'] as const).map((t) => (
                  <div key={t} className="flex flex-col items-center gap-1">
                    <TrendIndicator trend={t} size="md" />
                    <span className="text-muted-foreground font-mono text-[10px]">{t}</span>
                  </div>
                ))}
                <span className="text-muted-foreground mb-0.5 self-end text-xs">md</span>
              </Row>
            </div>
          </Sub>
          <Sub title="TrendIndicator — variant=pill with label (park-status detailed)">
            <Row>
              {(['up', 'stable', 'down'] as const).map((t) => (
                <TrendIndicator key={t} trend={t} variant="pill" label={t} />
              ))}
              {(['up', 'stable', 'down'] as const).map((t) => (
                <TrendIndicator key={`md-${t}`} trend={t} variant="pill" size="md" label={t} />
              ))}
            </Row>
          </Sub>

          <ComponentLabel name="WaitTimeBadge" file="components/parks/wait-time-badge.tsx" />
          <Sub title="WaitTimeBadge — size=lg (attraction card main) / size=sm (park card avg)">
            <Row>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground font-mono text-[10px]">
                  size=&quot;lg&quot;
                </span>
                <WaitTimeBadge waitTime={45} size="lg" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground font-mono text-[10px]">
                  size=&quot;lg&quot; 1 min
                </span>
                <WaitTimeBadge waitTime={1} size="lg" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground font-mono text-[10px]">
                  size=&quot;sm&quot;
                </span>
                <WaitTimeBadge waitTime={35} size="sm" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground font-mono text-[10px]">
                  size=&quot;sm&quot; 1 min
                </span>
                <WaitTimeBadge waitTime={1} size="sm" />
              </div>
            </Row>
          </Sub>

          <ComponentLabel name="QueueTypeBadge" file="components/parks/queue-type-badge.tsx" />
          <Sub title="QueueTypeBadge — all queue types">
            <Row>
              <div className="flex flex-col items-start gap-1">
                <QueueTypeBadge
                  queue={{
                    queueType: 'SINGLE_RIDER',
                    status: 'OPERATING',
                    lastUpdated: new Date().toISOString(),
                    waitTime: 20,
                  }}
                />
                <span className="text-muted-foreground font-mono text-[10px]">SINGLE_RIDER</span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <QueueTypeBadge
                  queue={{
                    queueType: 'PAID_RETURN_TIME',
                    status: 'OPERATING',
                    lastUpdated: new Date().toISOString(),
                    returnStart: null,
                    returnEnd: null,
                    price: { amount: 15, currency: 'EUR', formatted: '€15' },
                  }}
                />
                <span className="text-muted-foreground font-mono text-[10px]">
                  PAID_RETURN_TIME
                </span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <QueueTypeBadge
                  queue={{
                    queueType: 'PAID_STANDBY',
                    status: 'OPERATING',
                    lastUpdated: new Date().toISOString(),
                    waitTime: null,
                    price: { amount: 10, currency: 'EUR', formatted: '€10' },
                  }}
                />
                <span className="text-muted-foreground font-mono text-[10px]">PAID_STANDBY</span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <QueueTypeBadge
                  queue={{
                    queueType: 'RETURN_TIME',
                    status: 'OPERATING',
                    lastUpdated: new Date().toISOString(),
                    state: 'AVAILABLE',
                    returnStart: returnStart,
                    returnEnd: returnEnd,
                  }}
                />
                <span className="text-muted-foreground font-mono text-[10px]">
                  RETURN_TIME (available)
                </span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <QueueTypeBadge
                  queue={{
                    queueType: 'RETURN_TIME',
                    status: 'OPERATING',
                    lastUpdated: new Date().toISOString(),
                    state: 'FULL',
                    returnStart: null,
                    returnEnd: null,
                  }}
                />
                <span className="text-muted-foreground font-mono text-[10px]">
                  RETURN_TIME (full)
                </span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <QueueTypeBadge
                  queue={{
                    queueType: 'BOARDING_GROUP',
                    status: 'OPERATING',
                    lastUpdated: new Date().toISOString(),
                    allocationStatus: 'AVAILABLE',
                    currentGroupStart: 100,
                    currentGroupEnd: 150,
                    estimatedWait: 30,
                  }}
                />
                <span className="text-muted-foreground font-mono text-[10px]">
                  BOARDING_GROUP (available)
                </span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <QueueTypeBadge
                  queue={{
                    queueType: 'BOARDING_GROUP',
                    status: 'OPERATING',
                    lastUpdated: new Date().toISOString(),
                    allocationStatus: 'FINISHED',
                    currentGroupStart: null,
                    currentGroupEnd: null,
                    estimatedWait: null,
                  }}
                />
                <span className="text-muted-foreground font-mono text-[10px]">
                  BOARDING_GROUP (finished)
                </span>
              </div>
            </Row>
          </Sub>

          <ComponentLabel name="DistanceBadge" file="components/common/distance-badge.tsx" />
          <Sub title="DistanceBadge — size=sm (cards) / size=md (nearby)">
            <Row>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground font-mono text-[10px]">
                  size=&quot;sm&quot; number
                </span>
                <DistanceBadge distance={1200} size="sm" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground font-mono text-[10px]">
                  size=&quot;sm&quot; string
                </span>
                <DistanceBadge distance="750 m" size="sm" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground font-mono text-[10px]">
                  size=&quot;md&quot; number
                </span>
                <DistanceBadge distance={42000} size="md" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground font-mono text-[10px]">
                  size=&quot;md&quot; string
                </span>
                <DistanceBadge distance="3.2 km" size="md" />
              </div>
            </Row>
          </Sub>

          <ComponentLabel
            name="OperatingHoursDisplay"
            file="components/common/operating-hours-display.tsx"
          />
          <Sub title="OperatingHoursDisplay — with timezone (LocalTimeRange) / without (HH:mm substring)">
            <Row>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground font-mono text-[10px]">with timeZone</span>
                <span className="text-lg font-semibold tabular-nums">
                  <OperatingHoursDisplay
                    openingTime="2026-06-01T09:00:00+02:00"
                    closingTime="2026-06-01T20:00:00+02:00"
                    timeZone="Europe/Berlin"
                  />
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground font-mono text-[10px]">
                  without timeZone (calendar)
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  <OperatingHoursDisplay
                    openingTime="2026-06-01T10:00:00"
                    closingTime="2026-06-01T22:30:00"
                  />
                </span>
              </div>
            </Row>
          </Sub>
        </Section>

        {/* ================================================================
            REFRACTIVE PANELS — @hashintel/refractive experiment
        ================================================================ */}
        <Section title="Refractive Panels (@hashintel/refractive)" icon={Sparkles}>
          <Sub title="Playground — alle Parameter live">
            <RefractivePlayground />
          </Sub>

          <Separator className="my-2" />
          {/* Column headers */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-2">
              <code className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
                GlassCard variant=&quot;medium&quot;
              </code>
              <span className="text-muted-foreground text-xs">backdrop-blur-md + bg/60</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs">
                RefractivePanel
              </code>
              <span className="text-muted-foreground text-xs">
                SVG filter, radius=16 blur=3 bezel=10
              </span>
            </div>
          </div>

          {/* Row 1 — Park info */}
          <Sub title="Park-Info Panel">
            <div className="grid grid-cols-2 gap-6">
              <GlassCard variant="medium">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-bold">Phantasialand</p>
                    <p className="text-muted-foreground text-sm">Brühl · Germany</p>
                    <div className="flex gap-2 pt-1">
                      <CrowdLevelBadge level="high" />
                      <ParkStatusBadge status="OPERATING" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold tabular-nums">35</p>
                    <p className="text-muted-foreground text-xs">min avg wait</p>
                  </div>
                </div>
              </GlassCard>
              <RefractivePanel className="bg-background/40">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-bold">Phantasialand</p>
                    <p className="text-muted-foreground text-sm">Brühl · Germany</p>
                    <div className="flex gap-2 pt-1">
                      <CrowdLevelBadge level="high" />
                      <ParkStatusBadge status="OPERATING" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold tabular-nums">35</p>
                    <p className="text-muted-foreground text-xs">min avg wait</p>
                  </div>
                </div>
              </RefractivePanel>
            </div>
          </Sub>

          {/* Row 2 — Stats grid */}
          <Sub title="Stats-Grid (4 Kacheln)">
            <div className="grid grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Ø Wartezeit', value: '35', unit: 'min', icon: Clock },
                  { label: 'Auslastung', value: '67', unit: '%', icon: Users },
                  { label: 'Attraktionen', value: '38', unit: '/ 42', icon: Activity },
                  { label: 'Peak', value: '14:30', unit: 'Uhr', icon: TrendingUp },
                ].map(({ label, value, unit, icon: Icon }) => (
                  <GlassCard key={label} variant="medium" className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs font-medium">{label}</p>
                        <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
                        <p className="text-muted-foreground text-[10px]">{unit}</p>
                      </div>
                      <div className="bg-primary/15 rounded-lg p-1.5">
                        <Icon className="text-primary h-3.5 w-3.5" />
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Ø Wartezeit', value: '35', unit: 'min', icon: Clock },
                  { label: 'Auslastung', value: '67', unit: '%', icon: Users },
                  { label: 'Attraktionen', value: '38', unit: '/ 42', icon: Activity },
                  { label: 'Peak', value: '14:30', unit: 'Uhr', icon: TrendingUp },
                ].map(({ label, value, unit, icon: Icon }) => (
                  <RefractivePanel
                    key={label}
                    radius={12}
                    blur={3}
                    bezelWidth={8}
                    className="bg-background/40 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs font-medium">{label}</p>
                        <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
                        <p className="text-muted-foreground text-[10px]">{unit}</p>
                      </div>
                      <div className="bg-primary/15 rounded-lg p-1.5">
                        <Icon className="text-primary h-3.5 w-3.5" />
                      </div>
                    </div>
                  </RefractivePanel>
                ))}
              </div>
            </div>
          </Sub>

          {/* Row 3 — Attraction info */}
          <Sub title="Attraction-Zeile (Name + Wartezeit + Badges)">
            <div className="grid grid-cols-2 gap-6">
              <GlassCard variant="medium" className="p-4">
                <div className="space-y-3">
                  {[
                    {
                      name: 'Taron',
                      wait: 45,
                      status: 'OPERATING' as const,
                      crowd: 'high' as CrowdLevel,
                    },
                    {
                      name: 'Black Mamba',
                      wait: 30,
                      status: 'OPERATING' as const,
                      crowd: 'moderate' as CrowdLevel,
                    },
                    { name: 'Chiapas', wait: null, status: 'CLOSED' as const, crowd: null },
                  ].map(({ name, wait, status, crowd }) => (
                    <div key={name} className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <ParkStatusBadge status={status} />
                        <span className="truncate text-sm font-medium">{name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {crowd && <CrowdLevelBadge level={crowd} showLabel={false} />}
                        {wait !== null && (
                          <span className="text-sm font-bold tabular-nums">{wait} min</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
              <RefractivePanel
                radius={14}
                blur={3}
                bezelWidth={10}
                className="bg-background/40 p-4"
              >
                <div className="space-y-3">
                  {[
                    {
                      name: 'Taron',
                      wait: 45,
                      status: 'OPERATING' as const,
                      crowd: 'high' as CrowdLevel,
                    },
                    {
                      name: 'Black Mamba',
                      wait: 30,
                      status: 'OPERATING' as const,
                      crowd: 'moderate' as CrowdLevel,
                    },
                    { name: 'Chiapas', wait: null, status: 'CLOSED' as const, crowd: null },
                  ].map(({ name, wait, status, crowd }) => (
                    <div key={name} className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <ParkStatusBadge status={status} />
                        <span className="truncate text-sm font-medium">{name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {crowd && <CrowdLevelBadge level={crowd} showLabel={false} />}
                        {wait !== null && (
                          <span className="text-sm font-bold tabular-nums">{wait} min</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </RefractivePanel>
            </div>
          </Sub>

          {/* Row 4 — refractive variants only */}
          <Sub title="RefractivePanel Varianten (soft / standard / strong)">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'soft', radius: 8, blur: 1, bezelWidth: 5 },
                { label: 'standard', radius: 16, blur: 3, bezelWidth: 10 },
                { label: 'strong', radius: 24, blur: 6, bezelWidth: 18 },
              ].map(({ label, radius, blur, bezelWidth }) => (
                <div key={label} className="space-y-1.5">
                  <code className="text-muted-foreground font-mono text-[10px]">
                    r={radius} b={blur} bw={bezelWidth}
                  </code>
                  <RefractivePanel
                    radius={radius}
                    blur={blur}
                    bezelWidth={bezelWidth}
                    className="bg-background/40"
                  >
                    <p className="font-semibold capitalize">{label}</p>
                    <p className="text-muted-foreground text-sm">Phantasialand · 35 min avg</p>
                    <div className="mt-2 flex gap-2">
                      <CrowdLevelBadge level="high" />
                    </div>
                  </RefractivePanel>
                </div>
              ))}
            </div>
          </Sub>
        </Section>

        {/* ── Glossary Inject ─────────────────────────────────────────── */}
        <Section title="Glossary Term Inject" icon={BookOpen}>
          <ComponentLabel name="GlossaryInject" file="components/glossary/glossary-inject.tsx" />

          <Sub title="Usage — use GlossaryInject in any server component, no wrapper needed">
            <div className="bg-muted/40 rounded-lg p-4 font-mono text-xs leading-relaxed whitespace-pre">{`// any server component — self-sufficient, no provider needed
<GlossaryInject>{someTextString}</GlossaryInject>`}</div>
          </Sub>

          <Sub title="Live preview — FAQ-style answer text (hover the dashed terms)">
            <div className="max-w-2xl space-y-4 text-sm leading-relaxed">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Paragraph 1 — Planning &amp; Crowd management
              </p>
              <p>
                <GlossaryInject>
                  {`The best way to plan a theme park visit is to check the crowd calendar before you book your tickets. On a peak day you can expect wait times of 90 minutes or more for popular attractions, so arriving at rope drop makes a significant difference. A virtual queue for the newest ride is often released the moment the park opens — sometimes within seconds.`}
                </GlossaryInject>
              </p>

              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Paragraph 2 — Queue strategies
              </p>
              <p>
                <GlossaryInject>
                  {`If the posted wait time looks too long, check whether the attraction offers a single rider lane — this can cut your wait by 50–70 % on busy days. Alternatively, an express pass grants priority access and is especially worth it when crowd levels are high. On low crowd days the standby queue moves fast enough that you probably won't need either option.`}
                </GlossaryInject>
              </p>

              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Paragraph 3 — Maintenance &amp; Operations
              </p>
              <p>
                <GlossaryInject>
                  {`Attractions go into refurbishment regularly — typically during the off-peak shoulder season when crowd levels are at their lowest. Parks publish refurbishment schedules months in advance so guests can plan accordingly. A ride that is down for maintenance won't appear in the live wait time feed at all.`}
                </GlossaryInject>
              </p>
            </div>
          </Sub>

          <Sub title="Behaviour">
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              <li>
                Only the <strong>first occurrence</strong> of each term per text block is linked —
                no over-linking
              </li>
              <li>
                Terms are matched <strong>longest-first</strong> (e.g. &quot;Express Pass&quot;
                before &quot;Express&quot;)
              </li>
              <li>
                Matching is <strong>case-insensitive</strong> and respects word boundaries
              </li>
              <li>
                Fetches glossary terms via{' '}
                <code className="bg-muted rounded px-1 text-xs">getGlossaryTerms(locale)</code> —
                cached per request via React cache()
              </li>
            </ul>
          </Sub>
        </Section>
      </div>
    </div>
  );
}
