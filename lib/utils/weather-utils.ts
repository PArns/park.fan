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
