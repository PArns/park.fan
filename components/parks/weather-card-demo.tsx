'use client';

import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { WeatherCard } from '@/components/parks/weather-card';
import { ParkTimeInfo } from '@/components/parks/park-time-info';
import type { WeatherData, WeatherDay, ScheduleItem } from '@/lib/api/types';

const FORECAST_TEMPLATE: Omit<WeatherDay, 'date' | 'dataType'>[] = [
  { temperatureMax: '15', temperatureMin: '7', precipitationSum: '0', rainSum: '0', snowfallSum: '0', weatherCode: 1, weatherDescription: 'Mainly clear', windSpeedMax: '10' },
  { temperatureMax: '12', temperatureMin: '6', precipitationSum: '3', rainSum: '3', snowfallSum: '0', weatherCode: 61, weatherDescription: 'Rain', windSpeedMax: '18' },
  { temperatureMax: '16', temperatureMin: '8', precipitationSum: '0', rainSum: '0', snowfallSum: '0', weatherCode: 2, weatherDescription: 'Partly cloudy', windSpeedMax: '12' },
  { temperatureMax: '19', temperatureMin: '10', precipitationSum: '0', rainSum: '0', snowfallSum: '0', weatherCode: 0, weatherDescription: 'Clear sky', windSpeedMax: '8' },
  { temperatureMax: '11', temperatureMin: '5', precipitationSum: '8', rainSum: '8', snowfallSum: '0', weatherCode: 63, weatherDescription: 'Moderate rain', windSpeedMax: '25' },
  { temperatureMax: '14', temperatureMin: '7', precipitationSum: '0', rainSum: '0', snowfallSum: '0', weatherCode: 3, weatherDescription: 'Overcast', windSpeedMax: '15' },
  { temperatureMax: '17', temperatureMin: '9', precipitationSum: '0', rainSum: '0', snowfallSum: '0', weatherCode: 1, weatherDescription: 'Mainly clear', windSpeedMax: '12' },
  { temperatureMax: '18', temperatureMin: '10', precipitationSum: '0', rainSum: '0', snowfallSum: '0', weatherCode: 0, weatherDescription: 'Clear sky', windSpeedMax: '10' },
  { temperatureMax: '13', temperatureMin: '7', precipitationSum: '4', rainSum: '4', snowfallSum: '0', weatherCode: 80, weatherDescription: 'Showers', windSpeedMax: '20' },
  { temperatureMax: '10', temperatureMin: '4', precipitationSum: '2', rainSum: '2', snowfallSum: '0', weatherCode: 71, weatherDescription: 'Snow', windSpeedMax: '15' },
  { temperatureMax: '12', temperatureMin: '5', precipitationSum: '0', rainSum: '0', snowfallSum: '0', weatherCode: 2, weatherDescription: 'Partly cloudy', windSpeedMax: '10' },
  { temperatureMax: '15', temperatureMin: '7', precipitationSum: '0', rainSum: '0', snowfallSum: '0', weatherCode: 1, weatherDescription: 'Mainly clear', windSpeedMax: '8' },
  { temperatureMax: '18', temperatureMin: '9', precipitationSum: '0', rainSum: '0', snowfallSum: '0', weatherCode: 0, weatherDescription: 'Clear sky', windSpeedMax: '12' },
  { temperatureMax: '16', temperatureMin: '8', precipitationSum: '1', rainSum: '1', snowfallSum: '0', weatherCode: 51, weatherDescription: 'Drizzle', windSpeedMax: '14' },
  { temperatureMax: '14', temperatureMin: '6', precipitationSum: '0', rainSum: '0', snowfallSum: '0', weatherCode: 3, weatherDescription: 'Overcast', windSpeedMax: '16' },
  { temperatureMax: '19', temperatureMin: '11', precipitationSum: '0', rainSum: '0', snowfallSum: '0', weatherCode: 0, weatherDescription: 'Clear sky', windSpeedMax: '10' },
];

type Variant = 'sunny' | 'partly' | 'rainy' | 'stormy' | 'snowy' | 'fog';

const VARIANT_CURRENT: Record<
  Variant,
  Omit<WeatherDay, 'date' | 'dataType'> & {
    now: { temperature: number; apparentTemperature: number; humidity: number; weatherCode: number; weatherDescription: string; isDay: boolean };
  }
> = {
  sunny: {
    temperatureMax: '18', temperatureMin: '9', precipitationSum: '0', rainSum: '0', snowfallSum: '0',
    weatherCode: 0, weatherDescription: 'Clear sky', windSpeedMax: '12',
    now: { temperature: 15, apparentTemperature: 14, humidity: 48, weatherCode: 0, weatherDescription: 'Clear sky', isDay: true },
  },
  partly: {
    temperatureMax: '14', temperatureMin: '8', precipitationSum: '2', rainSum: '2', snowfallSum: '0',
    weatherCode: 2, weatherDescription: 'Partly cloudy', windSpeedMax: '18',
    now: { temperature: 11, apparentTemperature: 9, humidity: 62, weatherCode: 2, weatherDescription: 'Partly cloudy', isDay: true },
  },
  rainy: {
    temperatureMax: '10', temperatureMin: '6', precipitationSum: '14', rainSum: '14', snowfallSum: '0',
    weatherCode: 63, weatherDescription: 'Moderate rain', windSpeedMax: '28',
    now: { temperature: 8, apparentTemperature: 5, humidity: 91, weatherCode: 63, weatherDescription: 'Moderate rain', isDay: true },
  },
  stormy: {
    temperatureMax: '8', temperatureMin: '4', precipitationSum: '25', rainSum: '25', snowfallSum: '0',
    weatherCode: 95, weatherDescription: 'Thunderstorm', windSpeedMax: '55',
    now: { temperature: 6, apparentTemperature: 1, humidity: 96, weatherCode: 95, weatherDescription: 'Thunderstorm', isDay: true },
  },
  snowy: {
    temperatureMax: '-1', temperatureMin: '-6', precipitationSum: '8', rainSum: '0', snowfallSum: '8',
    weatherCode: 73, weatherDescription: 'Moderate snow', windSpeedMax: '20',
    now: { temperature: -3, apparentTemperature: -8, humidity: 85, weatherCode: 73, weatherDescription: 'Moderate snow', isDay: true },
  },
  fog: {
    temperatureMax: '6', temperatureMin: '3', precipitationSum: '0', rainSum: '0', snowfallSum: '0',
    weatherCode: 45, weatherDescription: 'Fog', windSpeedMax: '5',
    now: { temperature: 4, apparentTemperature: 3, humidity: 97, weatherCode: 45, weatherDescription: 'Fog', isDay: false },
  },
};

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
        todaySchedule={buildScheduleForOffset(today, 0, 9, 22, '+01:00')}
      />
      <ParkTimeInfo
        timezone="America/New_York"
        todaySchedule={buildScheduleForOffset(today, 0, 9, 20, '-05:00')}
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
  const [today] = useState(() => new Date());

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
            todaySchedule={buildTodaySchedule(today)}
          />
          <WeatherCard weather={buildWeather(today, 'sunny')} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <WeatherCard weather={buildWeather(today, 'partly')} />
      <WeatherCard weather={buildWeather(today, 'rainy')} />
      <WeatherCard weather={buildWeather(today, 'stormy')} />
      <WeatherCard weather={buildWeather(today, 'snowy')} />
      <WeatherCard weather={buildWeather(today, 'fog')} />
    </div>
  );
}
