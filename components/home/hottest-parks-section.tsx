import { getTranslations } from 'next-intl/server';
import { Flame, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Temp } from '@/components/common/unit-display';
import { TemperatureUnitToggle } from '@/components/common/temperature-unit-toggle';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import {
  HeatWarningBadge,
  isHeatWarning,
  HEAT_WARNING_THRESHOLD_C,
} from '@/components/parks/heat-warning-badge';
import { getHottestParks } from '@/lib/api/weather-hottest';

interface HottestParksSectionProps {
  locale: string;
}

/**
 * Homepage heat banner: the hottest parks in DE/FR/IT/NL/BE during a heat wave.
 *
 * Data-driven visibility — renders nothing unless at least one park is currently at/above
 * {@link HEAT_WARNING_THRESHOLD_C}, and disappears automatically once the heat passes (the
 * "Ablaufdatum"). No manual end date. Server component; the underlying weather lookups are
 * cached, so it streams inside the homepage's static shell.
 */
export async function HottestParksSection({ locale: _locale }: HottestParksSectionProps) {
  const parks = await getHottestParks(HEAT_WARNING_THRESHOLD_C, 3);
  if (parks.length === 0) return null;

  const t = await getTranslations('home.hottestParks');
  const tWeather = await getTranslations('parks.weather');
  const tGeo = await getTranslations('geo');

  return (
    <section className="px-4 py-12">
      <div className="container mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-amber-400/10 to-red-500/15 p-6 md:p-10">
          <div className="mb-8 text-center">
            <h2 className="flex flex-col items-center justify-center gap-2 text-2xl font-bold tracking-tight md:flex-row md:text-3xl lg:text-4xl">
              <Flame className="h-7 w-7 shrink-0 text-orange-500" aria-hidden="true" />
              {t('title')}
            </h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-base font-medium md:text-lg">
              {t('subtitle')}
            </p>
            <div className="mt-4 flex justify-center">
              <TemperatureUnitToggle />
            </div>
          </div>

          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {parks.map((park, i) => {
              const { icon: WeatherIcon, color } = getWeatherConfig(park.weatherCode ?? 0);
              const country = translateGeoSlug(
                tGeo,
                'countries',
                park.countrySlug,
                park.countryName
              );
              return (
                <Link
                  key={park.slug}
                  href={park.href}
                  aria-label={`${park.name} — ${t('viewPark')}`}
                  className="group border-border/40 bg-background/70 relative flex flex-col items-center gap-2 rounded-2xl border p-5 text-center shadow-sm backdrop-blur-sm transition hover:border-orange-500/50 hover:shadow-md"
                >
                  <span className="text-muted-foreground/50 absolute top-3 left-3 text-xs font-bold tabular-nums">
                    #{i + 1}
                  </span>
                  <WeatherIcon className={`h-8 w-8 shrink-0 ${color}`} aria-hidden="true" />
                  <span className="inline-flex items-center gap-1.5 text-4xl font-bold">
                    <Temp celsius={park.temperatureMaxC} />
                    {isHeatWarning(park.temperatureMaxC) && (
                      <HeatWarningBadge label={tWeather('heatWarning')} />
                    )}
                  </span>
                  {park.currentTempC != null && (
                    <span className="text-muted-foreground text-xs">
                      {tWeather('nowLabel')} <Temp celsius={park.currentTempC} />
                    </span>
                  )}
                  <span className="group-hover:text-primary mt-1 text-base font-semibold transition-colors">
                    {park.name}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {park.city} · {country}
                  </span>
                  <span className="text-primary mt-1 inline-flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
                    {t('viewPark')}
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
