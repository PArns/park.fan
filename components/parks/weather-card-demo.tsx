'use client';

import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { WeatherCard } from '@/components/parks/weather-card';
import { ParkTimeInfo } from '@/components/parks/park-time-info';
import type { WeatherData, WeatherDay, WeatherNowcast, ScheduleItem } from '@/lib/api/types';
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
      />
      <WeatherCard
        weather={buildWeather(today, 'stormy')}
        nowcast={buildNowcastFor('stormy', mountedAt)}
      />
      <WeatherCard weather={buildWeather(today, 'snowy')} />
      <WeatherCard weather={buildWeather(today, 'fog')} />
    </div>
  );
}
