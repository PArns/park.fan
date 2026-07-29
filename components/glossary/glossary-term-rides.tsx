import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { RollerCoaster, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/common/glass-card';
import { PageSection } from '@/components/common/page-section';
import { getAttractionsForTerm } from '@/lib/api/glossary-rides';
import type { TermAttraction } from '@/lib/api/types';

interface GlossaryTermRidesProps {
  termId: string;
  /**
   * How many rides to list below the highlights before the "and N more" line.
   *
   * Kept short on purpose: a term like "Abschuss" has 92 curated rides, and a
   * wall of every one of them buries the three that are worth knowing about.
   */
  limit?: number;
}

type ParkPath = '/parks/europe/germany/rust/europa-park';

const parkPath = (ride: TermAttraction) =>
  `${ride.continentSlug}/${ride.countrySlug}/${ride.citySlug}/${ride.parkSlug}`;

/** Rides grouped by the park they are in, parks alphabetically. */
function groupByPark(rides: TermAttraction[]) {
  const groups = new Map<string, { parkName: string; rides: TermAttraction[] }>();
  for (const ride of rides) {
    const key = parkPath(ride);
    const group = groups.get(key) ?? { parkName: ride.parkName, rides: [] };
    group.rides.push(ride);
    groups.set(key, group);
  }
  // The list arrives ranked now, not alphabetically, so the groups have to be
  // re-sorted here — otherwise they come out in ranking order and read as random.
  return [...groups.entries()]
    .map(([path, group]) => ({ path, ...group }))
    .sort((a, b) => a.parkName.localeCompare(b.parkName));
}

/**
 * The glossary → rides half of the link: the curated rides that feature this
 * term, whether as a track figure, a ride type, or its builder.
 *
 * Leads with the rides worth recognising rather than whichever park sorts first
 * alphabetically — "Abschuss" has 92 of them, and opening on "Adventureland
 * Resort" tells nobody anything.
 *
 * Renders nothing when no ride carries the term — most of the glossary is
 * concepts (airtime, rope drop, grey zone) that no ride profile references, and
 * an empty "found on these rides" box would be worse than no box.
 */
export async function GlossaryTermRides({ termId, limit = 12 }: GlossaryTermRidesProps) {
  const rides = await getAttractionsForTerm(termId, 'popularity');
  if (rides.length === 0) return null;

  const t = await getTranslations('glossary.rides');

  // `!= null` on purpose: the API strips null-valued keys from its responses,
  // so a ride with no baseline has NO `typicalPeakWait` key at all. Only rides
  // we can put a real number against may claim a place in the highlights.
  const top = rides.filter((ride) => ride.typicalPeakWait != null).slice(0, 3);

  // Whatever is highlighted above should not be repeated immediately below.
  const topSlugs = new Set(top.map((ride) => `${parkPath(ride)}/${ride.slug}`));
  const rest = rides.filter((ride) => !topSlugs.has(`${parkPath(ride)}/${ride.slug}`));
  const shown = rest.slice(0, limit);
  const hidden = rest.length - shown.length;

  return (
    /* The same chapter unit the ride page uses — section, heading and the
       spacing around them in one place, so this page and that one cannot drift
       apart again. `id` keeps the #rides anchor and its scroll offset. */
    <PageSection
      icon={RollerCoaster}
      title={t('title')}
      badge={<Badge variant="secondary">{rides.length}</Badge>}
      id="rides"
      frosted
    >
      <GlassCard className="space-y-6 p-5 sm:p-6">
        {top.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t('topTitle')}
            </h3>
            {/* A grid, not a fixed three-column row: a term can have fewer than
                three rides (celestial-spin has exactly one) and a rigid raster
                would leave holes. */}
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {top.map((ride) => (
                <li key={`top-${parkPath(ride)}/${ride.slug}`}>
                  <Link
                    href={`/parks/${parkPath(ride)}/${ride.slug}` as ParkPath}
                    className="border-border/60 hover:border-primary/40 hover:bg-primary/5 group block h-full rounded-lg border p-3 transition-colors"
                  >
                    <span className="group-hover:text-primary block text-sm font-semibold transition-colors">
                      {ride.name}
                    </span>
                    <span className="text-muted-foreground block text-xs">{ride.parkName}</span>
                    <span className="text-muted-foreground mt-1.5 flex items-center gap-1 text-xs tabular-nums">
                      <Timer className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {t('typicalWait', { minutes: ride.typicalPeakWait as number })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {shown.length > 0 && (
          <div className="space-y-2">
            {/* "More rides", not "All rides": the three highlighted above are
                deliberately not repeated here, so a heading claiming to list all
                of them sends people hunting for the ride they just saw. */}
            {top.length > 0 && (
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {t('restTitle')}
              </h3>
            )}
            <ul className="divide-border/60 divide-y">
              {groupByPark(shown).map((group) => (
                <li key={group.path} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-muted-foreground mb-1.5 text-xs font-medium">
                    {group.parkName}
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {group.rides.map((ride) => (
                      <li key={ride.slug}>
                        <Link
                          href={`/parks/${group.path}/${ride.slug}` as ParkPath}
                          className="border-border/60 hover:border-primary/40 hover:bg-primary/5 hover:text-primary inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium transition-colors"
                        >
                          {ride.name}
                          {ride.openedYear != null && (
                            <span className="text-muted-foreground text-xs tabular-nums">
                              {ride.openedYear}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            {hidden > 0 && (
              <p className="text-muted-foreground mt-4 text-sm">{t('more', { count: hidden })}</p>
            )}
          </div>
        )}
      </GlassCard>
    </PageSection>
  );
}
