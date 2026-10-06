import { getTranslations } from 'next-intl/server';
import { Ban } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterPanel } from '@/components/common/chapter-panel';
import { formatClosedMonth } from '@/lib/parks/closed-ride';
import { stripNewPrefix } from '@/lib/utils';
import type { ClosedAttraction } from '@/lib/api/types';

interface ClosedRidesListProps {
  /** `closedAttractions` off the FULL park payload — the client snapshot is stripped of it. */
  rides: ClosedAttraction[] | undefined;
  /** Locale-relative park path; each row links to `<parkPath>/<slug>`. */
  parkPath: string;
  locale: string;
  className?: string;
}

/**
 * The park's rides that closed for good, under its live ride list.
 *
 * A list apart, never rows in the live grid: that grid is the park today, and a closed ride among
 * the open ones would be counted, filtered and planned like one. An editor can take a ride off
 * this list in the admin; its page stays. Server-rendered from data the page already holds, and
 * nothing for a park without a closed ride. See docs/rules/a-closed-ride-keeps-its-page.md.
 */
export async function ClosedRidesList({
  rides,
  parkPath,
  locale,
  className,
}: ClosedRidesListProps) {
  if (!rides?.length) return null;
  const t = await getTranslations('parks.closedRides');

  return (
    <ChapterPanel icon={Ban} title={t('title')} id="closed-rides" className={className}>
      <ul className="divide-border/50 divide-y">
        {rides.map((ride) => (
          <li
            key={ride.id}
            className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2 first:pt-0 last:pb-0"
          >
            <Link
              href={`${parkPath}/${ride.slug}` as '/parks/europe/germany/rust/europa-park'}
              prefetch={false}
              className="text-primary hover:text-primary/80 font-medium underline decoration-dotted underline-offset-4"
            >
              {stripNewPrefix(ride.name)}
            </Link>
            <span className="text-muted-foreground text-sm">
              {[ride.land, t('since', { month: formatClosedMonth(ride.retiredAt, locale) })]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </li>
        ))}
      </ul>
    </ChapterPanel>
  );
}
