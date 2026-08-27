import { Skeleton } from '@/components/ui/skeleton';
import { TILE_GLASS } from '@/components/common/glass-card';
import { PANEL_CELL, PanelGrid } from '@/components/parks/park-panel-cell';
import { cn } from '@/lib/utils';
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
 * `parkName`/`parkSlug`/`locale` are required, because the header IS the reservation: an earlier
 * version made them optional and fell back to grey boxes, which is the shape this file exists to
 * avoid — and which drifted out of date the moment the header changed.
 */
export function ParkBestDaysSectionSkeleton({
  parkName,
  parkSlug,
  locale,
  showCalendarLink = false,
}: {
  parkName: string;
  parkSlug: string;
  locale: string;
  /** Mirror the header's calendar button — pass what <ParkBestDaysSection> gets, or the
   *  reservation is short by the button's height on every breakpoint that wraps it. */
  showCalendarLink?: boolean;
}) {
  return (
    <section className="mt-8 space-y-4">
      {/* Header and the three cards are ONE box, the way „Monat für Monat" and its month
        stepper are: the band squares off its bottom, the card underneath drops its top border
        and radius, and the chapter reads as one object instead of a lid resting on a gap of
        park photograph. */}
      <div>
        <ParkBestDaysHeader
          parkName={parkName}
          parkSlug={parkSlug}
          locale={locale}
          showCalendarLink={showCalendarLink}
          className="mb-0 rounded-b-none"
        />

        {/* The three data cards. Chip geometry mirrors <DayChip> (`px-3 py-1 text-sm` → 30px tall,
          `gap-2` between them) so the rows line up with the real ones. The date card carries five
          chips because that is what wraps to the same two rows the real list takes at both
          breakpoints — its length varies with the park (0–8 upcoming quiet days), so this is the
          middle of the range rather than a value that is exact for one park and wrong for the next. */}
        {/* Mirrors the real columns exactly — same wrapper, same `PANEL_CELL`, same caption line.
          Anything that differs here is a jump the moment the seed lands, and on the park page the
          whole attraction grid hangs below this section. */}
        <div
          className={cn(
            TILE_GLASS,
            'border-border/50 overflow-hidden rounded-b-xl border border-t-0'
          )}
        >
          <PanelGrid columnCount={3}>
            {[
              { titleWidth: 'w-40', chips: 3, chipWidth: 'w-12' }, // quietest weekdays
              { titleWidth: 'w-36', chips: 1, chipWidth: 'w-12' }, // best weekend day
              { titleWidth: 'w-36', chips: 5, chipWidth: 'w-24' }, // upcoming quiet days
            ].map((card, i) => (
              <div key={i} className={PANEL_CELL} aria-hidden="true">
                <div className="flex min-w-0 flex-col gap-1.5">
                  {/* The caption is `text-[10px]` with `gap-1` — 15px tall, icon included. */}
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3" />
                    <Skeleton className={`h-[15px] ${card.titleWidth} max-w-full`} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: card.chips }).map((_, j) => (
                      <Skeleton key={j} className={`h-[30px] ${card.chipWidth} rounded-md`} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </PanelGrid>
        </div>
      </div>
    </section>
  );
}
