import { useTranslations } from 'next-intl';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  CloudDrizzle,
  Wind,
  Umbrella,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WeatherData } from '@/lib/api/types';

interface WeatherCardProps {
  weather: WeatherData;
  className?: string;
}

// WMO Weather Codes grouping
// https://open-meteo.com/en/docs
function getWeatherConfig(code: number) {
  switch (code) {
    case 0:
      return { icon: Sun, label: 'clear' };
    case 1:
      return { icon: CloudSun, label: 'mainlyClear' };
    case 2:
      return { icon: CloudSun, label: 'partlyCloudy' };
    case 3:
      return { icon: Cloud, label: 'overcast' };
    case 45:
    case 48:
      return { icon: CloudFog, label: 'fog' };
    case 51:
    case 53:
    case 55:
      return { icon: CloudDrizzle, label: 'drizzle' };
    case 56:
    case 57:
      return { icon: CloudDrizzle, label: 'freezingDrizzle' };
    case 61:
    case 63:
    case 65:
      return { icon: CloudRain, label: 'rain' };
    case 66:
    case 67:
      return { icon: CloudRain, label: 'freezingRain' };
    case 71:
    case 73:
    case 75:
      return { icon: CloudSnow, label: 'snow' };
    case 77:
      return { icon: CloudSnow, label: 'snowGrains' };
    case 80:
    case 81:
    case 82:
      return { icon: CloudRain, label: 'rainShowers' };
    case 85:
    case 86:
      return { icon: CloudSnow, label: 'snowShowers' };
    case 95:
    case 96:
    case 99:
      return { icon: CloudLightning, label: 'thunderstorm' };
    default:
      return { icon: Sun, label: 'clear' };
  }
}

export function WeatherCard({ weather, className }: WeatherCardProps) {
  const t = useTranslations('parks.weather');
  const tParks = useTranslations('parks');

  if (!weather.current) return null;

  const current = weather.current;
  const { icon: WeatherIcon, label } = getWeatherConfig(current.weatherCode);

  // Parse and round temperatures
  const tempMax = Math.round(parseFloat(current.temperatureMax));
  const tempMin = Math.round(parseFloat(current.temperatureMin));

  const precipSum = parseFloat(current.precipitationSum || '0');
  const windSpeed = Math.round(parseFloat(current.windSpeedMax || '0'));

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <WeatherIcon className="h-4 w-5" />
          {tParks('weatherLabel')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-muted rounded-full p-2">
              <WeatherIcon className="h-8 w-8 text-sky-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{tempMax}°</span>
                <span className="text-muted-foreground text-sm">/ {tempMin}°</span>
              </div>
              <p className="text-muted-foreground text-sm font-medium">{t(label)}</p>
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
      </CardContent>
    </Card>
  );
}
