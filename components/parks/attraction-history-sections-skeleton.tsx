import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading placeholder for <AttractionHistorySections>, held until the client-side detail fetch
 * resolves.
 *
 * It has to mirror <AttractionHistoryGrid> row for row, and it stopped doing that when that grid
 * changed shape: this reserved a 7-column calendar of square cells while the real thing renders
 * `grid-cols-2 @min-[768px]/page:grid-cols-7` of ~142px day cards under a legend row. The
 * reservation came out hundreds of pixels short, and the ride page's largest measured shift was
 * this section dropping in at full height (+812px on desktop, `pnpm measure:cls`).
 *
 * The numbers below are measured, not guessed — re-run the script after changing the day card and
 * correct them here, because nothing else will notice.
 */
export function AttractionHistorySectionsSkeleton() {
  // No wrapper element: <AttractionHistorySections> returns the section inside a fragment,
  // and an extra div here makes the placeholder a different shape from what replaces it.
  return (
    <section className="mb-8" aria-hidden="true">
      {/* The nesting mirrors <AttractionHistoryGrid> exactly — Card > div.space-y-4 > rows.
          Putting `space-y-4` on the Card instead looks the same but is one level short, and
          then the placeholder grid and the real grid sit at different depths. */}
      <Card className="relative p-4 md:p-6">
        <div className="space-y-4">
          {/* Title row + the legend badges beside it (closed · holiday · school · bridge day) */}
          <div className="flex flex-col gap-4 @min-[768px]/page:flex-row @min-[768px]/page:items-center @min-[768px]/page:justify-between">
            <Skeleton className="h-7 w-64 max-w-full" />
            <div className="flex flex-wrap items-center gap-2">
              {['w-24', 'w-24', 'w-32', 'w-28'].map((w) => (
                <Skeleton key={w} className={`h-7 ${w} rounded-md`} />
              ))}
            </div>
          </div>

          {/* Same grid, same day count, same card height as the real one. 31 = today plus the
              30 days back that the grid builds.

              The height is FOUR numbers because a day card has no fixed height: it is a label
              row over a bar chart in a cell whose width the column count decides, so it grows
              as the cells get narrower. One `h-[142px]` for every width was right at ≥1280 and
              wrong everywhere else — the grid measured 2261/908/793/718 px against a
              2392/742/742/742 px reservation, i.e. the section came out 135 px too tall on a
              phone and 166 px too SHORT between 768 and 1023, where the layout switches to
              seven columns before the cells are wide enough to keep the cards flat. Measured
              per breakpoint off the real grid (`div.grid` in <AttractionHistoryGrid>, height
              divided by its row count) — re-measure after changing the day card, because
              nothing else will notice. */}
          <div className="grid grid-cols-2 gap-2 @min-[768px]/page:grid-cols-7">
            {Array.from({ length: 31 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-[134px] w-full rounded-xl @min-[768px]/page:h-[175px] @min-[1024px]/page:h-[152px] @min-[1280px]/page:h-[137px]"
              />
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
