'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';
import { useTripRegionLinks } from '@/lib/hooks/use-trip-region-links';
import { findTripRegion, tripPlannerHref } from '@/lib/orlando/trip-links';
import { plannerParkPath } from '@/lib/planner/park-url';
import type { PlannerGeo } from '@/lib/planner/types';

interface PlannerTripRegionLinkProps {
  /** The plan's parks that hold a planned day (`plannedParks`). */
  parks: ReadonlyArray<{ slug: string; geo: PlannerGeo }>;
  /** Runs on the press, before the hub opens: the phone sheet closes, which would cover it. */
  onNavigate?: () => void;
  className?: string;
}

/**
 * One quiet line under a plan that holds a day at a trip region's park: "Several days in Orlando?
 * Open the trip planner", with the plan's parks of that region chosen. One per plan, under the
 * list of its days, never per day; the band's own words (`orlando.band`), so the two cannot
 * drift. The regions are asked for only once such a plan exists; until they answer, and for a
 * plan elsewhere, it renders nothing.
 */
export function PlannerTripRegionLink({
  parks,
  onNavigate,
  className,
}: PlannerTripRegionLinkProps) {
  const t = useTranslations('orlando.band');
  const paths = useMemo(() => parks.map(plannerParkPath), [parks]);
  const { data: regions } = useTripRegionLinks(paths.length > 0);
  const found = regions ? findTripRegion(regions, paths) : null;
  if (!found) return null;

  return (
    <p
      data-planner-trip-region={found.region.slug}
      {...linkBlockAttributes('trip_band')}
      className={cn(
        'text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 px-2 text-xs',
        className
      )}
    >
      <CalendarDays aria-hidden className="text-primary size-3.5 shrink-0" />
      <span>{t('title', { region: found.region.name })}</span>
      <Link
        href={tripPlannerHref(found.region, { parks: found.parks.map((park) => park.slug) })}
        rel="nofollow"
        prefetch={false}
        onClick={onNavigate}
        className="text-primary-ink planner-phone:min-h-11 inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline"
      >
        {t('open')}
        <ArrowRight aria-hidden className="size-3.5 shrink-0" />
      </Link>
    </p>
  );
}
