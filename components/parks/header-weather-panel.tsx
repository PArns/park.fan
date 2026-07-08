'use client';

import { useTranslations } from 'next-intl';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { Temp } from '@/components/common/unit-display';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { cn } from '@/lib/utils';
import type { WeatherData } from '@/lib/api/types';

interface HeaderWeatherPanelProps {
  weather: WeatherData;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  className?: string;
}

/**
 * Compact "today's weather" summary for the park header's right column — fills the wide-screen void
 * beside the title/stats with the one other input that decides a visit: the weather. A distilled
 * companion to <WeatherCard> below (condition icon + current temp + today's hi/lo + feels-like), NOT
 * a duplicate — no hourly chart, nowcast row or 7-day strip. Subscribes to the SAME live park query
 * the card and stats board poll (shared React Query key → no extra fetch) so its base temperature
 * stays in sync, falling back to the server snapshot until the poll lands. Weather loads first per the
 * park-page loading-priority rule, so this is safe to render up top.
 */
export function HeaderWeatherPanel({
  weather,
  continent,
  country,
  city,
  parkSlug,
  className,
}: HeaderWeatherPanelProps) {
  const t = useTranslations('parks.weather');

  // Shared key with LiveParkData / WeatherCard — no extra request, just fresher `weather`.
  const { data: livePark } = useLiveParkData({ continent, country, city, parkSlug, enabled: true });
  const active = livePark?.weather?.current ? livePark.weather : weather;
  const current = active.current;
  if (!current) return null;

  const now = active.now ?? null;
  const isDay = now?.isDay ?? true;
  const weatherCode = now?.weatherCode ?? current.weatherCode;
  const { icon: WeatherIcon, label, color } = getWeatherConfig(weatherCode, isDay);

  const displayTempC = now?.temperature ?? parseFloat(current.temperatureMax);
  const feelsLikeC = now?.apparentTemperature ?? null;
  const tempMaxC = parseFloat(current.temperatureMax);
  const tempMinC = parseFloat(current.temperatureMin);

  return (
    <div
      className={cn(
        'border-border/50 bg-background/40 flex items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur-sm',
        className
      )}
    >
      <div className="bg-foreground/5 shrink-0 rounded-full p-2">
        <WeatherIcon className={cn('h-8 w-8', color)} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl leading-none font-bold">
            <Temp celsius={displayTempC} />
          </span>
          <span className="text-muted-foreground text-xs tabular-nums whitespace-nowrap">
            <Temp celsius={tempMinC} /> – <Temp celsius={tempMaxC} />
          </span>
        </div>
        <div className="text-muted-foreground mt-1 truncate text-xs font-medium">{t(label)}</div>
        {feelsLikeC != null && (
          <div className="text-muted-foreground text-xs whitespace-nowrap">
            {t('feelsLike')} <Temp celsius={feelsLikeC} />
          </div>
        )}
      </div>
    </div>
  );
}
