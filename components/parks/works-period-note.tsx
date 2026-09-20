import { Construction } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { GlassNotice } from '@/components/parks/glass-notice';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import type { WorksPeriod } from '@/lib/api/types';
import { isWorksPeriodActive } from '@/lib/utils/works-period';

interface WorksPeriodNoteProps {
  /** The curated window from the API. Renders nothing when absent. */
  worksPeriod?: WorksPeriod | null;
  /** The park's own day as `YYYY-MM-DD`, computed on the server. */
  todayIso?: string;
  className?: string;
}

/**
 * The ride page's sentence about a curated rebuild: since when, and until when.
 *
 * The badge beside the ride's name says THAT the ride is being rebuilt; this
 * says how long, which is the only part a visitor can plan around. It sits
 * where `NoLiveWaitTimesNotice` sits — above the chapters rather than inside
 * the live one — because it is the answer to the question the empty live panel
 * above it has already raised.
 *
 * ## Why the end date has two forms
 *
 * A park that has announced a reopening date and an editor who has guessed one
 * are not the same claim, and the API keeps them apart in `toUncertain`. „bis
 * voraussichtlich zum 3. März" is a date a visitor may not book a trip around;
 * „bis zum 3. März" is. Writing the second where we only know the first is the
 * one mistake this note can make that costs somebody a day at a park.
 *
 * ## The dates are days, not instants
 *
 * Both bounds are park-local calendar days. They are anchored at noon UTC and
 * formatted in UTC, so no offset can move them onto the neighbouring day — the
 * same treatment `ParkSeasonsCard` gives its season ranges.
 */
export function WorksPeriodNote({ worksPeriod, todayIso, className }: WorksPeriodNoteProps) {
  const t = useTranslations('parks.worksPeriod');
  const locale = useLocale();

  if (!worksPeriod || !isWorksPeriodActive(worksPeriod, todayIso)) return null;

  const { from, to, toUncertain } = worksPeriod;
  const fromLabel = from ? formatDay(locale, from) : null;
  const toLabel = to ? formatDay(locale, to) : null;

  // A half-open window is the normal case while work is running, so all three
  // shapes are real. The fourth — neither bound — cannot be active and has
  // already returned above.
  let body: string;
  if (fromLabel && toLabel) {
    body = t(toUncertain ? 'sinceUntilUncertain' : 'sinceUntil', { from: fromLabel, to: toLabel });
  } else if (fromLabel) {
    body = t('since', { from: fromLabel });
  } else if (toLabel) {
    body = t(toUncertain ? 'untilUncertain' : 'until', { to: toLabel });
  } else {
    return null;
  }

  return (
    <GlassNotice
      icon={Construction}
      title={t('label')}
      tintClassName="bg-orange-500/5 dark:bg-orange-500/10"
      iconClassName="text-orange-600 dark:text-orange-400"
      className={className}
    >
      {body}
    </GlassNotice>
  );
}

/** A park-local `YYYY-MM-DD` as a written date, with no timezone able to shift it. */
function formatDay(locale: string, isoDay: string): string {
  const day = new Date(`${isoDay}T12:00:00Z`);
  if (Number.isNaN(day.getTime())) return isoDay;

  return getDateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(day);
}
