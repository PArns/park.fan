import { getTranslations } from 'next-intl/server';
import { Route } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { OrlandoPlanner } from '@/components/orlando/planner/orlando-planner';
import { ORLANDO_PLANNER_ID } from '@/lib/orlando/paths';
import { orlandoPlannerPhotos } from '@/lib/orlando/plan-photos';
import type { TripRegion } from '@/lib/orlando/types';

/**
 * The "Plan your trip" chapter around the trip planner (`OrlandoPlanner`). The heading belongs to
 * the page, so the planner draws none of its own; the anchor is the hero action's and Parky's
 * (`#planner`). The park photos are resolved here because the planner is a Client Component and
 * may not import the media database.
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
        region={region}
        locale={locale}
        defaultMonth={defaultMonth}
        photos={orlandoPlannerPhotos(region)}
      />
    </section>
  );
}
