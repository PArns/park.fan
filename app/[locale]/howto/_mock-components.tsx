import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/common/glass-card';
import { BackgroundOverlay } from '@/components/common/background-overlay';
import { AttractionCard } from '@/components/parks/attraction-card';
import { ParkCard } from '@/components/parks/park-card';
import { TrendIndicator } from '@/components/parks/trend-indicator';
import { WeatherForecastStrip } from '@/components/parks/weather-forecast-strip';
import type { FavoriteAttraction } from '@/lib/api/favorites';
import {
  Star,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  User,
  TrendingDown,
  PartyPopper,
  Backpack,
  Calendar,
  MapPin,
  Wind,
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

export function MockParkHeader({ locale }: { locale: MockLocale }) {
  const isDE = locale === 'de';
  const t = isDE
    ? {
        suffix: 'Aktuelle Wartezeiten',
        operating: 'GEÖFFNET',
        city: 'Brühl',
        country: 'Deutschland',
        timezone: 'Europe/Berlin',
        todaySchedule: 'Heutige Öffnungszeiten',
        openingHours: 'Öffnungszeiten',
        hours: '09:00 – 22:00',
        closingIn: 'Schließt in 6 Stunden 20 Minuten',
        currentTime: 'Aktuelle Uhrzeit',
        time: '15:40',
        weatherLabel: 'Wetter',
        weatherDesc: 'Sonnig',
        occupancyLabel: 'Auslastung',
        avgWaitLabel: 'Ø Wartezeit',
        current: 'Aktuell',
        trend: 'Trend',
        parkPeak: 'Park-Höchststand',
        peakTime: 'Stoßzeit',
        peakBadge: 'IN 1 STD. 45 MIN.',
        attractionsLabel: 'Attraktionen',
        open: 'Geöffnet',
        closed: 'Geschlossen',
        vsTypical: '30% Höher vs typisch',
        minutes: 'Minuten',
        operating2: 'in Betrieb',
      }
    : {
        suffix: 'Current Wait Times',
        operating: 'OPERATING',
        city: 'Brühl',
        country: 'Germany',
        timezone: 'Europe/Berlin',
        todaySchedule: "Today's Hours",
        openingHours: 'Opening hours',
        hours: '09:00 – 22:00',
        closingIn: 'Closes in 6 hours 20 minutes',
        currentTime: 'Current time',
        time: '3:40 PM',
        weatherLabel: 'Weather',
        weatherDesc: 'Sunny',
        occupancyLabel: 'Occupancy',
        avgWaitLabel: 'Avg. wait',
        current: 'Currently',
        trend: 'Trend',
        parkPeak: 'Park peak today',
        peakTime: 'Peak time',
        peakBadge: 'IN 1H 45M',
        attractionsLabel: 'Attractions',
        open: 'Open',
        closed: 'Closed',
        vsTypical: '30% Higher vs typical',
        minutes: 'Minutes',
        operating2: 'operating',
      };

  return (
    <div className="not-prose relative overflow-hidden rounded-xl">
      <BackgroundOverlay
        imageSrc="/images/parks/phantasialand/background.jpg"
        alt="Phantasialand"
        intensity="medium"
      />
      <div className="relative z-10 space-y-3 p-3">
        {/* Park header — GlassCard style */}
        <GlassCard>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-bold">
                  Phantasialand
                  <span className="text-muted-foreground ml-2 text-lg font-normal">
                    – {t.suffix}
                  </span>
                </h3>
                <DemoBadge color="badge-status-operating" label={t.operating} icon={Clock} />
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                <address className="flex items-center gap-1 not-italic">
                  <MapPin className="h-4 w-4" />
                  {t.city}, {t.country}
                </address>
                <Badge variant="outline" className="gap-1 font-mono text-xs">
                  <Clock className="h-3 w-3" />
                  {t.timezone}
                </Badge>
              </div>
            </div>
            <Star className="text-muted-foreground h-6 w-6 shrink-0" />
          </div>
        </GlassCard>

        {/* 2-col: opening hours + weather */}
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                {t.todaySchedule}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">{t.openingHours}</span>
                <span className="text-lg font-semibold tabular-nums">{t.hours}</span>
              </div>
              <div className="flex items-center justify-end">
                <Badge variant="secondary">{t.closingIn}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium">{t.currentTime}</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="text-primary h-4 w-4" />
                  <time className="text-lg font-bold tabular-nums">{t.time}</time>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sun className="h-4 w-4" />
                {t.weatherLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-muted rounded-full p-2">
                    <Sun className="h-8 w-8 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-3xl font-bold">21°</span>
                    <p className="text-muted-foreground text-xs">16° – 26°</p>
                    <p className="text-muted-foreground text-xs">Feels like 19°</p>
                    <p className="text-muted-foreground mt-0.5 text-sm font-medium">
                      {t.weatherDesc}
                    </p>
                  </div>
                </div>
                <div className="text-muted-foreground space-y-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span>☂</span>
                    <span>0mm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wind className="h-3 w-3" />
                    <span>12 km/h</span>
                  </div>
                </div>
              </div>
              <WeatherForecastStrip
                forecast={[
                  {
                    date: '2026-04-07',
                    dataType: 'forecast',
                    temperatureMax: '21',
                    temperatureMin: '14',
                    precipitationSum: '0',
                    rainSum: '0',
                    snowfallSum: '0',
                    weatherCode: 1,
                    weatherDescription: '',
                    windSpeedMax: '10',
                  },
                  {
                    date: '2026-04-08',
                    dataType: 'forecast',
                    temperatureMax: '18',
                    temperatureMin: '12',
                    precipitationSum: '0',
                    rainSum: '0',
                    snowfallSum: '0',
                    weatherCode: 3,
                    weatherDescription: '',
                    windSpeedMax: '14',
                  },
                  {
                    date: '2026-04-09',
                    dataType: 'forecast',
                    temperatureMax: '14',
                    temperatureMin: '9',
                    precipitationSum: '8',
                    rainSum: '8',
                    snowfallSum: '0',
                    weatherCode: 63,
                    weatherDescription: '',
                    windSpeedMax: '22',
                  },
                  {
                    date: '2026-04-10',
                    dataType: 'forecast',
                    temperatureMax: '17',
                    temperatureMin: '11',
                    precipitationSum: '1.5',
                    rainSum: '1.5',
                    snowfallSum: '0',
                    weatherCode: 2,
                    weatherDescription: '',
                    windSpeedMax: '12',
                  },
                  {
                    date: '2026-04-11',
                    dataType: 'forecast',
                    temperatureMax: '24',
                    temperatureMin: '15',
                    precipitationSum: '0',
                    rainSum: '0',
                    snowfallSum: '0',
                    weatherCode: 0,
                    weatherDescription: '',
                    windSpeedMax: '8',
                  },
                  {
                    date: '2026-04-12',
                    dataType: 'forecast',
                    temperatureMax: '26',
                    temperatureMin: '16',
                    precipitationSum: '0',
                    rainSum: '0',
                    snowfallSum: '0',
                    weatherCode: 0,
                    weatherDescription: '',
                    windSpeedMax: '7',
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        {/* 3-col: occupancy + avg wait + attractions */}
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                {t.occupancyLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CrowdBadge level="high" locale={locale} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.occupancyLabel}</span>
                <span className="font-bold">130%</span>
              </div>
              <Progress value={65} className="h-1.5" />
              <p className="text-trend-up text-xs font-medium">{t.vsTypical}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                {t.avgWaitLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.current}</span>
                <span className="text-xl font-bold">
                  45 <span className="text-muted-foreground text-sm font-normal">{t.minutes}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.trend}</span>
                <TrendIndicator trend="stable" variant="pill" label={isDE ? 'STABIL' : 'STABLE'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.parkPeak}</span>
                <span className="font-semibold">55 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.peakTime}</span>
                <DemoBadge
                  color="bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40"
                  label={t.peakBadge}
                  icon={Clock}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                {t.attractionsLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold">32</span>
                <span className="text-muted-foreground text-lg">/ 40</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">32</div>
                  <div className="text-muted-foreground text-xs">{t.open}</div>
                </div>
                <div className="bg-muted rounded-lg p-2 text-center">
                  <div className="text-lg font-bold">8</div>
                  <div className="text-muted-foreground text-xs">{t.closed}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function MockAttractionCards(_props: { locale: MockLocale }) {
  // Distribute 6 history points across today's park hours (10:00 → 17:30
  // Europe/Berlin) so the sparkline axis always renders a sensible daytime range,
  // independent of when the cached howto page is served.
  const today = new Date();
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
      url: '/europe/germany/bruhl/phantasialand/taron',
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
      url: '/europe/germany/bruhl/phantasialand/black-mamba',
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
      url: '/europe/germany/bruhl/phantasialand/raik',
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

export function MockNearbyCards(_props: { locale: MockLocale }) {
  // Fixed hours (09:00 / 22:00) with today's date so the card always shows
  // clean, natural-looking times even though the page is cached for 24h.
  const now = new Date();
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
        href={'/europe/germany/bruhl/phantasialand' as '/'}
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
