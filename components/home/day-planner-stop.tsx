import { CalendarClock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { getPlannerMenu } from '@/lib/navigation/planner-menu';
import { plannerPath } from '@/lib/planner/segments';
import { HomeDayPlannerBoard } from './day-planner-board';
import { HomeDayPlannerParks } from './day-planner-parks';
import { HomeStop, StopLink } from './home-stop';

/**
 * The homepage's stop for the day planner, right under the trip regions: the heading with the
 * planner page as its link, under it the planner band's parks as quick starts
 * (`getPlannerMenu`, which the layout has already asked for), and beside it Parky's board
 * ({@link HomeDayPlannerBoard}). Its clicks count as `day_home`, its place as `home_day`.
 */
export async function DayPlannerHomeStop({ locale }: { locale: Locale }) {
  const [t, tNav, { parks }] = await Promise.all([
    getTranslations('homeStory.dayPlanner'),
    getTranslations('navigation'),
    getPlannerMenu(locale),
  ]);
  const href = plannerPath(locale);
  return (
    <HomeStop
      flushTop
      block="day_home"
      heading={
        <ChapterHeading
          variant="stop"
          icon={CalendarClock}
          kicker={tNav('planner')}
          title={tNav('dayPlannerTitle')}
          hint={t('lead')}
          action={<StopLink href={href}>{t('link')}</StopLink>}
        />
      }
      aside={<HomeDayPlannerParks parks={parks} />}
    >
      <HomeDayPlannerBoard plannerHref={href} />
    </HomeStop>
  );
}
