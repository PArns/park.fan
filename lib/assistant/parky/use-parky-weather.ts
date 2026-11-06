'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { pickRandom } from '@/lib/utils/pick-random';
import { formatTempWithUnit } from '@/lib/utils/temperature';
import { useTemperatureUnit } from '@/lib/contexts/temperature-unit-context';
import { useWeatherNowcast } from '@/lib/hooks/use-weather-nowcast';
import { parkPageOf, parkPathOf } from './easter-eggs';
import { WEATHER_ACT, weatherLook, type ParkyWeather } from './look';
import {
  answeredWithLine,
  countAnswer,
  countReaction,
  linesMuted,
  reactionsShown,
  REACTIONS_PER_SESSION,
} from '../teaser-store';
import { setParkyWeather } from './use-parky-look';

/** What Parky says about the park's weather, with `{park}` and, where it fits, `{temp}`. */
const WEATHER_LINE_KEYS: Record<ParkyWeather, readonly string[]> = {
  rain: ['weatherRain1', 'weatherRain2', 'weatherRain3'],
  storm: ['weatherStorm1', 'weatherStorm2'],
  snow: ['weatherSnow1', 'weatherSnow2', 'weatherSnow3'],
  cold: ['weatherCold1', 'weatherCold2', 'weatherCold3'],
  windy: ['weatherWindy1', 'weatherWindy2'],
  fog: ['weatherFog1', 'weatherFog2'],
  hot: ['weatherHot1', 'weatherHot2', 'weatherHot3'],
};

/** After the page has settled: past the park's own line and the first invitation. */
const WEATHER_LINE_DELAY_MS = 12_000;
/** Over another line, a sleeping Parky or an open search, it tries again this much later. */
const RETRY_MS = 5_000;

const noPark = { continent: '', country: '', city: '', parkSlug: '' };

/**
 * Parky and the weather at the park whose page this is: he dresses for it while the page shows
 * (`setParkyWeather`), and once a park per session, after the page has settled and never over
 * another line, he plays a fitting act and says a `weather` line. The weather is the nowcast the
 * page has already loaded, read from React Query's cache, so it costs no request of its own. The
 * line counts against the session's reactions and stays away once lines were closed by hand.
 */
export function useParkyWeather({
  entering,
  busy,
  say,
  act,
}: {
  /** An entrance is under way: no line until Parky has landed. */
  entering: boolean;
  /** Whether a line now would interrupt something. */
  busy: () => boolean;
  say: (text: string) => void;
  act: (act: (typeof WEATHER_ACT)[ParkyWeather]) => void;
}): void {
  const t = useTranslations('assistant');
  const { unit } = useTemperatureUnit();
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

  useEffect(() => {
    setParkyWeather(weather);
    return () => setParkyWeather(null);
  }, [weather]);

  const latest = useRef({ busy, say, act });
  useEffect(() => {
    latest.current = { busy, say, act };
  });
  const path = target ? parkPathOf(pathname) : null;
  const park = nowcast?.park.name ?? '';
  const temperature = nowcast?.currentTemperatureC ?? null;
  useEffect(() => {
    if (!weather || !path || entering) return;
    const kind = `weather:${path}`;
    if (linesMuted() || answeredWithLine(kind)) return;
    let timer: ReturnType<typeof setTimeout>;
    const attempt = (wait: number) => {
      timer = setTimeout(() => {
        if (latest.current.busy()) return attempt(RETRY_MS);
        if (linesMuted() || answeredWithLine(kind)) return;
        if (reactionsShown() >= REACTIONS_PER_SESSION) return;
        countAnswer(kind);
        countReaction();
        latest.current.act(WEATHER_ACT[weather]);
        const temp = temperature === null ? '' : formatTempWithUnit(temperature, unit);
        latest.current.say(t(pickRandom(WEATHER_LINE_KEYS[weather]), { park, temp }));
      }, wait);
    };
    attempt(WEATHER_LINE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [weather, path, entering, park, temperature, unit, t]);
}
