'use client';

import { useLocale } from 'next-intl';
import { Droplets, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseISO } from 'date-fns';
import { de, enUS, es, fr, nl, type Locale } from 'date-fns/locale';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import type { WeatherDay } from '@/lib/api/types';

interface WeatherForecastStripProps {
  forecast: WeatherDay[];
  className?: string;
}

const LOCALE_MAP: Record<string, Locale> = { de, es, fr, nl };

export function WeatherForecastStrip({ forecast, className }: WeatherForecastStripProps) {
  const locale = useLocale();
  const dateFnsLocale = LOCALE_MAP[locale] ?? enUS;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeft(scrollLeft > 5);
        setShowRight(scrollLeft < scrollWidth - clientWidth - 5);
      }
    };

    const current = scrollRef.current;
    if (current) {
      current.addEventListener('scroll', checkScroll);
      checkScroll();
      window.addEventListener('resize', checkScroll);
    }

    return () => {
      if (current) {
        current.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [forecast]);

  const validForecast = forecast.filter(
    (day) => !isNaN(parseFloat(day.temperatureMax)) && !isNaN(parseFloat(day.temperatureMin)),
  );

  if (validForecast.length === 0) return null;

  const cellMinWidth =
    validForecast.length <= 7 ? 'min-w-16' : validForecast.length <= 12 ? 'min-w-[72px]' : 'min-w-20';

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className={`group/weather relative -mx-6 ${className ?? ''}`}>
      {/* Left indicator / gradient */}
      <div
        className={`from-background/60 pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r to-transparent transition-opacity duration-300 ${showLeft ? 'opacity-100' : 'opacity-0'}`}
      />
      {showLeft && (
        <button
          onClick={() => scroll('left')}
          className="bg-background/80 hover:bg-background absolute top-1/2 left-2 z-20 -translate-y-1/2 rounded-full p-1.5 shadow-md backdrop-blur-sm transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Right indicator / gradient */}
      <div
        className={`from-background/60 pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l to-transparent transition-opacity duration-300 ${showRight ? 'opacity-100' : 'opacity-0'}`}
      />
      {showRight && (
        <button
          onClick={() => scroll('right')}
          className="bg-background/80 hover:bg-background absolute top-1/2 right-2 z-20 -translate-y-1/2 rounded-full p-1.5 shadow-md backdrop-blur-sm transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="bg-muted/30 no-scrollbar border-border/20 overflow-x-auto border-y"
      >
        <div className="flex w-full min-w-max">
          {validForecast.map((day, i) => {
            const { icon: ForecastIcon, color } = getWeatherConfig(day.weatherCode);
            const max = Math.round(parseFloat(day.temperatureMax));
            const min = Math.round(parseFloat(day.temperatureMin));
            const date = parseISO(day.date);
            const dayLabel = format(date, 'EEE', { locale: dateFnsLocale });
            const precip = parseFloat(day.precipitationSum || '0');

            const precipDisplay =
              precip >= 10
                ? `${Math.round(precip)}mm`
                : precip > 0
                  ? `${precip.toFixed(1)}mm`
                  : null;
            const isLast = i === validForecast.length - 1;

            return (
              <div
                key={day.date}
                className={`flex flex-1 flex-col items-center gap-1.5 py-4 text-center ${cellMinWidth} ${!isLast ? 'border-border/30 border-r' : ''}`}
              >
                <span className="text-muted-foreground text-[10px] leading-none font-medium capitalize">
                  {dayLabel}
                </span>
                <span className="text-muted-foreground/70 text-[9px] leading-none">
                  {format(date, 'd.M.', { locale: dateFnsLocale })}
                </span>
                <ForecastIcon className={`h-4 w-4 ${color}`} />
                <div className="flex flex-col items-center leading-none">
                  <span className="text-sm font-bold">{max}°</span>
                  <span className="text-muted-foreground mt-0.5 text-[10px]">{min}°</span>
                </div>
                {precipDisplay ? (
                  <div className="mt-0.5 flex items-center gap-0.5 leading-none">
                    <Droplets className="h-2.5 w-2.5 text-sky-400" />
                    <span className="text-[9px] font-medium text-sky-400">{precipDisplay}</span>
                  </div>
                ) : (
                  <span className="mt-0.5 text-[9px] leading-none opacity-0">—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
