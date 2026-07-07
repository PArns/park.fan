import { getTranslations } from 'next-intl/server';
import { Flame, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
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

// Rank chip colours — gold / silver / bronze.
const RANK_BADGE = [
  'bg-amber-400/90 text-amber-950',
  'bg-slate-300/80 text-slate-800',
  'bg-orange-400/80 text-orange-950',
];

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
        <div className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-amber-400/10 to-red-500/15 p-6 shadow-sm md:p-10">
          {/* Warm decorative glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-28 -right-20 h-72 w-72 rounded-full bg-orange-400/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-red-500/15 blur-3xl"
          />

          <div className="relative">
            <div className="mb-8 flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-700 dark:text-orange-300">
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                {t('badge')}
              </span>
              <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                {t('title')}
              </h2>
              <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-sm leading-relaxed md:text-base">
                {t('description')}
              </p>
              <div className="mt-5">
                <TemperatureUnitToggle />
              </div>
            </div>

            {/* Flex-wrap (not a fixed grid) so a partial heat wave with only 1–2 qualifying
                parks stays centered instead of leaving an empty trailing column. Three
                fixed-width (w-72) cards fill max-w-4xl exactly; fewer just center. */}
            <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-4">
              {parks.map((park, i) => {
                const { icon: WeatherIcon, label, color } = getWeatherConfig(park.weatherCode ?? 0);
                const country = translateGeoSlug(
                  tGeo,
                  'countries',
                  park.countrySlug,
                  park.countryName
                );
                const isTop = i === 0;
                return (
                  <Link
                    key={park.slug}
                    href={park.href}
                    aria-label={`${park.name} — ${t('viewPark')}`}
                    className={cn(
                      'group bg-background/70 relative flex w-full flex-col items-center gap-1.5 rounded-2xl border p-6 text-center shadow-sm backdrop-blur-sm transition hover:shadow-lg sm:w-72',
                      isTop
                        ? 'border-orange-400/60 ring-1 ring-orange-400/40'
                        : 'border-border/40 hover:border-orange-400/40'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-3 left-3 grid size-6 place-items-center rounded-full text-[11px] font-bold tabular-nums',
                        RANK_BADGE[i] ?? RANK_BADGE[2]
                      )}
                    >
                      {i + 1}
                    </span>
                    {isTop && (
                      <span className="absolute top-3 right-3 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-300">
                        {t('hottestLabel')}
                      </span>
                    )}

                    <WeatherIcon
                      className={cn('mt-2 h-9 w-9 shrink-0 drop-shadow-sm', color)}
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground text-xs font-medium">
                      {tWeather(label)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-5xl leading-none font-bold">
                      <Temp celsius={park.temperatureC} />
                      {isHeatWarning(park.temperatureC) && (
                        <HeatWarningBadge label={tWeather('heatWarning')} />
                      )}
                    </span>

                    <span className="group-hover:text-primary mt-2 text-lg font-semibold transition-colors">
                      {park.name}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {park.city} · {country}
                    </span>
                    <span className="text-primary mt-1.5 inline-flex items-center gap-1 text-xs font-medium opacity-70 transition-opacity group-hover:opacity-100">
                      {t('viewPark')}
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
