'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { LiveParkSnapshot } from '@/lib/api/parks';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { useWeatherNowcast } from '@/lib/hooks/use-weather-nowcast';
import { parkPageOf } from './easter-eggs';
import { showRunning } from './live';
import { weatherLook } from './look';
import { setParkyShow, setParkyWeather } from './use-parky-look';

const noPark = { continent: '', country: '', city: '', parkSlug: '' };

/** The weather at the park whose page this is, from the nowcast the page has already loaded. */
export function useParkWeather() {
  const pathname = usePathname();
  const target = parkPageOf(pathname);
  const { data } = useWeatherNowcast({ ...(target ?? noPark), enabled: false });
  const nowcast = target ? data : null;
  const weather = nowcast
    ? weatherLook({
        code: nowcast.currentWeatherCode,
        temperatureC: nowcast.currentTemperatureC,
        windKmh: nowcast.currentWindSpeedKmh,
        gustsKmh: nowcast.currentWindGustsKmh,
      })
    : null;
  return { pathname, nowcast, weather };
}

/**
 * Dresses every Parky for the weather at the park whose page this is (`setParkyWeather`). The
 * launcher calls it, not the teaser: the teaser leaves while the chat window is open, and the
 * scarf must not leave with it.
 */
export function useParkyWeatherLook(): void {
  const { weather } = useParkWeather();
  useEffect(() => {
    setParkyWeather(weather);
    return () => setParkyWeather(null);
  }, [weather]);
}

/**
 * Whether one of the shows of the park whose page this is is on (`setParkyShow`), checked again
 * with every poll of the page. The launcher calls it, so the clapping stays while the chat window
 * is open and the teaser is gone.
 */
export function useParkyShowLook(): void {
  const pathname = usePathname();
  const target = parkPageOf(pathname);
  const { data } = useLiveParkData({ ...(target ?? noPark), enabled: false });
  const park = target ? (data as unknown as LiveParkSnapshot | undefined) : undefined;
  useEffect(() => {
    setParkyShow(!!park && showRunning(park, Date.now()));
    return () => setParkyShow(false);
  }, [park]);
}
