import { YearlyOutlookFrame } from '@/components/parks/park-yearly-outlook-section';
import { buildYearlyOutlook } from '@/lib/utils/yearly-outlook';

/**
 * What the page holds open while the forecast is in flight.
 *
 * It is not a grey box shaped like the chapter — it is the chapter, over an empty frame.
 * `buildYearlyOutlook([], todayIso)` produces the same twelve months the settled section draws,
 * with every day slot unfilled, and the heading needs no data at all. So the reservation is the
 * real geometry at every breakpoint and in both themes rather than a pixel count somebody
 * measured once and left behind (docs/rules/a-streamed-section-owes-the-page-its-height.md).
 *
 * One state it cannot hold: a park whose forecast carries no day the backend can rate renders no
 * chapter, and this box collapses when the boundary resolves. Measured 2026-09-22 across forty
 * parks, six had no forecast at all and two more had one made entirely of `unknown` — so eight of
 * forty collapse and thirty-two do not, which is the side of that trade-off the rule asks for. A
 * TIMEOUT is not one of those cases any more: the section renders this same empty frame then,
 * because a slow fetch is not evidence of anything.
 */
export function ParkYearlyOutlookSkeleton({
  todayIso,
  locale,
  className,
}: {
  todayIso: string;
  locale: string;
  className?: string;
}) {
  return (
    <YearlyOutlookFrame
      months={buildYearlyOutlook([], todayIso)}
      locale={locale}
      muted
      className={className}
    />
  );
}
