import React from 'react';
import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/common/glass-card';
import { BackgroundOverlay } from '@/components/common/background-overlay';
import { AttractionCard } from '@/components/parks/attraction-card';
import { ParkCard } from '@/components/parks/park-card';
import { ParkTimeInfo } from '@/components/parks/park-time-info';
import { WeatherCard } from '@/components/parks/weather-card';
import { ParkStatus } from '@/components/parks/park-status';
import { getServerNowMs } from '@/lib/utils/server-time';
import type { FavoriteAttraction } from '@/lib/api/favorites';
import type {
  ScheduleItem,
  WeatherData,
  WeatherHourlyToday,
  WeatherNowcast,
  ParkResponse,
} from '@/lib/api/types';
import {
  Star,
  Clock,
  Users,
  AlertTriangle,
  User,
  TrendingDown,
  PartyPopper,
  Backpack,
  MapPin,
  Sun,
} from 'lucide-react';
import { DemoBadge } from './_howto-ui';

export type MockLocale = 'de' | 'en' | 'es' | 'fr' | 'it' | 'nl';

export const CROWD_LABELS: Record<MockLocale, Record<string, string>> = {
  de: {
    very_low: 'Sehr Niedrig',
    low: 'Niedrig',
    moderate: 'Normal',
    high: 'Hoch',
    very_high: 'Sehr Hoch',
    extreme: 'Extrem',
  },
  en: {
    very_low: 'Very Low',
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    very_high: 'Very High',
    extreme: 'Extreme',
  },
  es: {
    very_low: 'Muy Bajo',
    low: 'Bajo',
    moderate: 'Moderado',
    high: 'Alto',
    very_high: 'Muy Alto',
    extreme: 'Extremo',
  },
  fr: {
    very_low: 'Très Bas',
    low: 'Bas',
    moderate: 'Modéré',
    high: 'Élevé',
    very_high: 'Très Élevé',
    extreme: 'Extrême',
  },
  it: {
    very_low: 'Molto Basso',
    low: 'Basso',
    moderate: 'Moderato',
    high: 'Alto',
    very_high: 'Molto Alto',
    extreme: 'Estremo',
  },
  nl: {
    very_low: 'Zeer Laag',
    low: 'Laag',
    moderate: 'Matig',
    high: 'Hoog',
    very_high: 'Zeer Hoog',
    extreme: 'Extreem',
  },
};

export const CROWD_COLORS: Record<string, string> = {
  very_low: 'badge-crowd-very-low',
  low: 'badge-crowd-low',
  moderate: 'badge-crowd-moderate',
  high: 'badge-crowd-high',
  very_high: 'badge-crowd-very-high',
  extreme: 'badge-crowd-extreme',
};

export const CROWD_ICONS: Record<string, React.ElementType> = {
  very_low: User,
  low: User,
  moderate: Users,
  high: Users,
  very_high: Users,
  extreme: AlertTriangle,
};

export function CrowdBadge({ level, locale }: { level: string; locale: MockLocale }) {
  const Icon = CROWD_ICONS[level] || Users;
  return (
    <DemoBadge
      color={CROWD_COLORS[level] || 'bg-muted border-border'}
      label={CROWD_LABELS[locale][level] || level}
      icon={Icon}
    />
  );
}

export async function MockParkHeader({ locale }: { locale: MockLocale }) {
  // Render the *real* park-page header components (ParkTimeInfo, WeatherCard,
  // ParkStatus) with mock data so this guide always mirrors the live UI — incl.
  // the weather nowcast badge, wind compass and temperature toggle.
  const t = await getTranslations({ locale, namespace: 'parks' });
  const tGeo = await getTranslations({ locale, namespace: 'geo' });

  const nowMs = await getServerNowMs();
  const today = new Date(nowMs);
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  const iso = (h: number, min = 0) =>
    `${dateStr}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00+02:00`;

  const todaySchedule: ScheduleItem = {
    date: dateStr,
    scheduleType: 'OPERATING',
    openingTime: iso(9),
    closingTime: iso(22),
    description: null,
    purchases: null,
    holidayName: null,
  };

  // Sunny day with a live nowcast — exactly how the real park page renders it.
  const weather: WeatherData = {
    current: {
      date: dateStr,
      dataType: 'current',
      temperatureMax: '26',
      temperatureMin: '16',
      precipitationSum: '0',
      rainSum: '0',
      snowfallSum: '0',
      weatherCode: 1,
      weatherDescription: '',
      windSpeedMax: '12',
    },
    now: {
      temperature: 21,
      apparentTemperature: 19,
      humidity: 50,
      weatherCode: 1,
      weatherDescription: '',
      isDay: true,
    },
    forecast: [
      {
        temperatureMax: '21',
        temperatureMin: '14',
        weatherCode: 1,
        windSpeedMax: '10',
        precipitationSum: '0',
      },
      {
        temperatureMax: '18',
        temperatureMin: '12',
        weatherCode: 3,
        windSpeedMax: '14',
        precipitationSum: '0',
      },
      {
        temperatureMax: '14',
        temperatureMin: '9',
        weatherCode: 63,
        windSpeedMax: '22',
        precipitationSum: '8',
      },
      {
        temperatureMax: '17',
        temperatureMin: '11',
        weatherCode: 2,
        windSpeedMax: '12',
        precipitationSum: '1.5',
      },
      {
        temperatureMax: '24',
        temperatureMin: '15',
        weatherCode: 0,
        windSpeedMax: '8',
        precipitationSum: '0',
      },
      {
        temperatureMax: '26',
        temperatureMin: '16',
        weatherCode: 0,
        windSpeedMax: '7',
        precipitationSum: '0',
      },
    ].map((d, i) => {
      const day = new Date(nowMs + (i + 1) * 86_400_000);
      return {
        date: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`,
        dataType: 'forecast' as const,
        temperatureMax: d.temperatureMax,
        temperatureMin: d.temperatureMin,
        precipitationSum: d.precipitationSum,
        rainSum: d.precipitationSum,
        snowfallSum: '0',
        weatherCode: d.weatherCode,
        weatherDescription: '',
        windSpeedMax: d.windSpeedMax,
      };
    }),
  };

  const nowcast: WeatherNowcast = {
    park: {
      id: 'phantasialand',
      name: 'Phantasialand',
      slug: 'phantasialand',
      timezone: 'Europe/Berlin',
    },
    observedAt: new Date(nowMs - 2 * 60_000).toISOString(),
    nextUpdateAt: new Date(nowMs + 13 * 60_000).toISOString(),
    currentlyRaining: false,
    currentTemperatureC: 21,
    currentApparentTemperatureC: 19,
    currentHumidity: 50,
    currentPrecipitationMm: 0,
    currentRainIntensity: null,
    currentWeatherCode: 1,
    currentWeatherDescription: '',
    isDay: true,
    temperatureMaxC: 26,
    temperatureMinC: 16,
    currentWindSpeedKmh: 12,
    currentWindDirectionDeg: 225,
    currentWindGustsKmh: 18,
    currentSnowfallCm: 0,
    currentVisibilityM: 24000,
    peakWindGustsKmh: 22,
    steps: [],
    attribution: {
      url: 'https://open-meteo.com/',
      license: 'CC-BY-4.0',
      attribution: 'Weather data by Open-Meteo.com',
    },
  };

  // Hourly day view (sunny mock): diurnal curve, dry all day. Dated "today in
  // Europe/Berlin" — the chart hides itself when the data isn't today's.
  const berlinDateStr = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(nowMs);
  const hourly: WeatherHourlyToday = {
    timezone: 'Europe/Berlin',
    points: Array.from({ length: 24 }, (_, h) => {
      const tFrac = 0.5 - 0.5 * Math.cos((((h - 5 + 24) % 24) / 24) * 2 * Math.PI);
      return {
        time: `${berlinDateStr}T${String(h).padStart(2, '0')}:00`,
        temperatureC: Math.round((16 + 10 * tFrac) * 10) / 10,
        precipitationMm: 0,
        precipitationProbability: 5,
        weatherCode: 1,
        isDay: h >= 6 && h <= 21,
      };
    }),
  };

  const park = {
    id: 'phantasialand',
    slug: 'phantasialand',
    name: 'Phantasialand',
    city: 'Brühl',
    country: 'Germany',
    continent: 'Europe',
    timezone: 'Europe/Berlin',
    status: 'OPERATING' as const,
    currentLoad: { crowdLevel: 'high' as const, baseline: 35, currentWaitTime: 45 },
    analytics: {
      occupancy: {
        current: 130,
        trend: 'stable' as const,
        comparedToTypical: 30,
        comparisonStatus: 'higher' as const,
        baseline90thPercentile: 75,
        updatedAt: new Date(nowMs).toISOString(),
      },
      statistics: {
        avgWaitTime: 45,
        avgWaitToday: 42,
        peakHour: iso(17, 30),
        peakHourSource: 'prediction' as const,
        crowdLevel: 'high' as const,
        totalAttractions: 40,
        operatingAttractions: 32,
        closedAttractions: 8,
        timestamp: new Date(nowMs).toISOString(),
        peakWaitToday: 55,
      },
    },
  } as unknown as ParkResponse;

  return (
    <div className="not-prose relative">
      {/* Hero image in its OWN clipped layer. The data cards below are deliberately
          NOT nested inside an overflow-hidden/rounded ancestor — that's the one
          structural difference from the live park page, which renders these glass
          cards over a separate fixed ParkBackground with no such wrapper. Nesting
          translucent backdrop-blur cards inside overflow-hidden + rounded makes
          their square corners bleed over the image. */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-xl border">
        <BackgroundOverlay
          imageSrc="/images/parks/phantasialand/background.jpg"
          alt="Phantasialand"
          intensity="medium"
        />
      </div>
      <div className="relative z-10 space-y-4 p-3">
        {/* Park header — GlassCard, matching the real park page */}
        <GlassCard variant="medium">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-baseline">
                <h3 className="text-2xl font-bold sm:text-3xl">Phantasialand</h3>
                <span className="text-muted-foreground ml-2 text-lg font-normal sm:text-xl">
                  – {t('h1Suffix')}
                </span>
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-3">
                <address className="flex items-center gap-1 not-italic">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  <span>Brühl</span>, <span>{tGeo('countries.germany')}</span>
                </address>
              </div>
            </div>
            <Star className="text-muted-foreground h-6 w-6 shrink-0" />
          </div>
        </GlassCard>

        {/* Schedule & Weather Row — identical layout to the park page */}
        <div className="grid gap-4 md:grid-cols-2">
          <ParkTimeInfo
            timezone="Europe/Berlin"
            schedule={[todaySchedule]}
            status="OPERATING"
            className="border-primary/10"
          />
          <WeatherCard
            weather={weather}
            nowcast={nowcast}
            timezone="Europe/Berlin"
            hourly={hourly}
            schedule={[todaySchedule]}
            className="border-primary/10"
          />
        </div>

        {/* Status grid — occupancy, wait times & attractions */}
        <ParkStatus park={park} variant="detailed" />
      </div>
    </div>
  );
}

export async function MockAttractionCards(_props: { locale: MockLocale }) {
  // Distribute 6 history points across today's park hours (10:00 → 17:30
  // Europe/Berlin) so the sparkline axis always renders a sensible daytime range,
  // independent of when the cached howto page is served.
  const today = new Date(await getServerNowMs());
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const HOUR_SLOTS = [10, 11.5, 13, 14.5, 16, 17.5] as const;
  const hist = (values: number[]) =>
    values.map((waitTime, i) => {
      const slot = HOUR_SLOTS[i] ?? 17.5;
      const h = Math.floor(slot);
      const min = Math.round((slot - h) * 60);
      return {
        timestamp: `${yyyy}-${mm}-${dd}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00+02:00`,
        waitTime,
      };
    });

  // "Beste Zeit" anchored to today's date so the card reads as a real time
  // (e.g. "Beste Zeit: 11:30").
  const bestVisitAt = (hours: number, minutes: number): string => {
    const hh = String(hours).padStart(2, '0');
    const mmStr = String(minutes).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mmStr}:00+02:00`;
  };
  const statsTimestamp = `${yyyy}-${mm}-${dd}T17:30:00+02:00`;

  const phantasialand = {
    id: 'phantasialand',
    name: 'Phantasialand',
    slug: 'phantasialand',
    timezone: 'Europe/Berlin',
    continent: 'europe',
    country: 'Germany',
    city: 'Brühl',
  } as const;

  const attractions: FavoriteAttraction[] = [
    {
      id: 'mock-taron',
      name: 'Taron',
      slug: 'taron',
      url: '/europe/germany/bruehl/phantasialand/taron',
      latitude: null,
      longitude: null,
      park: { ...phantasialand },
      queues: [
        { queueType: 'STANDBY', waitTime: 55, status: 'OPERATING' },
        { queueType: 'SINGLE_RIDER', waitTime: 10, status: 'OPERATING' },
      ],
      crowdLevel: 'high',
      statistics: {
        avgWaitToday: 42,
        peakWaitToday: 60,
        peakWaitTimestamp: null,
        minWaitToday: 15,
        typicalWaitThisHour: null,
        percentile95ThisHour: null,
        currentVsTypical: null,
        dataPoints: 6,
        history: hist([15, 22, 28, 38, 47, 55]),
        timestamp: statsTimestamp,
      },
      bestVisitTimes: [{ time: bestVisitAt(11, 30), rating: 'optimal', predictedWaitTime: 20 }],
    },
    {
      id: 'mock-black-mamba',
      name: 'Black Mamba',
      slug: 'black-mamba',
      url: '/europe/germany/bruehl/phantasialand/black-mamba',
      latitude: null,
      longitude: null,
      park: { ...phantasialand },
      queues: [{ queueType: 'STANDBY', waitTime: 12, status: 'OPERATING' }],
      crowdLevel: 'low',
      statistics: {
        avgWaitToday: 25,
        peakWaitToday: 40,
        peakWaitTimestamp: null,
        minWaitToday: 8,
        typicalWaitThisHour: null,
        percentile95ThisHour: null,
        currentVsTypical: null,
        dataPoints: 6,
        history: hist([40, 33, 26, 20, 15, 12]),
        timestamp: statsTimestamp,
      },
      bestVisitTimes: [{ time: bestVisitAt(14, 45), rating: 'optimal', predictedWaitTime: 8 }],
    },
    {
      id: 'mock-raik',
      name: 'Raik',
      slug: 'raik',
      url: '/europe/germany/bruehl/phantasialand/raik',
      latitude: null,
      longitude: null,
      park: { ...phantasialand },
      queues: [{ queueType: 'STANDBY', waitTime: 30, status: 'OPERATING' }],
      crowdLevel: 'moderate',
      statistics: {
        avgWaitToday: 30,
        peakWaitToday: 35,
        peakWaitTimestamp: null,
        minWaitToday: 25,
        typicalWaitThisHour: null,
        percentile95ThisHour: null,
        currentVsTypical: null,
        dataPoints: 6,
        history: hist([28, 32, 30, 33, 29, 30]),
        timestamp: statsTimestamp,
      },
      bestVisitTimes: null,
    },
  ];

  const backgrounds: Record<string, string> = {
    taron: '/images/parks/phantasialand/taron.jpg',
    'black-mamba': '/images/parks/phantasialand/black-mamba.jpg',
    raik: '/images/parks/phantasialand/raik.jpg',
  };

  return (
    <div className="not-prose grid [grid-auto-rows:auto_1fr_auto] gap-4 sm:grid-cols-3">
      {attractions.map((attraction) => (
        <AttractionCard
          key={attraction.id}
          attraction={attraction}
          parkStatus="OPERATING"
          backgroundImage={backgrounds[attraction.slug]}
        />
      ))}
    </div>
  );
}

export function MockShowCards() {
  const shows = [
    {
      name: 'Mia and Me – Live',
      times: ['09:00', '11:00', '13:00', '15:00'],
      nextIdx: 1,
      pastIdx: [0],
    },
    {
      name: 'F.L.Y. Pre-Show',
      times: ['10:30', '12:30', '14:30', '16:30'],
      nextIdx: 2,
      pastIdx: [0, 1],
    },
    { name: 'Mystery Castle Show', times: ['18:00'], nextIdx: 0, pastIdx: [] },
  ];
  return (
    <div className="not-prose grid gap-3 sm:grid-cols-3">
      {shows.map(({ name, times, nextIdx, pastIdx }) => (
        <Card key={name} className="relative">
          <div className="absolute top-2 right-2 z-20">
            <Star className="text-muted-foreground h-4 w-4" />
          </div>
          <CardContent className="p-4">
            <h3 className="pr-6 font-semibold">{name}</h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {times.map((time, i) => {
                const isPast = pastIdx.includes(i);
                const isNext = i === nextIdx;
                return (
                  <Badge
                    key={time}
                    variant="outline"
                    className={cn(
                      'text-xs',
                      isPast && 'line-through opacity-40',
                      isNext &&
                        'border-status-operating/40 bg-status-operating/15 text-status-operating font-semibold',
                      !isPast && !isNext && 'text-muted-foreground'
                    )}
                  >
                    {time}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export async function MockNearbyCards(_props: { locale: MockLocale }) {
  // Fixed hours (09:00 / 22:00) with today's date so the card always shows
  // clean, natural-looking times even though the page is cached for 24h.
  const now = new Date(await getServerNowMs());
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayOpening = `${yyyy}-${mm}-${dd}T09:00:00+02:00`;
  const todayClosing = `${yyyy}-${mm}-${dd}T22:00:00+02:00`;
  const futureOpening = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
  const fYyyy = futureOpening.getFullYear();
  const fMm = String(futureOpening.getMonth() + 1).padStart(2, '0');
  const fDd = String(futureOpening.getDate()).padStart(2, '0');
  const futureOpeningIso = `${fYyyy}-${fMm}-${fDd}T10:00:00+02:00`;
  const futureClosingIso = `${fYyyy}-${fMm}-${fDd}T18:00:00+02:00`;

  return (
    <div className="not-prose grid [grid-auto-rows:auto_1fr_auto] gap-4 sm:grid-cols-2">
      <ParkCard
        slug="phantasialand"
        name="Phantasialand"
        city="Brühl"
        country="Germany"
        translateCountry
        href={'/europe/germany/bruehl/phantasialand' as '/'}
        backgroundImage="/images/parks/phantasialand/background.jpg"
        status="OPERATING"
        crowdLevel="high"
        averageWaitTime={45}
        operatingAttractions={38}
        totalAttractions={42}
        distance={8400}
        timezone="Europe/Berlin"
        highlightAsNearestOpen
        hasOperatingSchedule
        todaySchedule={{
          openingTime: todayOpening,
          closingTime: todayClosing,
          scheduleType: 'OPERATING',
        }}
      />
      <ParkCard
        slug="europa-park"
        name="Europa-Park"
        city="Rust"
        country="Germany"
        translateCountry
        href={'/europe/germany/rust/europa-park' as '/'}
        backgroundImage="/images/parks/europa-park/background.jpg"
        status="CLOSED"
        distance={124000}
        timezone="Europe/Berlin"
        hasOperatingSchedule
        nextSchedule={{
          openingTime: futureOpeningIso,
          closingTime: futureClosingIso,
          scheduleType: 'OPERATING',
        }}
      />
    </div>
  );
}

interface MockCalendarDay {
  wd: [string, string];
  date: string;
  crowd: string;
  border: string;
  hours: string;
  temp: string;
  avg: number;
  tag?: 'school' | 'holiday';
  best?: boolean;
}

const CALENDAR_DAYS: MockCalendarDay[] = [
  {
    wd: ['Sa', 'Sat'],
    date: '14. Jun',
    crowd: 'extreme',
    tag: 'school',
    border: 'border-yellow-500 dark:border-yellow-400',
    hours: '09:00–22:00',
    temp: '24°C',
    avg: 72,
  },
  {
    wd: ['So', 'Sun'],
    date: '15. Jun',
    crowd: 'very_high',
    tag: 'school',
    border: 'border-yellow-500 dark:border-yellow-400',
    hours: '09:00–21:00',
    temp: '21°C',
    avg: 60,
  },
  {
    wd: ['Mo', 'Mon'],
    date: '16. Jun',
    crowd: 'low',
    border: 'border-border',
    hours: '10:00–20:00',
    temp: '20°C',
    avg: 18,
  },
  {
    wd: ['Di', 'Tue'],
    date: '17. Jun',
    crowd: 'very_low',
    border: 'border-border',
    best: true,
    hours: '10:00–19:00',
    temp: '21°C',
    avg: 10,
  },
  {
    wd: ['Mi', 'Wed'],
    date: '18. Jun',
    crowd: 'low',
    border: 'border-border',
    hours: '10:00–20:00',
    temp: '22°C',
    avg: 15,
  },
  {
    wd: ['Do', 'Thu'],
    date: '19. Jun',
    crowd: 'moderate',
    border: 'border-border',
    hours: '09:00–20:00',
    temp: '24°C',
    avg: 30,
  },
  {
    wd: ['Fr', 'Fri'],
    date: '20. Jun',
    crowd: 'high',
    tag: 'holiday',
    border: 'border-orange-500 dark:border-orange-400',
    hours: '09:00–22:00',
    temp: '26°C',
    avg: 55,
  },
];

export function MockCalendar({ locale }: { locale: MockLocale }) {
  const li = locale === 'de' ? 0 : 1;
  const bestLabel =
    locale === 'de'
      ? 'Empfohlen'
      : locale === 'es'
        ? 'Recomendado'
        : locale === 'fr'
          ? 'Recommandé'
          : locale === 'it'
            ? 'Consigliato'
            : locale === 'nl'
              ? 'Aanbevolen'
              : 'Recommended';
  const avgLabel = locale === 'de' ? 'Ø' : 'avg';

  return (
    <div className="not-prose space-y-2">
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {CALENDAR_DAYS.map(({ wd, date, crowd, tag, border, best, hours, temp, avg }) => (
          <Card key={date} className={`flex h-full flex-col gap-1 border-2 p-2 ${border}`}>
            {best && (
              <div className="flex w-full justify-center">
                <span className="flex items-center gap-1 rounded-full border border-green-500/80 bg-green-500/65 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase backdrop-blur-md dark:border-green-500/40 dark:bg-green-500/25">
                  <Star className="h-2.5 w-2.5" />
                  {bestLabel}
                </span>
              </div>
            )}
            {/* Header: weekday + date + schedule icon */}
            <div className="mb-1 flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs leading-tight font-medium">
                  {wd[li]}
                </span>
                <span className="mt-0.5 text-xs leading-tight font-semibold">{date}</span>
              </div>
              {tag === 'school' && <Backpack className="h-3.5 w-3.5 shrink-0 text-yellow-500" />}
              {tag === 'holiday' && (
                <PartyPopper className="h-3.5 w-3.5 shrink-0 text-orange-500" />
              )}
            </div>
            {/* Crowd badge */}
            <div
              className={`w-full rounded px-0.5 py-0.5 text-center text-[9px] leading-tight font-bold tracking-wide text-white uppercase ${CROWD_COLORS[crowd]}`}
            >
              {CROWD_LABELS[locale][crowd]}
            </div>
            {/* Hours */}
            <div className="text-muted-foreground flex items-center justify-center gap-1 text-[9px]">
              <Clock className="h-2.5 w-2.5" />
              <span className="hidden font-medium sm:inline">{hours}</span>
            </div>
            {/* Weather */}
            <div className="text-muted-foreground flex items-center justify-center gap-0.5 text-[9px]">
              <Sun className="h-2.5 w-2.5" />
              <span>{temp}</span>
            </div>
            {/* Avg wait */}
            <div className="text-muted-foreground text-center text-[9px]">
              {avgLabel} {avg} min
            </div>
          </Card>
        ))}
      </div>
      <p className="text-muted-foreground text-center text-[11px]">
        Phantasialand · Juni · {locale === 'de' ? 'Beispieldaten' : 'Example data'}
      </p>
    </div>
  );
}

const HOURLY_WAITS = [15, 22, 38, 55, 70, 68, 52, 40, 30, 22, 14];
const HOURLY_LABELS = ['9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h'];

export function MockHourlyChart({ locale }: { locale: MockLocale }) {
  const isDE = locale === 'de';
  const maxWait = Math.max(...HOURLY_WAITS);

  function barColor(w: number) {
    if (w < 20) return 'bg-crowd-very-low';
    if (w < 35) return 'bg-crowd-low';
    if (w < 50) return 'bg-crowd-moderate';
    if (w < 65) return 'bg-crowd-high';
    return 'bg-crowd-very-high';
  }

  return (
    <div className="not-prose bg-muted/30 rounded-xl border p-4">
      <p className="mb-4 text-sm font-semibold">
        Taron ·{' '}
        {isDE ? 'Prognostizierter Wartezeit-Verlauf (Samstag)' : 'Predicted wait times (Saturday)'}
      </p>
      {/* Value labels above bars */}
      <div className="mb-1 flex gap-1">
        {HOURLY_WAITS.map((w, i) => (
          <div
            key={HOURLY_LABELS[i]}
            className="text-muted-foreground flex-1 text-center text-[9px] leading-none"
          >
            {w}
          </div>
        ))}
      </div>
      {/* Bars: items-stretch so each column fills h-20, then justify-end pushes bar to bottom */}
      <div className="flex h-20 items-stretch gap-1">
        {HOURLY_WAITS.map((w, i) => (
          <div key={HOURLY_LABELS[i]} className="flex flex-1 flex-col justify-end">
            <div
              className={`w-full rounded-t ${barColor(w)}`}
              style={{ height: `${(w / maxWait) * 100}%` }}
            />
          </div>
        ))}
      </div>
      {/* Hour labels below */}
      <div className="mt-1 flex gap-1">
        {HOURLY_LABELS.map((h) => (
          <div key={h} className="text-muted-foreground flex-1 text-center text-[9px]">
            {h}
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-3 flex items-center gap-1 text-[11px]">
        <TrendingDown className="text-trend-down h-3.5 w-3.5 shrink-0" />
        {isDE
          ? 'Beste Slots: direkt nach Öffnung (9–10 Uhr) oder ab 18:00 Uhr'
          : 'Best slots: right at opening (9–10h) or from 18:00'}
      </p>
    </div>
  );
}

// ─── German Content ────────────────────────────────────────────────────────────
