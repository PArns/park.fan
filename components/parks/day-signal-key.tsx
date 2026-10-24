import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

/**
 * One key of a day-signal legend: the mark, then the word. Shared by the calendar's legend and the
 * park page's twelve-month outlook, so a school break is the same yellow bar under the same word in
 * both. `style` is for a mark a class cannot draw, such as the closed-day hatch.
 */
export function DaySignalKey({
  className,
  style,
  label,
}: {
  className: string;
  style?: CSSProperties;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span
        className={cn('h-[3px] w-4 shrink-0 rounded-full', className)}
        style={style}
        aria-hidden="true"
      />
      <span className="text-[11px]">{label}</span>
    </span>
  );
}

/**
 * A day signal as a chip, for a panel that names one day's holidays: the signal's colour as a dot,
 * then the word („Weihnachtsferien", „Feiertag").
 */
export function DaySignalChip({ className, label }: { className: string; label: string }) {
  return (
    <span className="border-border/60 bg-muted/50 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap">
      <span className={cn('size-1.5 shrink-0 rounded-full', className)} aria-hidden="true" />
      {label}
    </span>
  );
}
