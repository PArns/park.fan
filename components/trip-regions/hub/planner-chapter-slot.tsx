import { getTranslations } from 'next-intl/server';
import { Route } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { TripRegionPlanner } from '@/components/trip-regions/planner/trip-region-planner';
import { TRIP_PLANNER_ID } from '@/lib/trip-regions/paths';
import { tripPlannerPhotos } from '@/lib/trip-regions/plan-photos';
import { leanTicketCatalog } from '@/lib/trip-regions/plan-tickets';
import { getTripRegionTickets } from '@/lib/trip-regions/api';
import { catchNonFatal } from '@/lib/api/client';
import { withSeedTimeout } from '@/lib/api/seed-timeout';
import type { TripRegion } from '@/lib/trip-regions/types';

/** How long the chapter waits for the ticket catalog before it uses the region's copy. */
const CATALOG_TIMEOUT_MS = 1500;

/**
 * The "Plan your trip" chapter around the trip planner (`TripRegionPlanner`). The heading belongs to
 * the page, so the planner draws none of its own; the anchor is the hero action's and Parky's
 * (`#planner`). The park photos are resolved here because the planner is a Client Component and
 * may not import the media database. The ticket catalog comes from its own route, which the admin's
 * edits revalidate by tag, else from the region's `tickets`, without the notes only the server reads.
 */
export async function PlannerChapterSlot({
  index,
  region,
  locale,
  defaultMonth,
}: {
  /** The chapter's number on the page. */
  index: string;
  region: TripRegion;
  locale: string;
  /** `YYYY-MM` on a month page, so the date sheet opens on that month. */
  defaultMonth?: string;
}) {
  const t = await getTranslations('tripHub.planner');
  const catalog = await withSeedTimeout(
    catchNonFatal(getTripRegionTickets(region.slug)),
    CATALOG_TIMEOUT_MS
  );
  const tickets = catalog?.tickets ?? region.tickets;
  return (
    <section
      id={TRIP_PLANNER_ID}
      className="scroll-mt-24"
      data-planner-slot=""
      data-region={region.slug}
      data-locale={locale}
      data-default-month={defaultMonth}
    >
      <ChapterHeading
        index={index}
        icon={Route}
        kicker={t('kicker')}
        title={t('title')}
        hint={t('hint')}
      />
      <TripRegionPlanner
        region={tickets ? { ...region, tickets: leanTicketCatalog(tickets) } : region}
        locale={locale}
        defaultMonth={defaultMonth}
        photos={tripPlannerPhotos(region)}
      />
    </section>
  );
}
