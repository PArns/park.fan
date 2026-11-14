import { getTranslations } from 'next-intl/server';
import type { TripForecastAccuracy } from '@/lib/trip-regions/types';
import { HubAccuracyLink } from './hub-accuracy-link';

/**
 * One line under the calendar: how far the forecast of the peak wait was off lately, for forecasts
 * made a few days ahead, linked to the question that explains the figure. It reads a promise the
 * route starts, inside its own `<Suspense>`, so a slow answer never holds the calendar back;
 * without a figure it draws nothing.
 */
export async function HubAccuracy({
  region,
  accuracy,
}: {
  region: string;
  accuracy: Promise<TripForecastAccuracy | null>;
}) {
  const figure = await accuracy;
  if (!figure) return null;
  const t = await getTranslations('tripHub.accuracy');
  return (
    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
      {t.rich('line', {
        lead: figure.leadDays,
        days: figure.days,
        minutes: Math.round(figure.maeMinutes),
        link: (chunks) => <HubAccuracyLink region={region}>{chunks}</HubAccuracyLink>,
      })}
    </p>
  );
}
