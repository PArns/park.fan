'use client';

import { useTranslations } from 'next-intl';
import { Cloud, ExternalLink } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WeatherForecastStrip } from './weather-forecast-strip';
import { NowcastUpdateCountdown } from './nowcast-update-countdown';
import { WeatherBackground } from './weather-background';
import { TemperatureUnitToggle } from '@/components/common/temperature-unit-toggle';
import { useTemperatureUnit } from '@/lib/contexts/temperature-unit-context';
import { formatTemp, formatWindSpeed, formatPrecip } from '@/lib/utils/temperature';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import type { WeatherData, WeatherDay, WeatherNowcast } from '@/lib/api/types';

interface WeatherCardProps {
  weather: WeatherData;
  forecast?: WeatherDay[];
  /** Optional live nowcast: overrides icon/description with current observed conditions. */
  nowcast?: WeatherNowcast | null;
  className?: string;
}

export function WeatherCard({ weather, forecast, nowcast, className }: WeatherCardProps) {
  const t = useTranslations('parks.weather');
  const tParks = useTranslations('parks');
  const { unit } = useTemperatureUnit();

  if (!weather.current) return null;

  const current = weather.current;
  const now = weather.now ?? null;

  // Nowcast (~15 min freshness) wins over the daily "now" snapshot, which can be hours old.
  // It now also carries temperature, apparent-temperature, min/max, and isDay — so when a
  // nowcast is supplied the entire "current" block is sourced from it.
  const isDay = nowcast?.isDay ?? now?.isDay ?? true;
  const weatherCode =
    nowcast?.currentWeatherCode ?? now?.weatherCode ?? current.weatherCode;
  const { icon: WeatherIcon, label, color } = getWeatherConfig(weatherCode, isDay);

  const liveTemp = nowcast?.currentTemperatureC ?? null;
  const liveFeels = nowcast?.currentApparentTemperatureC ?? null;
  const liveMax = nowcast?.temperatureMaxC ?? null;
  const liveMin = nowcast?.temperatureMinC ?? null;

  const displayTempC =
    liveTemp ?? now?.temperature ?? parseFloat(current.temperatureMax);
  const feelsLikeC = liveFeels ?? now?.apparentTemperature ?? null;
  const tempMaxC = liveMax ?? parseFloat(current.temperatureMax);
  const tempMinC = liveMin ?? parseFloat(current.temperatureMin);

  // Prefer live nowcast wind when available; fall back to daily max.
  const windKmh =
    nowcast?.currentWindSpeedKmh ?? parseFloat(current.windSpeedMax || '0');

  // Live precip is the 15-min slot intensity; daily precipitationSum is total. Show the live
  // value when nowcast says it's actively precipitating so the card reflects "right now".
  const liveRaining = nowcast?.currentlyRaining ?? false;
  const livePrecip = nowcast?.currentPrecipitationMm ?? null;
  const showLivePrecip = liveRaining && livePrecip != null && livePrecip > 0;
  const precipMm = showLivePrecip ? livePrecip! : parseFloat(current.precipitationSum || '0');

  const displayTemp = formatTemp(displayTempC, unit);
  const feelsLike = feelsLikeC != null ? formatTemp(feelsLikeC, unit) : null;
  const tempMax = formatTemp(tempMaxC, unit);
  const tempMin = formatTemp(tempMinC, unit);

  return (
    <div
      className={cn(
        'relative isolate min-w-0 overflow-hidden overflow-x-clip rounded-xl border shadow-sm',
        className
      )}
    >
      <WeatherBackground
        code={weatherCode}
        isDay={isDay}
        glass
        glassBlur={2}
        glassOpacity={0.4}
      />
      <div className="relative z-10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <WeatherIcon className={`h-4 w-4 ${color}`} />
            {tParks('weatherLabel')}
            {nowcast && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span
                    className="bg-emerald-500/50 absolute inline-flex h-full w-full animate-ping rounded-full"
                    aria-hidden="true"
                  />
                  <span className="bg-emerald-500 relative inline-flex h-1.5 w-1.5 rounded-full" />
                </span>
                {t('liveLabel')}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {nowcast?.nextUpdateAt && (
              <NowcastUpdateCountdown
                nextUpdateAt={nowcast.nextUpdateAt}
                className="text-muted-foreground/70 m-0"
              />
            )}
            <TemperatureUnitToggle />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-muted rounded-full p-2">
              <WeatherIcon className={`h-8 w-8 ${color}`} />
            </div>
            <div>
              <span className="text-3xl font-bold">{displayTemp}</span>
              <p className="text-muted-foreground text-xs">
                {tempMin} – {tempMax}
              </p>
              {feelsLike !== null && feelsLike !== displayTemp && (
                <p className="text-muted-foreground text-xs">
                  {t('feelsLike')} {feelsLike}
                </p>
              )}
              <p className="text-muted-foreground mt-0.5 text-sm font-medium">{t(label)}</p>
            </div>
          </div>

          <div className="text-muted-foreground space-y-0.5 text-right text-xs">
            <div>
              <span className="opacity-70">{t('precipLabel')}: </span>
              {formatPrecip(precipMm, unit)}
            </div>
            <div>
              <span className="opacity-70">{t('windLabel')}: </span>
              {formatWindSpeed(windKmh, unit)}
            </div>
          </div>
        </div>

        {(forecast || (weather.forecast && weather.forecast.length > 0)) && (
          <WeatherForecastStrip forecast={forecast || (weather.forecast ?? [])} />
        )}

        <p className="text-muted-foreground/70 -mx-6 flex items-center gap-1 text-[10px]">
          <Cloud className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>
            {t('dataBy')}{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary inline-flex items-center gap-0.5 underline-offset-2 hover:underline"
            >
              Open-Meteo.com
              <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
            </a>
          </span>
        </p>
      </CardContent>
      </div>
    </div>
  );
}
