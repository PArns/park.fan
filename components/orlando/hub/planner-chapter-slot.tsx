import { getTranslations } from 'next-intl/server';
import { Route } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { ORLANDO_PLANNER_ID } from '@/lib/orlando/paths';
import type { TripRegion } from '@/lib/orlando/types';

/**
 * The "Plan your trip" chapter: the place the trip planner mounts (`OrlandoPlanner`,
 * `components/orlando/planner/orlando-planner.tsx`, with the same props). Until it does, the
 * chapter says what it will do and shows no trip: a sample presented as "your trip" is a stranger's
 * dates. The anchor is the hero action's and Parky's (`#planner`).
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
      <p className="text-muted-foreground max-w-2xl">{t('placeholder')}</p>
    </section>
  );
}
