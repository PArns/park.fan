'use client';

import { useTranslations } from 'next-intl';
import {
  Cloud,
  ExternalLink,
  Snowflake,
  Eye,
  CloudFog,
  Droplets,
  Thermometer,
  Wind as WindIcon,
} from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WeatherForecastStrip } from './weather-forecast-strip';
import { HeatWarningBadge, isHeatWarning } from './heat-warning-badge';
import { WeatherHourlyChart } from './weather-hourly-chart';
import { NowcastUpdateCountdown } from './nowcast-update-countdown';
import { WeatherBackground } from './weather-background';
import { WindCompass } from './wind-compass';
import { TemperatureUnitToggle } from '@/components/common/temperature-unit-toggle';
import { Temp, Wind, Precip, Distance } from '@/components/common/unit-display';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { useWeatherNowcast } from '@/lib/hooks/use-weather-nowcast';
import { useWeatherHourly } from '@/lib/hooks/use-weather-hourly';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import type {
  ScheduleItem,
  WeatherData,
  WeatherDay,
  WeatherHourlyToday,
  WeatherNowcast,
} from '@/lib/api/types';

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
  /** Park coordinates + timezone — when provided (and a nowcast exists), enables
      the detailed hour-by-hour day view for today. */
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
  /** Park schedule — today's opening hours are marked in the hourly day view. */
  schedule?: ScheduleItem[] | null;
  /** Static hourly data (showcases/demos) — when set, the live fetch is skipped. */
  hourly?: WeatherHourlyToday | null;
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
  latitude,
  longitude,
  timezone,
  schedule,
  hourly,
  className,
}: WeatherCardProps) {
  const t = useTranslations('parks.weather');
  const tParks = useTranslations('parks');

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

  // Detailed day view for today. The fetch starts IMMEDIATELY (in parallel with the
  // nowcast, not gated on it) so the chart is ready the moment the nowcast lands —
  // the old nowcast→hourly waterfall delayed the weather card by a full roundtrip.
  // Rendering below still requires a nowcast (parks with live weather coverage); for
  // parks without one the single CDN-cached fetch is cheap. A static `hourly` prop
  // (showcases/demos) takes precedence and disables the fetch.
  const { data: fetchedHourly } = useWeatherHourly({
    latitude,
    longitude,
    timezone,
    enabled: hourly === undefined,
  });
  const activeHourly = hourly !== undefined ? hourly : fetchedHourly;

  // The base forecast (current + 7-day strip) is baked into the 1-day ISR shell, so it would be up
  // to a day stale. Subscribe to the same live park query LiveParkData polls (shared key → no extra
  // fetch) and use its fresh `weather`; fall back to the server-rendered prop until it lands.
  const { data: livePark } = useLiveParkData({
    continent: continent ?? '',
    country: country ?? '',
    city: city ?? '',
    parkSlug: parkSlug ?? '',
    enabled: hasParams,
  });
  const activeWeather = hasParams && livePark?.weather?.current ? livePark.weather : weather;

  if (!activeWeather.current) return null;

  const current = activeWeather.current;
  const now = activeWeather.now ?? null;

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

  // Live conditions row (wind compass + visibility + snow) — only with a nowcast.
  const gustsKmh = activeNowcast?.currentWindGustsKmh ?? null;
  const visM = activeNowcast?.currentVisibilityM ?? null;
  const isFog = visM != null && visM < 1000;
  const snowCm = activeNowcast?.currentSnowfallCm ?? null;
  const showSnow = snowCm != null && snowCm > 0;

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
                <span className="inline-flex items-center gap-2 text-3xl font-bold">
                  <Temp celsius={displayTempC} />
                  {isHeatWarning(displayTempC) && <HeatWarningBadge label={t('heatWarning')} />}
                </span>
                <p className="text-muted-foreground text-xs">
                  <Temp celsius={tempMinC} /> – <Temp celsius={tempMaxC} />
                </p>
                {feelsLikeC != null && (
                  <p className="text-muted-foreground flex items-center gap-1 text-xs whitespace-nowrap">
                    <Thermometer className="h-3 w-3 shrink-0 sm:hidden" aria-hidden="true" />
                    <span className="hidden sm:inline">{t('feelsLike')}</span>
                    <Temp celsius={feelsLikeC} />
                  </p>
                )}
                <p className="text-muted-foreground mt-0.5 text-sm font-medium">{t(label)}</p>
              </div>
            </div>

            {activeNowcast ? (
              <div className="flex items-center gap-3">
                {/* Text labels collapse to their icons below `sm` — the value column
                    sits next to the temperature block and wraps otherwise. */}
                <div className="text-muted-foreground space-y-0.5 text-right text-xs">
                  <div
                    className="flex items-center justify-end gap-1 whitespace-nowrap"
                    title={t('precipLabel')}
                  >
                    <Droplets className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                    <span className="hidden opacity-70 sm:inline">{t('precipLabel')}: </span>
                    <Precip mm={precipMm} />
                  </div>
                  {gustsKmh != null && (
                    <div
                      className="flex items-center justify-end gap-1 whitespace-nowrap"
                      title={t('gustsLabel')}
                    >
                      <WindIcon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                      <span className="hidden opacity-70 sm:inline">{t('gustsLabel')}: </span>
                      <Wind kmh={gustsKmh} />
                    </div>
                  )}
                  {visM != null && (
                    <div
                      className="flex items-center justify-end gap-1 whitespace-nowrap"
                      title={isFog ? t('fog') : t('visibilityLabel')}
                    >
                      {isFog ? (
                        <CloudFog className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                      )}
                      <span className="hidden opacity-70 sm:inline">
                        {isFog ? t('fog') : t('visibilityLabel')}:
                      </span>{' '}
                      <Distance meters={visM} />
                    </div>
                  )}
                  {showSnow && (
                    <div
                      className="flex items-center justify-end gap-1 whitespace-nowrap"
                      title={t('snowLabel')}
                    >
                      <Snowflake className="h-3.5 w-3.5 shrink-0 text-sky-300" aria-hidden="true" />
                      <span className="hidden opacity-70 sm:inline">{t('snowLabel')}:</span>{' '}
                      {snowCm!.toFixed(1)} cm
                    </div>
                  )}
                </div>
                <WindCompass
                  directionDeg={activeNowcast.currentWindDirectionDeg}
                  windKmh={windKmh}
                />
              </div>
            ) : (
              <div className="text-muted-foreground space-y-0.5 text-right text-xs">
                <div
                  className="flex items-center justify-end gap-1 whitespace-nowrap"
                  title={t('precipLabel')}
                >
                  <Droplets className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                  <span className="hidden opacity-70 sm:inline">{t('precipLabel')}: </span>
                  <Precip mm={precipMm} />
                </div>
                <div
                  className="flex items-center justify-end gap-1 whitespace-nowrap"
                  title={t('windLabel')}
                >
                  <WindIcon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                  <span className="hidden opacity-70 sm:inline">{t('windLabel')}: </span>
                  <Wind kmh={windKmh} />
                </div>
              </div>
            )}
          </div>

          {activeNowcast && timezone && activeHourly && activeHourly.points.length > 0 && (
            <WeatherHourlyChart
              points={activeHourly.points}
              timezone={timezone}
              schedule={schedule ?? undefined}
              nowcast={activeNowcast}
            />
          )}

          {(forecast || (activeWeather.forecast && activeWeather.forecast.length > 0)) && (
            <WeatherForecastStrip forecast={forecast || (activeWeather.forecast ?? [])} />
          )}

          <p className="text-muted-foreground/50 !-mt-1 -mb-3 flex items-center justify-end gap-1 text-[12px] leading-none font-medium">
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
