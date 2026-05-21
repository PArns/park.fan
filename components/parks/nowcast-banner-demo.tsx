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

const inMinIso = (base: number, minutes: number) =>
  new Date(base + minutes * 60_000).toISOString();

function buildMocks(now: number): Record<string, WeatherNowcast> {
  const base = {
    park: DEMO_PARK,
    observedAt: inMinIso(now, -2),
    nextUpdateAt: inMinIso(now, 13),
    steps: [],
    attribution: DEMO_ATTRIBUTION,
  };

  return {
    storm: {
      ...base,
      currentlyRaining: true,
      currentPrecipitationMm: 1.8,
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
      hailStartsAt: null,
      hailEndsAt: null,
      stormStartsAt: inMinIso(now, 8),
      stormEndsAt: inMinIso(now, 50),
      peakWindGustsKmh: 92,
    },
    hail: {
      ...base,
      currentlyRaining: false,
      currentPrecipitationMm: 0,
      currentWeatherCode: 3,
      currentWeatherDescription: 'Overcast',
      currentWindSpeedKmh: 22,
      currentWindGustsKmh: 38,
      rainStartsAt: inMinIso(now, 6),
      rainStartsIntensityMm: 2.1,
      rainStartsIntensity: 'heavy',
      rainEndsAt: null,
      thunderstormStartsAt: inMinIso(now, 8),
      thunderstormEndsAt: inMinIso(now, 45),
      hailStartsAt: inMinIso(now, 10),
      hailEndsAt: inMinIso(now, 25),
      stormStartsAt: null,
      stormEndsAt: null,
      peakWindGustsKmh: 58,
    },
    thunderstorm: {
      ...base,
      currentlyRaining: false,
      currentPrecipitationMm: 0,
      currentWeatherCode: 2,
      currentWeatherDescription: 'Partly cloudy',
      currentWindSpeedKmh: 14,
      currentWindGustsKmh: 28,
      rainStartsAt: inMinIso(now, 15),
      rainStartsIntensityMm: 0.8,
      rainStartsIntensity: 'moderate',
      rainEndsAt: null,
      thunderstormStartsAt: inMinIso(now, 20),
      thunderstormEndsAt: inMinIso(now, 55),
      hailStartsAt: null,
      hailEndsAt: null,
      stormStartsAt: null,
      stormEndsAt: null,
      peakWindGustsKmh: 48,
    },
    rainNow: {
      ...base,
      currentlyRaining: true,
      currentPrecipitationMm: 0.6,
      currentWeatherCode: 61,
      currentWeatherDescription: 'Rain, slight intensity',
      currentWindSpeedKmh: 12,
      currentWindGustsKmh: 24,
      rainStartsAt: inMinIso(now, -25),
      rainStartsIntensityMm: 0.4,
      rainStartsIntensity: 'light',
      rainEndsAt: inMinIso(now, 35),
      thunderstormStartsAt: null,
      thunderstormEndsAt: null,
      hailStartsAt: null,
      hailEndsAt: null,
      stormStartsAt: null,
      stormEndsAt: null,
      peakWindGustsKmh: 30,
    },
    rainSoon: {
      ...base,
      currentlyRaining: false,
      currentPrecipitationMm: 0,
      currentWeatherCode: 3,
      currentWeatherDescription: 'Overcast',
      currentWindSpeedKmh: 10,
      currentWindGustsKmh: 20,
      rainStartsAt: inMinIso(now, 12),
      rainStartsIntensityMm: 0.9,
      rainStartsIntensity: 'moderate',
      rainEndsAt: null,
      thunderstormStartsAt: null,
      thunderstormEndsAt: null,
      hailStartsAt: null,
      hailEndsAt: null,
      stormStartsAt: null,
      stormEndsAt: null,
      peakWindGustsKmh: 26,
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
