'use client';

import { useState } from 'react';
import { WeatherNowcastBanner } from '@/components/parks/weather-nowcast-banner';
import type { WeatherNowcast } from '@/lib/api/types';

const DEMO_PARK = {
  id: 'demo-park',
  name: 'Demo Park',
  slug: 'demo-park',
  timezone: 'Europe/Berlin',
};

const DEMO_ATTRIBUTION = {
  url: 'https://open-meteo.com/',
  license: 'CC-BY-4.0',
  attribution: 'Weather data by Open-Meteo.com',
};

const inMinIso = (base: number, minutes: number) => new Date(base + minutes * 60_000).toISOString();

/** Naive park-local time ("YYYY-MM-DDTHH:MM") — matches the API's step time format. */
const localIso = (base: number, minutes: number) =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: DEMO_PARK.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(base + minutes * 60_000)
    .replace(' ', 'T');

/** Build 15-min nowcast steps from a per-slot precipitation profile (mm). */
const mkSteps = (now: number, mm: number[], code: number) =>
  mm.map((p, i) => ({
    time: localIso(now, i * 15),
    precipitation: p,
    precipitationProbability: p > 0 ? Math.min(100, Math.round(45 + p * 35)) : 10,
    snowfall: 0,
    weatherCode: p > 0 ? code : 3,
    windSpeed: 14,
    windDirection: 220,
    windGusts: 28,
    visibility: p > 0 ? 4000 : 20000,
  }));

function buildMocks(now: number): Record<string, WeatherNowcast> {
  const base = {
    park: DEMO_PARK,
    observedAt: inMinIso(now, -2),
    nextUpdateAt: inMinIso(now, 13),
    isDay: true,
    currentTemperatureC: 14,
    currentApparentTemperatureC: 13,
    currentHumidity: 70,
    temperatureMaxC: 17,
    temperatureMinC: 9,
    currentRainIntensity: null,
    currentWindDirectionDeg: 220,
    currentSnowfallCm: 0,
    currentVisibilityM: 20000,
    steps: [],
    attribution: DEMO_ATTRIBUTION,
  };

  return {
    storm: {
      ...base,
      currentTemperatureC: 9,
      currentApparentTemperatureC: 5,
      currentHumidity: 94,
      temperatureMaxC: 11,
      temperatureMinC: 7,
      currentlyRaining: true,
      currentPrecipitationMm: 1.8,
      currentRainIntensity: 'heavy',
      currentWeatherCode: 95,
      currentWeatherDescription: 'Thunderstorm',
      currentWindSpeedKmh: 52,
      currentWindGustsKmh: 88,
      rainStartsAt: inMinIso(now, -10),
      rainStartsIntensityMm: 1.5,
      rainStartsIntensity: 'heavy',
      rainEndsAt: inMinIso(now, 40),
      thunderstormStartsAt: inMinIso(now, -5),
      thunderstormEndsAt: inMinIso(now, 35),
      stormStartsAt: inMinIso(now, 8),
      stormEndsAt: inMinIso(now, 50),
      peakWindGustsKmh: 92,
      steps: mkSteps(now, [1.8, 2.2, 1.5, 0.8, 0.3, 0, 0, 0], 95),
    },
    hail: {
      ...base,
      currentTemperatureC: 11,
      currentApparentTemperatureC: 9,
      currentHumidity: 86,
      temperatureMaxC: 13,
      temperatureMinC: 8,
      currentlyRaining: false,
      currentPrecipitationMm: 0,
      currentWeatherCode: 3,
      currentWeatherDescription: 'Overcast',
      currentWindSpeedKmh: 22,
      currentWindGustsKmh: 38,
      rainStartsAt: inMinIso(now, 6),
      rainStartsIntensityMm: 2.1,
      rainStartsIntensity: 'heavy',
      thunderstormStartsAt: inMinIso(now, 8),
      thunderstormEndsAt: inMinIso(now, 45),
      hailStartsAt: inMinIso(now, 10),
      hailEndsAt: inMinIso(now, 25),
      peakWindGustsKmh: 58,
      steps: mkSteps(now, [0, 0.6, 2.1, 1.8, 1.0, 0.4, 0, 0], 96),
    },
    thunderstorm: {
      ...base,
      currentTemperatureC: 15,
      currentApparentTemperatureC: 14,
      currentHumidity: 72,
      temperatureMaxC: 18,
      temperatureMinC: 10,
      currentlyRaining: false,
      currentPrecipitationMm: 0,
      currentWeatherCode: 2,
      currentWeatherDescription: 'Partly cloudy',
      currentWindSpeedKmh: 14,
      currentWindGustsKmh: 28,
      rainStartsAt: inMinIso(now, 15),
      rainStartsIntensityMm: 0.8,
      rainStartsIntensity: 'moderate',
      thunderstormStartsAt: inMinIso(now, 20),
      thunderstormEndsAt: inMinIso(now, 55),
      peakWindGustsKmh: 48,
      steps: mkSteps(now, [0, 0.5, 1.0, 1.4, 0.9, 0.4, 0, 0], 95),
    },
    rainNow: {
      ...base,
      currentTemperatureC: 12,
      currentApparentTemperatureC: 10,
      currentHumidity: 91,
      temperatureMaxC: 14,
      temperatureMinC: 8,
      currentlyRaining: true,
      currentPrecipitationMm: 0.6,
      currentRainIntensity: 'moderate',
      currentWeatherCode: 61,
      currentWeatherDescription: 'Rain, slight intensity',
      currentWindSpeedKmh: 12,
      currentWindGustsKmh: 24,
      rainStartsAt: inMinIso(now, -25),
      rainStartsIntensityMm: 0.4,
      rainStartsIntensity: 'light',
      rainEndsAt: inMinIso(now, 35),
      peakWindGustsKmh: 30,
      steps: mkSteps(now, [0.6, 0.9, 1.2, 0.7, 0.3, 0, 0, 0], 61),
    },
    rainSoon: {
      ...base,
      currentTemperatureC: 13,
      currentApparentTemperatureC: 12,
      currentHumidity: 80,
      temperatureMaxC: 16,
      temperatureMinC: 9,
      currentlyRaining: false,
      currentPrecipitationMm: 0,
      currentWeatherCode: 3,
      currentWeatherDescription: 'Overcast',
      currentWindSpeedKmh: 10,
      currentWindGustsKmh: 20,
      rainStartsAt: inMinIso(now, 12),
      rainStartsIntensityMm: 0.9,
      rainStartsIntensity: 'moderate',
      peakWindGustsKmh: 26,
      steps: mkSteps(now, [0, 0, 0.4, 0.8, 1.1, 0.6, 0.2, 0], 61),
    },
  };
}

/**
 * Demo wrapper for the /ui showcase. Builds the mock timestamps on mount so
 * they're always fresh (the page itself may be statically generated).
 */
export function NowcastBannerDemo() {
  const [mocks] = useState(() => buildMocks(Date.now()));

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <WeatherNowcastBanner
        continent="demo"
        country="demo"
        city="demo"
        parkSlug="storm"
        initialData={mocks.storm}
        enabled={false}
      />
      <WeatherNowcastBanner
        continent="demo"
        country="demo"
        city="demo"
        parkSlug="hail"
        initialData={mocks.hail}
        enabled={false}
      />
      <WeatherNowcastBanner
        continent="demo"
        country="demo"
        city="demo"
        parkSlug="thunderstorm"
        initialData={mocks.thunderstorm}
        enabled={false}
      />
      <WeatherNowcastBanner
        continent="demo"
        country="demo"
        city="demo"
        parkSlug="rain-now"
        initialData={mocks.rainNow}
        enabled={false}
      />
      <WeatherNowcastBanner
        continent="demo"
        country="demo"
        city="demo"
        parkSlug="rain-soon"
        initialData={mocks.rainSoon}
        enabled={false}
      />
      <div className="text-muted-foreground bg-muted/40 flex items-center justify-center rounded-xl border border-dashed p-4 text-center text-xs">
        Clear weather → banner renders nothing.
      </div>
    </div>
  );
}
