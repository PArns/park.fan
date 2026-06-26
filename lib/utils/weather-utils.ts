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
} from 'lucide-react';

/**
 * Severe-weather classification for a single forecast day. Returned value is the
 * translation key suffix under `parks.weather.weatherWarning.*`; `null` means the
 * day is unremarkable. Heat is handled separately (see `isHeatWarning`).
 */
export type WeatherWarning = 'thunderstorm' | 'heavySnow' | 'heavyRain' | 'storm';

// Daily thresholds for "severe". Tuned to flag genuinely disruptive days, not a
// passing shower. Units match the Open-Meteo daily fields (mm / cm / km/h).
const HEAVY_RAIN_MM = 25;
const HEAVY_SNOW_CM = 10;
const STORM_WIND_KMH = 60;

/**
 * Classify a forecast day as severe weather. Checks the WMO weather code first
 * (thunderstorm / heavy rain / heavy snow) and then falls back to the daily
 * totals so a day that accumulates a lot of rain/snow/wind without a "heavy"
 * code still trips the warning. Priority: thunderstorm → snow → rain → wind.
 */
export function getDayWeatherWarning(day: {
  weatherCode: number;
  precipitationSum?: string;
  snowfallSum?: string;
  windSpeedMax?: string;
}): WeatherWarning | null {
  const code = day.weatherCode;
  // 95/96/99 — thunderstorm (with hail).
  if (code === 95 || code === 96 || code === 99) return 'thunderstorm';

  const snow = parseFloat(day.snowfallSum || '0');
  // 75 heavy snow, 86 heavy snow showers.
  if (code === 75 || code === 86 || snow >= HEAVY_SNOW_CM) return 'heavySnow';

  const precip = parseFloat(day.precipitationSum || '0');
  // 65 heavy rain, 67 heavy freezing rain, 82 violent rain showers.
  if (code === 65 || code === 67 || code === 82 || precip >= HEAVY_RAIN_MM) return 'heavyRain';

  const wind = parseFloat(day.windSpeedMax || '0');
  if (wind >= STORM_WIND_KMH) return 'storm';

  return null;
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
