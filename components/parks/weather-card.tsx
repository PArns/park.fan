'use client';

import { useTranslations } from 'next-intl';
import { Cloud, ExternalLink, Snowflake, Eye, CloudFog } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WeatherForecastStrip } from './weather-forecast-strip';
import { NowcastUpdateCountdown } from './nowcast-update-countdown';
import { WeatherBackground } from './weather-background';
import { WindCompass } from './wind-compass';
import { TemperatureUnitToggle } from '@/components/common/temperature-unit-toggle';
import { useTemperatureUnit } from '@/lib/contexts/temperature-unit-context';
import { formatTemp, formatWindSpeed, convertWindSpeed, formatPrecip } from '@/lib/utils/temperature';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { useWeatherNowcast } from '@/lib/hooks/use-weather-nowcast';
import type { WeatherData, WeatherDay, WeatherNowcast } from '@/lib/api/types';

interface WeatherCardProps {
  weather: WeatherData;
  forecast?: WeatherDay[];
  /** Optional live nowcast: overrides icon/description with current observed conditions. */
  nowcast?: WeatherNowcast | null;
  /** Geo-routing params — when provided, enables live nowcast polling. */
  continent?: string;
  country?: string;
  city?: string;
  parkSlug?: string;
  className?: string;
}

export function WeatherCard({
  weather,
  forecast,
  nowcast,
  continent,
  country,
  city,
  parkSlug,
  className,
}: WeatherCardProps) {
  const t = useTranslations('parks.weather');
  const tParks = useTranslations('parks');
  const { unit } = useTemperatureUnit();

  const hasParams = !!(continent && country && city && parkSlug);
  const { data: liveNowcast } = useWeatherNowcast({
    continent: continent ?? '',
    country: country ?? '',
    city: city ?? '',
    parkSlug: parkSlug ?? '',
    initialData: nowcast,
    enabled: hasParams,
  });
  // liveNowcast is undefined when the hook is disabled (no params) — fall back to the static prop
  const activeNowcast = hasParams ? liveNowcast : nowcast;

  if (!weather.current) return null;

  const current = weather.current;
  const now = weather.now ?? null;

  // Nowcast (~15 min freshness) wins over the daily "now" snapshot, which can be hours old.
  // It now also carries temperature, apparent-temperature, min/max, and isDay — so when a
  // nowcast is supplied the entire "current" block is sourced from it.
  const isDay = activeNowcast?.isDay ?? now?.isDay ?? true;
  const weatherCode = activeNowcast?.currentWeatherCode ?? now?.weatherCode ?? current.weatherCode;
  const { icon: WeatherIcon, label, color } = getWeatherConfig(weatherCode, isDay);

  const liveTemp = activeNowcast?.currentTemperatureC ?? null;
  const liveFeels = activeNowcast?.currentApparentTemperatureC ?? null;
  const liveMax = activeNowcast?.temperatureMaxC ?? null;
  const liveMin = activeNowcast?.temperatureMinC ?? null;

  const displayTempC = liveTemp ?? now?.temperature ?? parseFloat(current.temperatureMax);
  const feelsLikeC = liveFeels ?? now?.apparentTemperature ?? null;
  const tempMaxC = liveMax ?? parseFloat(current.temperatureMax);
  const tempMinC = liveMin ?? parseFloat(current.temperatureMin);

  // Prefer live nowcast wind when available; fall back to daily max.
  const windKmh = activeNowcast?.currentWindSpeedKmh ?? parseFloat(current.windSpeedMax || '0');

  // Live precip is the 15-min slot intensity; daily precipitationSum is total. Show the live
  // value when nowcast says it's actively precipitating so the card reflects "right now".
  const liveRaining = activeNowcast?.currentlyRaining ?? false;
  const livePrecip = activeNowcast?.currentPrecipitationMm ?? null;
  const showLivePrecip = liveRaining && livePrecip != null && livePrecip > 0;
  const precipMm = showLivePrecip ? livePrecip! : parseFloat(current.precipitationSum || '0');

  const displayTemp = formatTemp(displayTempC, unit);
  const feelsLike = feelsLikeC != null ? formatTemp(feelsLikeC, unit) : null;
  const tempMax = formatTemp(tempMaxC, unit);
  const tempMin = formatTemp(tempMinC, unit);

  // Live conditions row (wind compass + visibility + snow) — only with a nowcast.
  const windValue = String(Math.round(convertWindSpeed(windKmh, unit)));
  const windUnitLabel = unit === 'F' ? 'mph' : 'km/h';
  const gustsKmh = activeNowcast?.currentWindGustsKmh ?? null;
  const visM = activeNowcast?.currentVisibilityM ?? null;
  const isFog = visM != null && visM < 1000;
  const snowCm = activeNowcast?.currentSnowfallCm ?? null;
  const showSnow = snowCm != null && snowCm > 0;
  const visLabel =
    visM != null
      ? unit === 'F'
        ? `${(visM / 1609).toFixed(visM < 1609 ? 1 : 0)} mi`
        : visM >= 1000
          ? `${Math.round(visM / 1000)} km`
          : `${visM} m`
      : null;

  return (
    <div
      className={cn(
        'relative isolate min-w-0 overflow-hidden overflow-x-clip rounded-xl border p-6 shadow-sm',
        className
      )}
    >
      <WeatherBackground code={weatherCode} isDay={isDay} glass glassBlur={4} glassOpacity={0.72} />
      <div className="relative z-10 flex flex-col gap-4">
        <CardHeader className="px-0 pt-0 pb-0">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <WeatherIcon className={`h-4 w-4 ${color}`} />
              {tParks('weatherLabel')}
              {activeNowcast && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="relative inline-flex h-1.5 w-1.5">
                    <span
                      className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/50"
                      aria-hidden="true"
                    />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  {t('liveLabel')}
                </span>
              )}
              {activeNowcast?.nextUpdateAt && (
                <NowcastUpdateCountdown
                  nextUpdateAt={activeNowcast.nextUpdateAt}
                  className="m-0 text-emerald-600/80 dark:text-emerald-400/80"
                />
              )}
            </CardTitle>
            <TemperatureUnitToggle />
          </div>
        </CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-foreground/10 rounded-full p-3 backdrop-blur-sm">
                <WeatherIcon className={`h-12 w-12 ${color}`} />
              </div>
              <div>
                <span className="text-3xl font-bold">{displayTemp}</span>
                <p className="text-muted-foreground text-xs">
                  {tempMin} – {tempMax}
                </p>
                {feelsLike !== null && (
                  <p className="text-muted-foreground text-xs">
                    {t('feelsLike')} {feelsLike}
                  </p>
                )}
                <p className="text-muted-foreground mt-0.5 text-sm font-medium">{t(label)}</p>
              </div>
            </div>

            {activeNowcast ? (
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground space-y-0.5 text-right text-xs">
                  <div>
                    <span className="opacity-70">{t('precipLabel')}: </span>
                    {formatPrecip(precipMm, unit)}
                  </div>
                  {gustsKmh != null && (
                    <div>
                      <span className="opacity-70">{t('gustsLabel')}: </span>
                      {formatWindSpeed(gustsKmh, unit)}
                    </div>
                  )}
                  {visLabel && (
                    <div className="flex items-center justify-end gap-1">
                      {isFog ? (
                        <CloudFog className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                      )}
                      <span className="opacity-70">{isFog ? t('fog') : t('visibilityLabel')}:</span>{' '}
                      {visLabel}
                    </div>
                  )}
                  {showSnow && (
                    <div className="flex items-center justify-end gap-1">
                      <Snowflake className="h-3.5 w-3.5 shrink-0 text-sky-300" aria-hidden="true" />
                      <span className="opacity-70">{t('snowLabel')}:</span> {snowCm!.toFixed(1)} cm
                    </div>
                  )}
                </div>
                <WindCompass
                  directionDeg={activeNowcast.currentWindDirectionDeg}
                  speedValue={windValue}
                  unitLabel={windUnitLabel}
                />
              </div>
            ) : (
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
            )}
          </div>

          {(forecast || (weather.forecast && weather.forecast.length > 0)) && (
            <WeatherForecastStrip forecast={forecast || (weather.forecast ?? [])} />
          )}

          <p className="text-muted-foreground/50 !-mt-1 -mr-4 -mb-3 flex items-center justify-end gap-1 text-[12px] leading-none font-medium">
            <Cloud className="h-3 w-3 shrink-0" aria-hidden="true" />
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary inline-flex items-center gap-0.5 underline-offset-2 hover:underline"
            >
              {t('dataBy')} Open-Meteo.com
              <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
