import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading placeholder for <AttractionHistorySections>, held until the client-side detail fetch
 * resolves.
 *
 * It has to mirror <AttractionHistoryGrid> row for row, and it stopped doing that when that grid
 * changed shape: this reserved a 7-column calendar of square cells while the real thing renders
 * `grid-cols-2 md:grid-cols-7` of ~142px day cards under a legend row. The reservation came out
 * hundreds of pixels short, and the ride page's largest measured shift was this section dropping
 * in at full height (+812px on desktop, `pnpm measure:cls`).
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-7 w-64 max-w-full" />
            <div className="flex flex-wrap items-center gap-2">
              {['w-24', 'w-24', 'w-32', 'w-28'].map((w) => (
                <Skeleton key={w} className={`h-7 ${w} rounded-md`} />
              ))}
            </div>
          </div>

          {/* Same grid, same day count, same card height as the real one. 31 = today plus the
              30 days back that the grid builds; the card height is measured, not guessed. */}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-7">
            {Array.from({ length: 31 }).map((_, i) => (
              <Skeleton key={i} className="h-[142px] w-full rounded-xl" />
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
