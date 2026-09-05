import { Skeleton } from '@/components/ui/skeleton';

/**
 * The box today's wait-time chart stands in until it can draw itself.
 *
 * There are TWO waits here, and until this component existed the second one reserved nothing.
 * `LiveAttractionData` holds this box while the detail fetch is in flight; then it renders the
 * chart, and `DailyWaitTimeChartClient` — which carries a `useMounted()` gate of its own, one
 * commit behind its parent's — returns `null` for a frame. Measured on Phantasialand/Talocan at
 * 390 px: the card went to 24 px of Fancast link and nothing else at 200 ms, and the chart
 * arriving at 250 ms pushed that link down **269 px**. It was 0.129 of a 0.126 CLS, i.e. all of
 * it, and it looked like a chart-height problem because the settled card is the right height.
 *
 * One component for both waits fixes it by construction: whatever the chart cannot draw yet, this
 * is standing in its place at the same height.
 *
 * The rows mirror the chart's anatomy — explainer, legend, plot, best-slot line, the Fancast link
 * — and there is no title row, because the ride page's chart draws no title (`hideTitle`; its
 * chapter heading says it).
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
