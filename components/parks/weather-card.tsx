import { useTranslations } from 'next-intl';
import { Wind, Umbrella, Cloud, ExternalLink, Radio } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard } from '@/components/common/glass-card';
import { cn } from '@/lib/utils';
import { WeatherForecastStrip } from './weather-forecast-strip';
import { NowcastUpdateCountdown } from './nowcast-update-countdown';
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

  if (!weather.current) return null;

  const current = weather.current;
  const now = weather.now ?? null;

  const isDay = now?.isDay ?? true;
  // Nowcast (~15 min freshness) wins over the daily "now" snapshot, which can be hours old.
  const weatherCode =
    nowcast?.currentWeatherCode ?? now?.weatherCode ?? current.weatherCode;
  const { icon: WeatherIcon, label, color } = getWeatherConfig(weatherCode, isDay);

  const displayTemp =
    now != null ? Math.round(now.temperature) : Math.round(parseFloat(current.temperatureMax));
  const feelsLike = now != null ? Math.round(now.apparentTemperature) : null;
  const tempMax = Math.round(parseFloat(current.temperatureMax));
  const tempMin = Math.round(parseFloat(current.temperatureMin));

  // Prefer live nowcast wind when available; fall back to daily max.
  const liveWind = nowcast?.currentWindSpeedKmh ?? null;
  const windSpeed =
    liveWind != null ? Math.round(liveWind) : Math.round(parseFloat(current.windSpeedMax || '0'));

  // Live precip is the 15-min slot intensity; daily precipitationSum is total. Show the live
  // value when nowcast says it's actively precipitating so the card reflects "right now".
  const liveRaining = nowcast?.currentlyRaining ?? false;
  const livePrecip = nowcast?.currentPrecipitationMm ?? null;
  const showLivePrecip = liveRaining && livePrecip != null && livePrecip > 0;
  const precipSum = parseFloat(current.precipitationSum || '0');

  return (
    <GlassCard variant="medium" className={cn('min-w-0 overflow-x-clip', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <WeatherIcon className={`h-4 w-4 ${color}`} />
          {tParks('weatherLabel')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-muted rounded-full p-2">
              <WeatherIcon className={`h-8 w-8 ${color}`} />
            </div>
            <div>
              <span className="text-3xl font-bold">{displayTemp}°</span>
              <p className="text-muted-foreground text-xs">
                {tempMin}° – {tempMax}°
              </p>
              {feelsLike !== null && feelsLike !== displayTemp && (
                <p className="text-muted-foreground text-xs">
                  {t('feelsLike')} {feelsLike}°
                </p>
              )}
              <p className="text-muted-foreground mt-0.5 text-sm font-medium">{t(label)}</p>
            </div>
          </div>

          <div className="text-muted-foreground space-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <Umbrella className="h-3.5 w-3.5" />
              <span>
                {showLivePrecip ? `${livePrecip!.toFixed(1)}mm` : `${precipSum}mm`}
              </span>
              {showLivePrecip && (
                <Radio
                  className="text-emerald-500 h-2.5 w-2.5 shrink-0"
                  aria-label={t('liveLabel')}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="h-3.5 w-3.5" />
              <span>{windSpeed} km/h</span>
              {liveWind != null && (
                <Radio
                  className="text-emerald-500 h-2.5 w-2.5 shrink-0"
                  aria-label={t('liveLabel')}
                />
              )}
            </div>
          </div>
        </div>

        {(forecast || (weather.forecast && weather.forecast.length > 0)) && (
          <WeatherForecastStrip forecast={forecast || (weather.forecast ?? [])} />
        )}

        {nowcast?.nextUpdateAt && (
          <NowcastUpdateCountdown nextUpdateAt={nowcast.nextUpdateAt} className="text-muted-foreground" />
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
    </GlassCard>
  );
}
