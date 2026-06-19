'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DayOfWeekWait, TypicalWaitBucket, TypicalWaits } from '@/lib/api/types';

interface AttractionTypicalWaitsProps {
  typicalWaits?: TypicalWaits | null;
  className?: string;
}

/** Mon→Sun display order, mapped to API dayOfWeek (0=Sun…6=Sat). */
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Locale-aware short weekday name for an API dayOfWeek (0=Sun…6=Sat). */
function dayLabel(dayOfWeek: number, locale: string): string {
  // 2024-01-07 is a Sunday; + dayOfWeek lands on the right weekday.
  const d = new Date(Date.UTC(2024, 0, 7 + dayOfWeek));
  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(d);
}

function formatPeakDate(date: string, locale: string): string {
  // Date-only string — anchor at noon to avoid a timezone day-shift.
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function AttractionTypicalWaits({ typicalWaits, className }: AttractionTypicalWaitsProps) {
  const t = useTranslations('attractions.typicalWaits');
  const locale = useLocale();

  // Gate on the server's `displayable` flag, not a client threshold.
  if (!typicalWaits || !typicalWaits.displayable) return null;

  const { weekday, weekend, byDayOfWeek, peak, windowDays } = typicalWaits;

  const byDow = new Map<number, DayOfWeekWait>(byDayOfWeek.map((d) => [d.dayOfWeek, d]));
  const scaleMax = Math.max(
    1,
    ...byDayOfWeek.map((d) => d.busy ?? 0),
    weekday.busy ?? 0,
    weekend.busy ?? 0
  );

  return (
    <section
      className={cn('rounded-xl border bg-card/60 p-5 backdrop-blur-sm', className)}
      aria-label={t('title')}
    >
      <div className="mb-4 flex items-center gap-2">
        <Hourglass className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
        <h3 className="text-sm font-semibold">{t('title')}</h3>
        <span className="text-muted-foreground ml-auto text-xs">
          {t('basedOn', { days: windowDays })}
        </span>
      </div>

      {/* Weekday vs weekend summary */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <SummaryCard label={t('weekdays')} bucket={weekday} typicalLabel={t('typical')} busyLabel={t('busy')} unit={t('min')} />
        <SummaryCard label={t('weekend')} bucket={weekend} typicalLabel={t('typical')} busyLabel={t('busy')} unit={t('min')} />
      </div>

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
              <span className="text-muted-foreground text-[10px] leading-none tabular-nums">
                {busy != null ? busy : ''}
              </span>
              <div className="bg-muted/40 relative w-full flex-1 overflow-hidden rounded-t">
                {/* Busy (P90) — light extension */}
                <div
                  className="bg-primary/25 absolute inset-x-0 bottom-0 rounded-t"
                  style={{ height: `${busyPct}%` }}
                />
                {/* Typical (P50) — solid */}
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
        <span className="flex items-center gap-1.5">
          <span className="bg-primary/25 h-2 w-2 rounded-sm" aria-hidden="true" />
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
      <div className="mt-1.5 flex items-end gap-4">
        <div>
          <p className="text-foreground text-lg leading-none font-semibold">
            {bucket.typical ?? '–'}
            <span className="text-muted-foreground ml-0.5 text-xs font-normal">{unit}</span>
          </p>
          <p className="text-muted-foreground mt-0.5 text-[10px]">{typicalLabel}</p>
        </div>
        <div>
          <p className="text-primary text-lg leading-none font-semibold">
            {bucket.busy ?? '–'}
            <span className="text-muted-foreground ml-0.5 text-xs font-normal">{unit}</span>
          </p>
          <p className="text-muted-foreground mt-0.5 text-[10px]">{busyLabel}</p>
        </div>
      </div>
    </div>
  );
}
