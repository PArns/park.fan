import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { RollerCoaster, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { LISTING_CARD_CLASS } from '@/components/blog/post-stream';
import { cn } from '@/lib/utils';
import { getAttractionsForTerm } from '@/lib/api/glossary-rides';
import type { TermAttraction } from '@/lib/api/types';
import type { GlossaryCategory } from '@/lib/glossary/types';

interface GlossaryTermRidesProps {
  termId: string;
  /** Picks the heading: a builder or a ride type is not a "figure". */
  category: GlossaryCategory;
  /**
   * How many rides to list below the highlights before the "and N more" toggle.
   *
   * Kept short on purpose: a term like "Abschuss" has 92 curated rides, and a
   * wall of every one of them buries the three that are worth knowing about.
   * The rest sits collapsed in the same HTML, so every ride stays one link away.
   */
  limit?: number;
}

/** The categories whose rides get a heading of their own; every other term keeps `title`. */
const TITLED_CATEGORIES = new Set<GlossaryCategory>([
  'coasters',
  'manufacturers',
  'coaster-elements',
  'attractions',
]);

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
  // The list arrives ranked, so the groups are re-sorted by park name here.
  return [...groups.entries()]
    .map(([path, group]) => ({ path, ...group }))
    .sort((a, b) => a.parkName.localeCompare(b.parkName));
}

/**
 * The rides of a list, one block per park with its rides as chips, the parks side by side: most
 * parks have one or two rides for a term, and a row each stacked a dozen of them a screen tall.
 */
function RideGroups({ rides }: { rides: TermAttraction[] }) {
  return (
    <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2 @min-[1280px]/page:grid-cols-3">
      {groupByPark(rides).map((group) => (
        <li key={group.path}>
          <p className="text-muted-foreground mb-1.5 text-xs font-medium">{group.parkName}</p>
          <ul className="flex flex-wrap gap-2">
            {group.rides.map((ride) => (
              <li key={ride.slug}>
                <Link
                  href={`/parks/${group.path}/${ride.slug}` as ParkPath}
                  className="border-border bg-card hover:border-primary/40 hover:text-primary inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-medium shadow-sm transition-colors"
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
  );
}

/**
 * The glossary-to-rides half of the link: the curated rides that feature this term as a figure, a
 * ride type or its builder, led by the rides worth recognising rather than alphabetical order.
 * Renders nothing when no ride carries the term, as for most concepts.
 */
export async function GlossaryTermRides({ termId, category, limit = 12 }: GlossaryTermRidesProps) {
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
  const collapsed = rest.slice(limit);

  return (
    /* A chapter of the term page, opened the way every chapter on the site is. */
    <section>
      <ChapterHeading
        icon={RollerCoaster}
        title={TITLED_CATEGORIES.has(category) ? t(`titles.${category}`) : t('title')}
        badge={<Badge variant="secondary">{rides.length}</Badge>}
      />
      <div className="space-y-8">
        {top.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t('topTitle')}
            </h3>
            {/* A grid, not a fixed three-column row: a term can have fewer than
                three rides (celestial-spin has exactly one) and a rigid raster
                would leave holes. */}
            <ul className="grid gap-3 sm:grid-cols-2 @min-[1280px]/page:grid-cols-3">
              {top.map((ride) => (
                <li key={`top-${parkPath(ride)}/${ride.slug}`}>
                  <Link
                    href={`/parks/${parkPath(ride)}/${ride.slug}` as ParkPath}
                    className={cn(LISTING_CARD_CLASS, 'group block h-full')}
                  >
                    <span className="group-hover:text-primary block font-bold transition-colors">
                      {ride.name}
                    </span>
                    <span className="text-muted-foreground block text-sm">{ride.parkName}</span>
                    <span className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs font-medium tabular-nums">
                      <Timer className="text-primary h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {t('typicalWait', { minutes: ride.typicalPeakWait as number })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {shown.length > 0 && (
          <div className="space-y-3">
            {/* "More rides", not "All rides": the three highlighted above are
                deliberately not repeated here, so a heading claiming to list all
                of them sends people hunting for the ride they just saw. */}
            {top.length > 0 && (
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {t('restTitle')}
              </h3>
            )}
            <RideGroups rides={shown} />

            {/* A native <details>, not a client toggle: collapsed it keeps the list short, and
                every ride past the limit is still a link in the prerendered HTML. */}
            {collapsed.length > 0 && (
              <details className="mt-4">
                <summary className="text-muted-foreground hover:text-primary cursor-pointer text-sm font-medium transition-colors">
                  {t('more', { count: collapsed.length })}
                </summary>
                <div className="mt-3">
                  <RideGroups rides={collapsed} />
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
