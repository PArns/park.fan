'use client';

import { WeatherWarningBanner } from '@/components/parks/weather-warning-banner';
import type { WeatherWarning } from '@/lib/api/types';

const now = Date.now();
const inH = (h: number) => new Date(now + h * 3_600_000).toISOString();

/** Mock warnings covering the severity scale — static (no network). */
const DEMO_WARNINGS: WeatherWarning[] = [
  {
    alertId: 'demo-heat',
    event: 'EXTREME HITZE',
    eventEn: 'extreme heat',
    severity: 'Severe',
    onset: inH(0),
    expires: inH(7),
    headline: 'Amtliche WARNUNG vor extremer Hitze',
    headlineEn: 'Official warning of extreme heat',
    description:
      'Es tritt eine extreme Wärmebelastung auf. Eine starke gesundheitliche Gefährdung ist zu erwarten.',
    descriptionEn:
      'Extreme heat load. A strong impact on health is expected, also for healthy people.',
    instruction:
      'Meiden Sie die direkte Sonne, trinken Sie ausreichend und vermeiden Sie Anstrengung.',
    instructionEn: 'Avoid direct sun, drink enough water and avoid strenuous activity.',
    area: 'Stadt Brühl',
    source: 'brightsky',
  },
  {
    alertId: 'demo-storm',
    event: 'SCHWERES GEWITTER',
    eventEn: 'heavy thunderstorm',
    severity: 'Moderate',
    onset: inH(2),
    expires: inH(4),
    headline: 'Amtliche WARNUNG vor schwerem Gewitter',
    headlineEn: 'Official warning of heavy thunderstorm',
    description: 'Es treten Sturmböen mit Geschwindigkeiten um 70 km/h und Starkregen auf.',
    descriptionEn: 'Gusts around 70 km/h and heavy rain are expected.',
    instruction: null,
    instructionEn: null,
    area: 'Kreis Rhein-Erft',
    source: 'brightsky',
  },
  {
    alertId: 'demo-wind',
    event: 'WINDBÖEN',
    eventEn: 'wind gusts',
    severity: 'Minor',
    onset: inH(0),
    expires: inH(10),
    headline: 'Amtliche WARNUNG vor Windböen',
    headlineEn: 'Official warning of wind gusts',
    description:
      'Es treten Windböen mit Geschwindigkeiten um 55 km/h aus südwestlicher Richtung auf.',
    descriptionEn: 'Wind gusts around 55 km/h from a south-westerly direction.',
    instruction: null,
    instructionEn: null,
    area: 'Kreis Rhein-Erft',
    source: 'brightsky',
  },
];

export function WeatherWarningBannerDemo() {
  return <WeatherWarningBanner warnings={DEMO_WARNINGS} enabled={false} timezone="Europe/Berlin" />;
}
