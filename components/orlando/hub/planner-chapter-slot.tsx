import { getTranslations } from 'next-intl/server';
import { Route } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { OrlandoPlanner } from '@/components/orlando/planner/orlando-planner';
import { ORLANDO_PLANNER_ID } from '@/lib/orlando/paths';
import { orlandoPlannerPhotos } from '@/lib/orlando/plan-photos';
import { leanTicketCatalog } from '@/lib/orlando/plan-tickets';
import { getOrlandoTickets } from '@/lib/orlando/api';
import { catchNonFatal } from '@/lib/api/client';
import { withSeedTimeout } from '@/lib/api/seed-timeout';
import type { TripRegion } from '@/lib/orlando/types';

/** How long the chapter waits for the ticket catalog before it uses the region's copy. */
const CATALOG_TIMEOUT_MS = 1500;

/**
 * The "Plan your trip" chapter around the trip planner (`OrlandoPlanner`). The heading belongs to
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
  const t = await getTranslations('orlando.planner');
  const catalog = await withSeedTimeout(catchNonFatal(getOrlandoTickets()), CATALOG_TIMEOUT_MS);
  const tickets = catalog?.tickets ?? region.tickets;
  return (
    <section
      id={ORLANDO_PLANNER_ID}
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
      <OrlandoPlanner
        region={tickets ? { ...region, tickets: leanTicketCatalog(tickets) } : region}
        locale={locale}
        defaultMonth={defaultMonth}
        photos={orlandoPlannerPhotos(region)}
      />
    </section>
  );
}
