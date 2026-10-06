'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Hourglass } from 'lucide-react';
import { SectionHeading } from '@/components/common/section-heading';
import { cn } from '@/lib/utils';
import type { DayOfWeekWait, TypicalWaitBucket, TypicalWaits } from '@/lib/api/types';
import { getDateTimeFormat, weekdayName } from '@/lib/utils/intl-format';
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
 * One colour rank in all three places this card states a number: „Normal" (P50) is the accent,
 * „Voll" (P90) the recessive tone. No fill opacity clears 3:1 from both the track and the solid
 * segment, so the Voll segment's boundary is a solid top rule and the fill only reads as a body.
 * See docs/rules/a-cell-is-gated-on-its-content-and-a-component-that-fills-one.md.
 */
const BUSY_FILL = 'bg-primary/40';
const BUSY_EDGE = 'bg-primary';

/**
 * The record peak's date, in the reader's locale.
 *
 * Exported so the ride page's header panel prints the same date as this card, not a raw ISO one.
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

/**
 * A ride's typical (P50) and busy (P90) waits: weekday against weekend, a bar per day of the week
 * and the record peak, rounded to five. Renders nothing unless the API marks the data displayable.
 */
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

  // Both numbers are `PERCENTILE_CONT` output and may arrive unrounded. Rounded once here, and
  // the bars are drawn from the same values as their labels, so a bar never disagrees with them.
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
      {/* Same card title as its neighbour <RopeDropCard>, which sits beside it. */}
      <SectionHeading
        icon={Hourglass}
        title={t('title')}
        hint={t('basedOn', { days: windowDays })}
        variant="plain"
        as="h3"
      />

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

      {/* Names which reading the row of numbers is: their muted colour is achromatic and outside
          the rank, and a column's `title` only reaches a pointer that can hover. With the swatch,
          because a lone label at the left edge would read as the Monday column's. */}
      <p className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[10px] leading-none">
        <span
          className={cn(BUSY_FILL, 'ring-primary h-2 w-2 shrink-0 rounded-sm ring-1')}
          aria-hidden="true"
        />
        {t('barNumbers', { label: t('busy') })}
      </p>

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
              ? `${weekdayName(dow, locale, 'short')}: ${typical}–${busy} ${t('min')}`
              : weekdayName(dow, locale, 'short');
          return (
            <div key={dow} className="flex flex-1 flex-col items-center gap-1" title={title}>
              {/* The Voll value, named by the caption above the row. „typical–busy" would not fit a
                column this narrow on a phone, and the row would run past the card. */}
              <span className="text-muted-foreground text-[10px] leading-none tabular-nums">
                {busy != null ? busy : ''}
              </span>
              <div className="bg-muted/40 relative w-full flex-1 overflow-hidden rounded-t">
                {/* The solid top rule, not the fill, says where the bar ends (see BUSY_EDGE). */}
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
                {weekdayName(dow, locale, 'short')}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="bg-primary h-2 w-2 rounded-sm" aria-hidden="true" />
          {t('typical')}
        </span>
        {/* The bar's Voll segment at 8 px: the outline is what has to be seen, since the fill
          alone barely shows on the page background. */}
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
      {/* The rank is carried by the swatches the bars and the legend use, not by the colour of
        the digits: a `text-primary` figure at this size misses text contrast, a swatch does not.
        `flex-wrap`, because the two readings are wider than the tile wherever the card is narrow
        (the ride page's `PanelGrid` column, the guide page's `DemoFrame`), and the label row is
        what binds: they sit side by side while they fit and stack when they do not. */}
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
