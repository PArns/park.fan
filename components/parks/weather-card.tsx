import { useTranslations } from 'next-intl';
import { Wind, Umbrella } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard } from '@/components/common/glass-card';
import { cn } from '@/lib/utils';
import { WeatherForecastStrip } from './weather-forecast-strip';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import type { WeatherData, WeatherDay } from '@/lib/api/types';

interface WeatherCardProps {
  weather: WeatherData;
  forecast?: WeatherDay[];
  className?: string;
}

export function WeatherCard({ weather, forecast, className }: WeatherCardProps) {
  const t = useTranslations('parks.weather');
  const tParks = useTranslations('parks');

  if (!weather.current) return null;

  const current = weather.current;
  const now = weather.now ?? null;

  const isDay = now?.isDay ?? true;
  const weatherCode = now?.weatherCode ?? current.weatherCode;
  const { icon: WeatherIcon, label, color } = getWeatherConfig(weatherCode, isDay);

  const displayTemp =
    now != null ? Math.round(now.temperature) : Math.round(parseFloat(current.temperatureMax));
  const feelsLike = now != null ? Math.round(now.apparentTemperature) : null;
  const tempMax = Math.round(parseFloat(current.temperatureMax));
  const tempMin = Math.round(parseFloat(current.temperatureMin));
  const precipSum = parseFloat(current.precipitationSum || '0');
  const windSpeed = Math.round(parseFloat(current.windSpeedMax || '0'));

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
              <span>{precipSum}mm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="h-3.5 w-3.5" />
              <span>{windSpeed} km/h</span>
            </div>
          </div>
        </div>

        {(forecast || (weather.forecast && weather.forecast.length > 0)) && (
          <WeatherForecastStrip forecast={forecast || (weather.forecast ?? [])} />
        )}
      </CardContent>
    </GlassCard>
  );
}
