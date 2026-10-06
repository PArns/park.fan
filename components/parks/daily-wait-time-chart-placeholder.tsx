import { Skeleton } from '@/components/ui/skeleton';

/**
 * The box today's wait-time chart stands in until it can draw itself.
 *
 * One component for both waits, `LiveAttractionData`'s detail fetch and the chart's own mount
 * gate, so whatever cannot draw yet is stood in for at the same height. The rows mirror the
 * chart's anatomy, with no title row because the ride page's chart draws none (`hideTitle`).
 * See docs/rules/a-streamed-section-owes-the-page-its-height.md.
 */
export function DailyWaitTimeChartPlaceholder() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="h-5 w-full max-w-md" />
      <Skeleton className="h-4 w-48 max-w-full" />
      <Skeleton className="h-[145px] w-full rounded-lg sm:h-[160px] md:h-[189px]" />
      <Skeleton className="h-4 w-40 max-w-full" />
      <Skeleton className="h-5 w-32 max-w-full" />
    </div>
  );
}
