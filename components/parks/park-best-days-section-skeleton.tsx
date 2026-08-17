import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ParkBestDaysHeader } from '@/components/parks/park-best-days-header';

/**
 * Loading placeholder for <ParkBestDaysSection> (non-compact). Its job is to hold the exact box the
 * real section will occupy: on the park page this sits inside the streamed best-days slot, and on
 * desktop the whole attraction grid hangs below it — so every pixel the reservation is off by is a
 * pixel the ride list jumps when the boundary resolves.
 *
 * It renders the REAL header (see <ParkBestDaysHeader>) instead of grey boxes shaped like one: the
 * header needs no calendar data, and its height depends on how the park name and subtitle wrap,
 * which fixed-width placeholders got wrong by 66–120px on a phone. Only the three data cards below
 * are placeholders, each reserving a header line and one row of chips — which is what the real
 * cards hold.
 *
 * The one thing it cannot mirror is the school-holiday warning under the grid: whether that renders
 * depends on the very calendar data the boundary is still waiting for. Reserving it unconditionally
 * would leave an empty band on every park whose holidays are unremarkable, so it is left out and
 * the remaining ~46px (desktop) / ~86px (mobile) of movement is accepted.
 *
 * `parkName`/`locale` are optional: without them the header is skipped and only the cards are
 * reserved. Pass them wherever the reservation has content below it — on the park page that is the
 * entire attraction grid.
 */
export function ParkBestDaysSectionSkeleton({
  parkName,
  parkSlug,
  locale,
  showCalendarLink = false,
}: {
  parkName?: string;
  parkSlug?: string;
  locale?: string;
  /** Mirror the header's calendar button — pass what <ParkBestDaysSection> gets, or the
   *  reservation is short by the button's height on every breakpoint that wraps it. */
  showCalendarLink?: boolean;
}) {
  return (
    <section className="mt-8 space-y-4">
      {parkName && locale ? (
        <ParkBestDaysHeader
          parkName={parkName}
          parkSlug={parkSlug ?? ''}
          locale={locale}
          showCalendarLink={showCalendarLink}
        />
      ) : (
        <div className="bg-background/70 rounded-xl px-4 py-3 backdrop-blur-md" aria-hidden="true">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-7 w-64 max-w-full" />
          </div>
          <Skeleton className="mt-1 h-5 w-72 max-w-full" />
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      )}

      {/* The three data cards. Chip geometry mirrors <DayChip> (`px-3 py-1 text-sm` → 30px tall,
          `gap-2` between them) so the rows line up with the real ones. The date card carries five
          chips because that is what wraps to the same two rows the real list takes at both
          breakpoints — its length varies with the park (0–8 upcoming quiet days), so this is the
          middle of the range rather than a value that is exact for one park and wrong for the next. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {[
          { titleWidth: 'w-40', chips: 3, chipWidth: 'w-12' }, // quietest weekdays
          { titleWidth: 'w-36', chips: 1, chipWidth: 'w-12' }, // best weekend day
          { titleWidth: 'w-36', chips: 5, chipWidth: 'w-24' }, // upcoming quiet days
        ].map((card, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className={`h-6 ${card.titleWidth} max-w-full`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: card.chips }).map((_, j) => (
                  <Skeleton key={j} className={`h-[30px] ${card.chipWidth} rounded-md`} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
