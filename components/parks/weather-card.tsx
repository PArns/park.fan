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
import { Temp, Wind, Precip, Distance } from '@/components/common/unit-display';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { LiveDot } from '@/components/common/live-dot';
import { useWeatherNowcast } from '@/lib/hooks/use-weather-nowcast';
import { useWeatherHourly } from '@/lib/hooks/use-weather-hourly';
import { useMounted } from '@/lib/hooks/use-mounted';
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

  // The shell and the first client render must agree, so the chart reservation below is
  // driven by this rather than by the (browser-only) query flags.
  const mounted = useMounted();

  const hasParams = !!(continent && country && city && parkSlug);
  const { data: liveNowcast, isLoading: nowcastLoading } = useWeatherNowcast({
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
  const { data: fetchedHourly, isLoading: hourlyLoading } = useWeatherHourly({
    latitude,
    longitude,
    timezone,
    enabled: hourly === undefined,
  });
  const activeHourly = hourly !== undefined ? hourly : fetchedHourly;

  // The chart needs BOTH queries, so its box has to be held for as long as EITHER is still out.
  // The old gate (`activeNowcast && hourlyLoading`) held nothing until the nowcast had landed, so
  // on the common ordering no placeholder was ever rendered and the ~143px chart dropped straight
  // onto a settled card, pushing the forecast strip and the rest of the page down. Reserving on
  // either query moves that to hydration, before the content below has painted. Both flags are
  // false while a query is disabled, so a park without coordinates still reserves nothing (they
  // are also false during SSR — these are client-only queries — which is why the shell itself
  // carries no placeholder; by the time one appears the swap is no longer visible).
  const chartPending = hourlyLoading || nowcastLoading;

  // ...but `chartPending` is false during SSR too, because both queries are browser-only
  // and a disabled query is not loading. So the shell reserved nothing after all, and the
  // 143px chart dropped onto a settled card at hydration — measured as the park page's
  // largest remaining in-view shift (+171px mobile, +159px desktop, `pnpm measure:cls`).
  // Gate the reservation on mount instead: hold the box from the FIRST paint whenever a
  // chart is possible at all, and release it only once both queries have answered.
  const chartPossible = Boolean(timezone && latitude != null && longitude != null);
  const holdChartBox = chartPossible && (!mounted || chartPending);

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
        {/* The °C/°F toggle used to sit at the right end of this row, which put it on park pages
            and nowhere else — while the unit governs the calendar, the blog posts and the
            best-travel-time hub too. It is in the header now, beside the theme switch. */}
        <CardHeader className="px-0 pt-0 pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <WeatherIcon className={`h-4 w-4 ${color}`} />
            {tParks('weatherLabel')}
            {activeNowcast && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <LiveDot size="h-1.5 w-1.5" color="bg-emerald-500" pingColor="bg-emerald-500/50" />
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
              /* Pre-nowcast fallback. `min-h-16` is the height of the block that replaces it (the
                 wind compass sets it), so the values re-centre in place instead of sliding 15px up
                 the moment the nowcast lands. */
              <div className="text-muted-foreground flex min-h-16 flex-col justify-center space-y-0.5 text-right text-xs">
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

          {activeNowcast && timezone && activeHourly && activeHourly.points.length > 0 ? (
            <WeatherHourlyChart
              points={activeHourly.points}
              timezone={timezone}
              schedule={schedule ?? undefined}
              nowcast={activeNowcast}
            />
          ) : holdChartBox ? (
            /* Same box as the chart (h-28 plot + mt-1 axis), held from the first paint until both
               queries have answered. On the parks the nowcast doesn't cover it is released again
               once that 404 comes back — a park that never had the chart trades the drop-in for a
               collapse of the same size, which is the price of not shifting the ones that do. */
            <div className="min-w-0" aria-hidden="true">
              <div className="bg-muted/30 h-28 animate-pulse rounded-lg" />
              {/* Matches the chart's axis row exactly (h-28 plot + mt-1 + 27px axis = 143px);
                  the 31px this used to be left the strip below to hop 4px on the swap. */}
              <div className="mt-1 h-[27px]" />
            </div>
          ) : null}

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
