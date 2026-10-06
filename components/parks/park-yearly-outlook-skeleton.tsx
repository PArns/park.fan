import { YearlyOutlookFrame } from '@/components/parks/park-yearly-outlook-section';
import { buildYearlyOutlook } from '@/lib/utils/yearly-outlook';

/**
 * What the page holds open while the forecast is in flight: the chapter itself over an empty frame
 * (`buildYearlyOutlook([], todayIso)`), so the reservation is the real geometry at every breakpoint
 * and in both themes (docs/rules/a-streamed-section-owes-the-page-its-height.md). It collapses only
 * for a park whose forecast has no ratable day; a timeout renders this same empty frame.
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
