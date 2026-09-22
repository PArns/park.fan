import { getTranslations } from 'next-intl/server';
import { CalendarRange } from 'lucide-react';

import { ChapterHeading } from '@/components/common/chapter-heading';
import {
  OUTLOOK_LIST_CLASS,
  OutlookMonthRow,
} from '@/components/parks/park-yearly-outlook-section';
import { buildYearlyOutlook } from '@/lib/utils/yearly-outlook';
import { cn } from '@/lib/utils';

/**
 * What the page holds open while the forecast is in flight.
 *
 * It is not a grey box shaped like the chapter — it is the chapter, over an empty frame. The
 * heading needs no data at all (its hint says what the rows are, not how far they reach), and
 * `buildYearlyOutlook([], todayIso)` produces the same twelve months the settled section draws,
 * with every day slot unfilled. So the reservation is the real geometry at every breakpoint and
 * in both themes rather than a pixel count somebody measured once and left behind
 * (docs/rules/a-streamed-section-owes-the-page-its-height.md).
 *
 * The badge and the count keep their boxes and go `invisible`: a row that already read „Keine
 * Prognose" would be making a claim the page cannot make until the fetch lands.
 *
 * One state it cannot hold: a park the forecast does not cover at all renders no chapter, and
 * this box collapses when the boundary resolves. Measured 2026-09-22 over fifteen parks spread
 * across the catalogue, fourteen of them had a forecast — so reserving is the outcome the large
 * majority of readers get, which is the side of that trade-off the rule asks for.
 */
export async function ParkYearlyOutlookSkeleton({
  todayIso,
  locale,
  className,
}: {
  todayIso: string;
  locale: string;
  className?: string;
}) {
  const t = await getTranslations('parks.yearlyOutlook');
  const months = buildYearlyOutlook([], todayIso);

  return (
    <section className={cn('mt-8', className)} aria-hidden="true">
      <ChapterHeading
        icon={CalendarRange}
        title={t('title')}
        hint={t('hint')}
        frosted
        className="mb-0 rounded-b-none"
      />

      <ul className={OUTLOOK_LIST_CLASS}>
        {months.map((month) => (
          <OutlookMonthRow
            key={month.key}
            month={month}
            locale={locale}
            recommendedLabel={null}
            muted
          />
        ))}
      </ul>
    </section>
  );
}
