import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { RollerCoaster } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/common/glass-card';
import { SectionHeading } from '@/components/common/section-heading';
import { getAttractionsForTerm } from '@/lib/api/glossary-rides';
import type { TermAttraction } from '@/lib/api/types';

interface GlossaryTermRidesProps {
  termId: string;
  /** How many rides to list before the "and N more" line. */
  limit?: number;
}

/** Rides grouped by the park they are in, parks in the order the API returned. */
function groupByPark(rides: TermAttraction[]) {
  const groups = new Map<string, { parkName: string; rides: TermAttraction[] }>();
  for (const ride of rides) {
    const key = `${ride.continentSlug}/${ride.countrySlug}/${ride.citySlug}/${ride.parkSlug}`;
    const group = groups.get(key) ?? { parkName: ride.parkName, rides: [] };
    group.rides.push(ride);
    groups.set(key, group);
  }
  return [...groups.entries()].map(([path, group]) => ({ path, ...group }));
}

/**
 * The glossary → rides half of the link: every curated ride that features this
 * term, whether as a track figure, a ride type, or its builder.
 *
 * Renders nothing when no ride carries the term — most of the glossary is
 * concepts (airtime, rope drop, grey zone) that no ride profile references, and
 * an empty "found on these rides" box would be worse than no box.
 */
export async function GlossaryTermRides({ termId, limit = 24 }: GlossaryTermRidesProps) {
  const rides = await getAttractionsForTerm(termId);
  if (rides.length === 0) return null;

  const t = await getTranslations('glossary.rides');
  const shown = rides.slice(0, limit);
  const hidden = rides.length - shown.length;

  return (
    <section className="space-y-4">
      <SectionHeading
        icon={RollerCoaster}
        title={t('title')}
        badge={<Badge variant="secondary">{rides.length}</Badge>}
        variant="plain"
        as="h2"
      />

      <GlassCard className="p-5 sm:p-6">
        <ul className="divide-border/60 divide-y">
          {groupByPark(shown).map((group) => (
            <li key={group.path} className="py-3 first:pt-0 last:pb-0">
              <p className="text-muted-foreground mb-1.5 text-xs font-medium">{group.parkName}</p>
              <ul className="flex flex-wrap gap-2">
                {group.rides.map((ride) => (
                  <li key={ride.slug}>
                    <Link
                      href={
                        `/parks/${group.path}/${ride.slug}` as '/parks/europe/germany/rust/europa-park'
                      }
                      className="border-border/60 hover:border-primary/40 hover:bg-primary/5 hover:text-primary inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium transition-colors"
                    >
                      {ride.name}
                      {ride.openedYear !== null && (
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
      </GlassCard>
    </section>
  );
}
