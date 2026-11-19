import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Route } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { TripRegionPlanner } from '@/components/trip-regions/planner/trip-region-planner';
import { TRIP_PLANNER_ID } from '@/lib/trip-regions/paths';
import { tripPlannerPhotos } from '@/lib/trip-regions/plan-photos';
import { asksForTickets, leanTicketCatalog, ticketCatalog } from '@/lib/trip-regions/plan-tickets';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { requireTripRegion } from '@/lib/trip-regions/registry';
import { TicketsAsk } from '@/components/trip-regions/planner/plan-tickets-card';
import { getTripRegionTickets } from '@/lib/trip-regions/api';
import { catchNonFatal } from '@/lib/api/client';
import { withSeedTimeout } from '@/lib/api/seed-timeout';
import type { TripRegion } from '@/lib/trip-regions/types';
import { HubLandingOnly, HubPlannerOnly, HubStateSwitch } from './hub-trip-state';

/** How long the chapter waits for the ticket catalog before it uses the region's copy. */
const CATALOG_TIMEOUT_MS = 1500;

/**
 * The planner chapter around the trip planner (`TripRegionPlanner`), in the hub's two states: on the landing
 * page „So plant der Reiseplaner deine Tage in Orlando“ with `landing` (the four steps) above the planner, with
 * a plan „Deine Reise“ and the plan. Under the landing's steps stands „Schon Tickets? Eintragen“,
 * which starts the assistant on its Tickets step, since bought tickets may set the dates. The
 * heading belongs to the page, so the planner draws none of
 * its own; the anchor is the hero action's and Parky's (`#planner`). The park photos are resolved here because the planner is a Client Component and
 * may not import the media database. The ticket catalog comes from its own route, which the admin's
 * edits revalidate by tag, else from the region's `tickets`, without the notes only the server reads.
 */
export async function PlannerChapterSlot({
  region,
  locale,
  defaultMonth,
  landing,
}: {
  /** What the chapter shows before the planner on the landing page (`HubHowItWorks`). */
  landing?: ReactNode;
  region: TripRegion;
  locale: string;
  /** `YYYY-MM` on a month page, so the date sheet opens on that month. */
  defaultMonth?: string;
}) {
  const t = await getTranslations('tripHub.howItWorks');
  const tNav = await getRegionTranslations(region.slug, 'nav');
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
        icon={Route}
        title={
          <HubStateSwitch
            landing={t('title', { inRegion: tNav('inRegion') })}
            plan={t('planTitle')}
          />
        }
      />
      {landing && (
        <HubLandingOnly className="mb-8 space-y-4">
          {landing}
          {asksForTickets(requireTripRegion(region.slug).tickets, ticketCatalog(tickets)) && (
            <TicketsAsk />
          )}
        </HubLandingOnly>
      )}
      <HubPlannerOnly>
        <TripRegionPlanner
          region={tickets ? { ...region, tickets: leanTicketCatalog(tickets) } : region}
          locale={locale}
          defaultMonth={defaultMonth}
          photos={tripPlannerPhotos(region)}
        />
      </HubPlannerOnly>
    </section>
  );
}
