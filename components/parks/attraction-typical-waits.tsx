'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Hourglass } from 'lucide-react';
import { SectionHeading } from '@/components/common/section-heading';
import { cn } from '@/lib/utils';
import type { DayOfWeekWait, TypicalWaitBucket, TypicalWaits } from '@/lib/api/types';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { roundWaitTo5 } from '@/lib/utils/wait-time';

interface AttractionTypicalWaitsProps {
  typicalWaits?: TypicalWaits | null;
  /**
   * Drop the card's own fill, border and padding, for a `PANEL_CELL` that already draws all
   * three. Same reason as `RopeDropCard`'s: a card inside a cell is a second frame around one
   * piece of content.
   */
  bare?: boolean;
  className?: string;
}

/** Mon→Sun display order, mapped to API dayOfWeek (0=Sun…6=Sat). */
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/*
 * One colour rank, in all three places this card states a number.
 *
 * „Normal" (P50) is the accent and „Voll" (P90) is the recessive tone — everywhere. The two
 * halves used to say the opposite of each other: in the summary tiles the BLUE number was Voll
 * and Normal was plain white, while in the bars and the legend blue was Normal and Voll a wash
 * of the same blue. The same colour meant two things on one card, a quarter of an inch apart.
 *
 * The tiles carry it as the legend's two swatches rather than by tinting the digits, because a
 * `text-primary` figure is 3.47 : 1 on the light card and `text-lg font-semibold` is 18 px at
 * 600 — not WCAG "large text", so it owes 4.5. A swatch owes 3, which the same colour clears.
 *
 * The wash is also why the bar looked like it ended at the Normal value while the number above it
 * was the Voll one. `bg-primary/25` over the `bg-muted/40` track computes to a contrast of
 * **1.32:1 in light and 1.40:1 in dark** — the segment was very nearly not drawn. And it cannot
 * be fixed by opacity: the track is rgb(251,251,251) in light mode and `bg-primary` itself only
 * reaches 3.36:1 against it, so there is no third tone that clears 3:1 from BOTH the track and
 * the solid segment. The boundary has to be a line rather than a fill difference, so the Voll
 * segment carries a solid `bg-primary` top rule — 3.36:1 light, 5.24:1 dark, over the track —
 * and the fill is raised to /40 to read as a body rather than to carry the contrast alone.
 */
const BUSY_FILL = 'bg-primary/40';
const BUSY_EDGE = 'bg-primary';

/** Locale-aware short weekday name for an API dayOfWeek (0=Sun…6=Sat). */
function dayLabel(dayOfWeek: number, locale: string): string {
  // 2024-01-07 is a Sunday; + dayOfWeek lands on the right weekday.
  const d = new Date(Date.UTC(2024, 0, 7 + dayOfWeek));
  return getDateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(d);
}

/**
 * The record peak's date, in the reader's locale.
 *
 * Exported because the ride page's header panel prints the same sentence, and printed it raw:
 * „Rekord 135 Min · 2026-07-16" in the panel against „Rekord 135 Min · 16. Juli 2026" in this
 * card, on one page. The same trap the park panel's `peakHour` documents one component over.
 */
export function formatPeakDate(date: string, locale: string): string {
  // Date-only string — anchor at noon to avoid a timezone day-shift.
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return getDateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function AttractionTypicalWaits({
  typicalWaits,
  bare = false,
  className,
}: AttractionTypicalWaitsProps) {
  const t = useTranslations('attractions.typicalWaits');
  const locale = useLocale();

  // Gate on the server's `displayable` flag, not a client threshold.
  if (!typicalWaits || !typicalWaits.displayable) return null;

  const raw = typicalWaits;
  const { windowDays } = raw;

  // Both numbers are `PERCENTILE_CONT` output, so an API build that has not rounded
  // hands back 53 and 67. Rounded once here rather than at each of the six render
  // sites, and the bars are drawn from the same values as their labels — a bar at
  // 78/scaleMax under a label reading 80 is a picture disagreeing with its caption.
  const round = (v: number | null | undefined) => (v == null ? null : roundWaitTo5(v));
  const roundBucket = (b: TypicalWaitBucket): TypicalWaitBucket => ({
    ...b,
    typical: round(b.typical),
    busy: round(b.busy),
  });

  const weekday = roundBucket(raw.weekday);
  const weekend = roundBucket(raw.weekend);
  const byDayOfWeek = raw.byDayOfWeek.map((d) => ({
    ...d,
    typical: round(d.typical),
    busy: round(d.busy),
  }));
  const peak = raw.peak ? { ...raw.peak, value: roundWaitTo5(raw.peak.value) } : raw.peak;

  const byDow = new Map<number, DayOfWeekWait>(byDayOfWeek.map((d) => [d.dayOfWeek, d]));
  const scaleMax = Math.max(
    1,
    ...byDayOfWeek.map((d) => d.busy ?? 0),
    weekday.busy ?? 0,
    weekend.busy ?? 0
  );

  return (
    <section
      className={cn(!bare && 'bg-card/60 rounded-xl border p-5 backdrop-blur-sm', className)}
      aria-label={t('title')}
    >
      {/* Same card title as its neighbour <RopeDropCard>: the two sit side by side
          in the "plan your visit" chapter and used to disagree by a font size. */}
      <SectionHeading
        icon={Hourglass}
        title={t('title')}
        hint={t('basedOn', { days: windowDays })}
        variant="plain"
        as="h3"
      />

      {/* Weekday vs weekend summary */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <SummaryCard
          label={t('weekdays')}
          bucket={weekday}
          typicalLabel={t('typical')}
          busyLabel={t('busy')}
          unit={t('min')}
        />
        <SummaryCard
          label={t('weekend')}
          bucket={weekend}
          typicalLabel={t('typical')}
          busyLabel={t('busy')}
          unit={t('min')}
        />
      </div>

      {/* Which of the two readings the row of numbers is. It was the card's one unnamed figure:
          the tiles label both of theirs, the bars have the legend, and the seven numbers above
          them had only their colour to go by — which says nothing, because `text-muted-foreground`
          computes to lab(66.13 0 0) in dark and lab(48.50 0 0) in light, i.e. achromatic, and
          therefore sits outside the Normal/Voll rank entirely. Each column's `title` carries the
          pair, but only for a reader whose pointer can hover. The swatch is the legend's own, so
          the caption names the rank in the same two ways the rest of the card does, and a lone
          label at the left edge of a seven-column row would read as the Monday column's. */}
      <p className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[10px] leading-none">
        <span
          className={cn(BUSY_FILL, 'ring-primary h-2 w-2 shrink-0 rounded-sm ring-1')}
          aria-hidden="true"
        />
        {t('barNumbers', { label: t('busy') })}
      </p>

      {/* Per-day breakdown */}
      <div className="flex h-28 items-stretch gap-1.5">
        {DISPLAY_ORDER.map((dow) => {
          const d = byDow.get(dow);
          const busy = d?.busy ?? null;
          const typical = d?.typical ?? null;
          const busyPct = busy != null ? (busy / scaleMax) * 100 : 0;
          const typicalPct = typical != null ? (typical / scaleMax) * 100 : 0;
          const isWeekend = d?.isWeekend ?? (dow === 0 || dow === 6);
          const title =
            busy != null && typical != null
              ? `${dayLabel(dow, locale)}: ${typical}–${busy} ${t('min')}`
              : dayLabel(dow, locale);
          return (
            <div key={dow} className="flex flex-1 flex-col items-center gap-1" title={title}>
              {/* The Voll value. Which of the two it is comes from the caption above the row, not
                from this figure's colour — it is `text-muted-foreground` and therefore achromatic.
                Printing „typical–busy" here instead was measured and rejected: 217 of the
                catalogue's 5,942 ride-days round to seven characters („100–145"), which is ~40 px
                of tabular 10 px text in a column that is ~36 px wide at a 360 px viewport, and the
                seven columns are `flex-1`, so the overflow would push the row past the card rather
                than wrap. */}
              <span className="text-muted-foreground text-[10px] leading-none tabular-nums">
                {busy != null ? busy : ''}
              </span>
              <div className="bg-muted/40 relative w-full flex-1 overflow-hidden rounded-t">
                {/* Busy (P90) — the recessive fill, and a solid top rule that is what actually
                  carries the „the bar reaches here" reading (see BUSY_FILL/BUSY_EDGE above). */}
                {busy != null && (
                  <div
                    className={cn(BUSY_FILL, 'absolute inset-x-0 bottom-0 rounded-t')}
                    style={{ height: `${busyPct}%` }}
                  >
                    <span
                      className={cn(BUSY_EDGE, 'absolute inset-x-0 top-0 h-px')}
                      aria-hidden="true"
                    />
                  </div>
                )}
                {/* Typical (P50) — solid accent */}
                <div
                  className="bg-primary absolute inset-x-0 bottom-0 rounded-t"
                  style={{ height: `${typicalPct}%` }}
                />
              </div>
              <span
                className={cn(
                  'text-[10px]',
                  isWeekend ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {dayLabel(dow, locale)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend + record peak */}
      <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="bg-primary h-2 w-2 rounded-sm" aria-hidden="true" />
          {t('typical')}
        </span>
        {/* The Voll swatch is the bar's Voll segment at 8 px: recessive fill, solid outline. The
          outline is the part that has to be seen — a `/25` square on the page background computed
          to 1.33:1 in light and 1.36:1 in dark, i.e. a legend entry with no visible key. */}
        <span className="flex items-center gap-1.5">
          <span
            className={cn(BUSY_FILL, 'ring-primary h-2 w-2 rounded-sm ring-1')}
            aria-hidden="true"
          />
          {t('busy')}
        </span>
        {peak ? (
          <span className="ml-auto">
            {t('peak', { value: peak.value, date: formatPeakDate(peak.date, locale) })}
          </span>
        ) : null}
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  bucket,
  typicalLabel,
  busyLabel,
  unit,
}: {
  label: string;
  bucket: TypicalWaitBucket;
  typicalLabel: string;
  busyLabel: string;
  unit: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      {/* The rank is carried by the same two swatches the bars and the legend use, not by the
        colour of the digits. The tiles used to say the opposite of the chart — blue was Voll
        here and Normal there — and colouring the Normal figure `text-primary` to fix that would
        put a 3.47 : 1 number on the light card at `text-lg font-semibold`, which is 18 px at 600
        and therefore not WCAG "large text": it needs 4.5. The accent moves to an 8 px square,
        where 3 : 1 is the bar to clear, and both figures keep a text-grade contrast
        (19.8 : 1 and 4.73 : 1 light, 19.0 : 1 and 7.63 : 1 dark). */}
      {/* `flex-wrap`, because the two readings side by side are wider than the tile wherever the
        card is narrow, and this card has no floor: it is half of the `grid-cols-2` above, the
        card is a `PanelGrid` column on the ride page (262.5 px at a 640 px window — narrower
        than the 286 px it gets on a 360 px phone), and on the guide page it sits in a
        `DemoFrame` inside a container, which leaves 254 px of card at 320 px and a 100 px tile.

        Measured against each tile's content box, in all six locales:

          ride page @640    before #452  4.8–8.8 px over, i.e. into the 12 px of `p-3`
                            after  #452  6.8–16.8 px — the two labels each gained an 8 px swatch
                                         with the colour rank, so nl („Normaal"/„Druk") and it
                                         („Normale"/„Pieno") now cross the tile's border by
                                         1.8–4.8 px and the card's right edge by 3.8 and 2.8
          guide page @320   after  #452  32–42 px over in EVERY locale — the Voll column sits
                                         outside its own tile, over the gap and the next one
          guide page @360   after  #452  12–22 px, still past the border in all six
          everywhere        with wrap    0 px

        What binds is the LABEL row, not the digits: the same card with three-digit figures
        (Chiapas, 100/115 min) overran by exactly the same amount. Shrinking `gap-4` to `gap-2`
        was measured as the alternative and rejected — it buys 8 px, which is not half of what
        the guide page needs, and it would leave the tile stacking in some languages and not in
        others. The invariant is worth the 42 px the tile grows where it wraps: the two readings
        sit side by side while they fit inside the padding, and stack when they do not, in every
        language at the same time. */}
      <div className="mt-1.5 flex flex-wrap items-end gap-x-4 gap-y-1.5">
        <div>
          <p className="text-foreground text-lg leading-none font-semibold">
            {bucket.typical ?? '–'}
            <span className="text-muted-foreground ml-0.5 text-xs font-normal">{unit}</span>
          </p>
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[10px]">
            <span className="bg-primary h-2 w-2 shrink-0 rounded-sm" aria-hidden="true" />
            {typicalLabel}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-lg leading-none font-semibold">
            {bucket.busy ?? '–'}
            <span className="text-muted-foreground ml-0.5 text-xs font-normal">{unit}</span>
          </p>
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[10px]">
            <span
              className={cn(BUSY_FILL, 'ring-primary h-2 w-2 shrink-0 rounded-sm ring-1')}
              aria-hidden="true"
            />
            {busyLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
