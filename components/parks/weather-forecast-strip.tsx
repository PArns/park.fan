import { useLocale } from 'next-intl';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  CloudDrizzle,
  Droplets,
} from 'lucide-react';
import { parseISO } from 'date-fns';
import { de, enUS, es, fr, nl, type Locale } from 'date-fns/locale';
import { format } from 'date-fns';
import type { WeatherDay } from '@/lib/api/types';

interface WeatherForecastStripProps {
  forecast: WeatherDay[];
  className?: string;
}

// WMO Weather Codes grouping
// https://open-meteo.com/en/docs
export function getWeatherConfig(code: number, isDay = true) {
  switch (code) {
    case 0:
      return isDay
        ? { icon: Sun, label: 'clear', color: 'text-amber-400' }
        : { icon: Moon, label: 'clear', color: 'text-slate-300' };
    case 1:
      return isDay
        ? { icon: CloudSun, label: 'mainlyClear', color: 'text-amber-400' }
        : { icon: CloudMoon, label: 'mainlyClear', color: 'text-slate-300' };
    case 2:
      return isDay
        ? { icon: CloudSun, label: 'partlyCloudy', color: 'text-sky-400' }
        : { icon: CloudMoon, label: 'partlyCloudy', color: 'text-slate-400' };
    case 3:
      return { icon: Cloud, label: 'overcast', color: 'text-muted-foreground' };
    case 45:
    case 48:
      return { icon: CloudFog, label: 'fog', color: 'text-muted-foreground' };
    case 51:
    case 53:
    case 55:
      return { icon: CloudDrizzle, label: 'drizzle', color: 'text-sky-400' };
    case 56:
    case 57:
      return { icon: CloudDrizzle, label: 'freezingDrizzle', color: 'text-sky-300' };
    case 61:
    case 63:
    case 65:
      return { icon: CloudRain, label: 'rain', color: 'text-sky-400' };
    case 66:
    case 67:
      return { icon: CloudRain, label: 'freezingRain', color: 'text-sky-300' };
    case 71:
    case 73:
    case 75:
      return { icon: CloudSnow, label: 'snow', color: 'text-blue-300' };
    case 77:
      return { icon: CloudSnow, label: 'snowGrains', color: 'text-blue-300' };
    case 80:
    case 81:
    case 82:
      return { icon: CloudRain, label: 'rainShowers', color: 'text-sky-400' };
    case 85:
    case 86:
      return { icon: CloudSnow, label: 'snowShowers', color: 'text-blue-300' };
    case 95:
    case 96:
    case 99:
      return { icon: CloudLightning, label: 'thunderstorm', color: 'text-yellow-400' };
    default:
      return isDay
        ? { icon: Sun, label: 'clear', color: 'text-amber-400' }
        : { icon: Moon, label: 'clear', color: 'text-slate-300' };
  }
}

const LOCALE_MAP: Record<string, Locale> = { de, es, fr, nl };

export function WeatherForecastStrip({ forecast, className }: WeatherForecastStripProps) {
  const locale = useLocale();
  const dateFnsLocale = LOCALE_MAP[locale] ?? enUS;
  const days = forecast.slice(0, 6);

  if (days.length === 0) return null;

  return (
    <div className={`bg-muted/40 rounded-lg px-1 py-2 ${className ?? ''}`}>
      <div className="grid grid-cols-6">
        {days.map((day, i) => {
          const { icon: ForecastIcon, color } = getWeatherConfig(day.weatherCode);
          const max = Math.round(parseFloat(day.temperatureMax));
          const min = Math.round(parseFloat(day.temperatureMin));
          const date = parseISO(day.date);
          const dayLabel = format(date, 'EEE', { locale: dateFnsLocale });
          const precip = parseFloat(day.precipitationSum || '0');
          const isLast = i === days.length - 1;
          return (
            <div
              key={day.date}
              className={`flex flex-col items-center gap-1 py-1 text-center ${!isLast ? 'border-border/30 border-r' : ''}`}
            >
              <span className="text-muted-foreground text-[10px] leading-none font-medium capitalize">
                {dayLabel}
              </span>
              <ForecastIcon className={`h-4 w-4 ${color}`} />
              <div className="flex items-baseline gap-0.5 leading-none">
                <span className="text-xs font-bold">{max}°</span>
                <span className="text-muted-foreground text-[10px]">/ {min}°</span>
              </div>
              {precip > 0 ? (
                <div className="flex items-center gap-0.5 leading-none">
                  <Droplets className="h-2.5 w-2.5 text-sky-400" />
                  <span className="text-[9px] font-medium text-sky-400">{precip}mm</span>
                </div>
              ) : (
                <span className="text-[9px] leading-none opacity-0">—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
