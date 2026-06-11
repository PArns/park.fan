'use client';

import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { WeatherCard } from '@/components/parks/weather-card';
import { ParkTimeInfo } from '@/components/parks/park-time-info';
import type {
  WeatherData,
  WeatherDay,
  WeatherHourlyToday,
  WeatherNowcast,
  ScheduleItem,
} from '@/lib/api/types';
import { FORECAST_TEMPLATE, VARIANT_CURRENT, type Variant } from './weather-card-demo-data';

function buildWeather(today: Date, variant: Variant): WeatherData {
  const v = VARIANT_CURRENT[variant];
  const forecast: WeatherDay[] = FORECAST_TEMPLATE.map((day, i) => ({
    ...day,
    date: format(addDays(today, i + 1), 'yyyy-MM-dd'),
    dataType: 'forecast' as const,
  }));
  const { now, ...current } = v;
  return {
    current: {
      ...current,
      date: format(today, 'yyyy-MM-dd'),
      dataType: 'current' as const,
    },
    now,
    forecast,
  };
}

function buildTodaySchedule(today: Date): ScheduleItem {
  const opening = new Date(today);
  opening.setHours(9, 0, 0, 0);
  const closing = new Date(today);
  closing.setHours(20, 0, 0, 0);
  return {
    date: format(today, 'yyyy-MM-dd'),
    openingTime: opening.toISOString(),
    closingTime: closing.toISOString(),
    scheduleType: 'OPERATING',
    description: null,
    purchases: null,
    holidayName: null,
  };
}

function buildNowcastFor(variant: Variant, now: number): WeatherNowcast | null {
  const iso = (offsetMin: number) => new Date(now + offsetMin * 60_000).toISOString();
  const base = {
    park: { id: 'demo-park', name: 'Demo Park', slug: 'demo-park', timezone: 'Europe/Berlin' },
    observedAt: iso(-2),
    nextUpdateAt: iso(13),
    isDay: true,
    steps: [],
    attribution: {
      url: 'https://open-meteo.com/',
      license: 'CC-BY-4.0',
      attribution: 'Weather data by Open-Meteo.com',
    },
  };

  switch (variant) {
    case 'sunny':
      return {
        ...base,
        currentTemperatureC: 16,
        currentApparentTemperatureC: 15,
        currentHumidity: 48,
        temperatureMaxC: 19,
        temperatureMinC: 10,
        currentlyRaining: false,
        currentPrecipitationMm: 0,
        currentWeatherCode: 0,
        currentWeatherDescription: 'Clear sky',
        currentWindSpeedKmh: 8,
        currentWindGustsKmh: 14,
        currentWindDirectionDeg: 225,
        currentSnowfallCm: 0,
        currentVisibilityM: 24140,
        currentRainIntensity: null,
        peakWindGustsKmh: 18,
      };
    case 'rainy':
      return {
        ...base,
        currentTemperatureC: 9,
        currentApparentTemperatureC: 6,
        currentHumidity: 92,
        temperatureMaxC: 11,
        temperatureMinC: 7,
        currentlyRaining: true,
        currentPrecipitationMm: 0.8,
        currentWeatherCode: 63,
        currentWeatherDescription: 'Moderate rain',
        currentWindSpeedKmh: 20,
        currentWindGustsKmh: 32,
        currentWindDirectionDeg: 200,
        currentSnowfallCm: 0,
        currentVisibilityM: 5200,
        currentRainIntensity: 'moderate',
        rainStartsAt: iso(-18),
        rainStartsIntensityMm: 0.6,
        rainStartsIntensity: 'moderate',
        rainEndsAt: iso(25),
        peakWindGustsKmh: 38,
      };
    case 'stormy':
      return {
        ...base,
        currentTemperatureC: 7,
        currentApparentTemperatureC: 2,
        currentHumidity: 96,
        temperatureMaxC: 9,
        temperatureMinC: 5,
        currentlyRaining: true,
        currentPrecipitationMm: 2.4,
        currentWeatherCode: 95,
        currentWeatherDescription: 'Thunderstorm',
        currentWindSpeedKmh: 48,
        currentWindGustsKmh: 82,
        currentWindDirectionDeg: 250,
        currentSnowfallCm: 0,
        currentVisibilityM: 2400,
        currentRainIntensity: 'heavy',
        rainStartsAt: iso(-12),
        rainStartsIntensityMm: 1.8,
        rainStartsIntensity: 'heavy',
        rainEndsAt: iso(45),
        thunderstormStartsAt: iso(-8),
        thunderstormEndsAt: iso(40),
        stormStartsAt: iso(-2),
        stormEndsAt: iso(35),
        peakWindGustsKmh: 95,
      };
    case 'snowy':
      return {
        ...base,
        isDay: true,
        currentTemperatureC: -3,
        currentApparentTemperatureC: -8,
        currentHumidity: 88,
        temperatureMaxC: -1,
        temperatureMinC: -6,
        currentlyRaining: false,
        currentPrecipitationMm: 0.5,
        currentRainIntensity: null,
        currentWeatherCode: 73,
        currentWeatherDescription: 'Moderate snow',
        currentWindSpeedKmh: 16,
        currentWindDirectionDeg: 340,
        currentWindGustsKmh: 30,
        currentSnowfallCm: 0.8,
        currentVisibilityM: 1200,
        peakWindGustsKmh: 34,
      };
    case 'fog':
      return {
        ...base,
        isDay: false,
        currentTemperatureC: 4,
        currentApparentTemperatureC: 3,
        currentHumidity: 97,
        temperatureMaxC: 6,
        temperatureMinC: 3,
        currentlyRaining: false,
        currentPrecipitationMm: 0,
        currentRainIntensity: null,
        currentWeatherCode: 45,
        currentWeatherDescription: 'Fog',
        currentWindSpeedKmh: 4,
        currentWindDirectionDeg: 90,
        currentWindGustsKmh: 9,
        currentSnowfallCm: 0,
        currentVisibilityM: 400,
        peakWindGustsKmh: 12,
      };
    default:
      return null; // partly: no nowcast badge
  }
}

/** "Today" in the demo park's timezone — the hourly chart hides itself otherwise. */
function berlinDateStr(now: number): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

interface HourlyVariantConfig {
  tMin: number;
  tMax: number;
  dryCode: number;
  rain: { from: number; to: number; peakMm: number; code: number } | null;
}

const HOURLY_VARIANTS: Partial<Record<Variant, HourlyVariantConfig>> = {
  sunny: { tMin: 10, tMax: 19, dryCode: 1, rain: null },
  rainy: { tMin: 7, tMax: 11, dryCode: 3, rain: { from: 11, to: 18, peakMm: 1.2, code: 63 } },
  stormy: { tMin: 5, tMax: 9, dryCode: 3, rain: { from: 13, to: 20, peakMm: 3.2, code: 95 } },
};

/** Deterministic hourly day data so the showcase renders the day-view chart offline. */
function buildHourlyFor(variant: Variant, now: number): WeatherHourlyToday | null {
  const cfg = HOURLY_VARIANTS[variant];
  if (!cfg) return null;
  const dateStr = berlinDateStr(now);
  const points = Array.from({ length: 24 }, (_, h) => {
    // Diurnal curve: coolest around 05:00, warmest around 17:00.
    const tFrac = 0.5 - 0.5 * Math.cos((((h - 5 + 24) % 24) / 24) * 2 * Math.PI);
    const rain = cfg.rain;
    const rainFrac =
      rain && h >= rain.from && h <= rain.to
        ? Math.sin(((h - rain.from) / (rain.to - rain.from)) * Math.PI)
        : 0;
    const mm = rain ? Math.round(rain.peakMm * rainFrac * 10) / 10 : 0;
    return {
      time: `${dateStr}T${String(h).padStart(2, '0')}:00`,
      temperatureC: Math.round((cfg.tMin + (cfg.tMax - cfg.tMin) * tFrac) * 10) / 10,
      precipitationMm: mm,
      precipitationProbability: mm > 0 ? Math.round(60 + 35 * rainFrac) : 15,
      weatherCode: mm > 0 ? cfg.rain!.code : cfg.dryCode,
      isDay: h >= 6 && h <= 21,
    };
  });
  return { timezone: 'Europe/Berlin', points };
}

/** Today's park hours (Berlin-fixed) for the opening-hours band on the chart. */
function buildChartSchedule(now: number): ScheduleItem[] {
  const dateStr = berlinDateStr(now);
  return [
    {
      date: dateStr,
      scheduleType: 'OPERATING',
      openingTime: `${dateStr}T09:00:00+02:00`,
      closingTime: `${dateStr}T20:00:00+02:00`,
      description: null,
      purchases: null,
      holidayName: null,
    },
  ];
}

function buildScheduleForOffset(
  today: Date,
  dayOffset: number,
  openHour: number,
  closeHour: number,
  tzOffsetSuffix: string
): ScheduleItem {
  const dateStr = format(addDays(today, dayOffset), 'yyyy-MM-dd');
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: dateStr,
    openingTime: `${dateStr}T${pad(openHour)}:00:00${tzOffsetSuffix}`,
    closingTime: `${dateStr}T${pad(closeHour)}:00:00${tzOffsetSuffix}`,
    scheduleType: 'OPERATING',
    description: null,
    purchases: null,
    holidayName: null,
  };
}

/**
 * Standalone ParkTimeInfo showcase: builds today's schedule with proper ISO
 * timestamps so the live "opens in / closes in" countdown actually renders.
 */
export function ParkTimeInfoShowcase() {
  const [today] = useState(() => new Date());

  return (
    <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
      <ParkTimeInfo
        timezone="Europe/Berlin"
        schedule={[buildScheduleForOffset(today, 0, 9, 22, '+01:00')]}
      />
      <ParkTimeInfo
        timezone="America/New_York"
        schedule={[buildScheduleForOffset(today, 0, 9, 20, '-05:00')]}
        nextSchedule={buildScheduleForOffset(today, 1, 9, 20, '-05:00')}
      />
    </div>
  );
}

interface WeatherCardShowcaseProps {
  /** Render the "As seen on Park Page" (Schedule + Weather, glass on hero bg) variant. */
  variant: 'glass-pair' | 'conditions-grid';
}

export function WeatherCardShowcase({ variant }: WeatherCardShowcaseProps) {
  const [{ today, mountedAt }] = useState(() => ({ today: new Date(), mountedAt: Date.now() }));

  if (variant === 'glass-pair') {
    return (
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
            schedule={[buildTodaySchedule(today)]}
          />
          <WeatherCard
            weather={buildWeather(today, 'sunny')}
            nowcast={buildNowcastFor('sunny', mountedAt)}
            timezone="Europe/Berlin"
            hourly={buildHourlyFor('sunny', mountedAt)}
            schedule={buildChartSchedule(mountedAt)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <WeatherCard weather={buildWeather(today, 'partly')} />
      <WeatherCard
        weather={buildWeather(today, 'rainy')}
        nowcast={buildNowcastFor('rainy', mountedAt)}
        timezone="Europe/Berlin"
        hourly={buildHourlyFor('rainy', mountedAt)}
      />
      <WeatherCard
        weather={buildWeather(today, 'stormy')}
        nowcast={buildNowcastFor('stormy', mountedAt)}
        timezone="Europe/Berlin"
        hourly={buildHourlyFor('stormy', mountedAt)}
      />
      <WeatherCard weather={buildWeather(today, 'snowy')} />
      <WeatherCard weather={buildWeather(today, 'fog')} />
    </div>
  );
}
