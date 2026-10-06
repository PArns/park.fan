import type { LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatShowClock } from '@/lib/push/show-clock';
import { formatTime } from '@/lib/utils/intl-format';

/**
 * The colours a block takes, each the colour of the status badge it sits under. `outage` is the
 * DOWN badge's orange (`OutageNote`); `idle` is slate for a ride that has not run yet today
 * (`NotRunTodayNote`), which claims no fault and may not borrow a fault's colour.
 */
const TONES = {
  outage: {
    box: 'border-status-down/25 bg-status-down/10',
    chip: 'bg-badge-status-down',
    rule: 'border-status-down/20',
  },
  idle: {
    box: 'border-slate-500/25 bg-slate-500/10',
    chip: 'bg-slate-500',
    rule: 'border-slate-500/20',
  },
} as const;

/** Which of the block's colours it takes. */
export type RideStatusTone = keyof typeof TONES;

/**
 * The classes for a section under the block's hairline, in the block's tint.
 *
 * Exported rather than applied inside the block, because the section is a
 * component of its own (`OutageEstimateNote`) with its own root.
 */
export function rideStatusFooterClass(tone: RideStatusTone, variant: 'compact' | 'full'): string {
  return cn(
    'border-t tabular-nums',
    TONES[tone].rule,
    variant === 'full'
      ? 'text-muted-foreground mt-3 gap-1.5 pt-3 text-xs supports-[text-box:trim-both_cap_alphabetic]:gap-2.5'
      : 'mt-2 pt-2 text-[11px] leading-tight text-(--pk-text-2) supports-[text-box:trim-both_cap_alphabetic]:mt-2.5 supports-[text-box:trim-both_cap_alphabetic]:gap-2 supports-[text-box:trim-both_cap_alphabetic]:pt-2.5'
  );
}

/**
 * The block a ride's standing still is said in: a solid icon chip, a bold line, an optional second
 * line, and whatever sits under a hairline. One component for every such block, because readers
 * compare them side by side on one card; only tone and words may differ. `compact` is a park page's
 * ride card, `full` the ride page's live panel.
 *
 * Each line is trimmed to cap height and baseline (`text-box`), so `items-center` centres the
 * letters on the chip; Geist reserves more room under the baseline than over the caps.
 * `data-nosnippet` sits on the root `<div>`, one of the elements Google honours it on, because
 * every sentence here turns false the moment the ride runs again.
 */
export function RideStatusBlock({
  icon: Icon,
  tone,
  title,
  detail,
  variant = 'compact',
  className,
  children,
}: {
  icon: LucideIcon;
  tone: RideStatusTone;
  title: string;
  detail?: string | null;
  variant?: 'compact' | 'full';
  className?: string;
  /** The section under the hairline, which brings its own root and its own rule. */
  children?: ReactNode;
}) {
  const full = variant === 'full';
  const colours = TONES[tone];

  return (
    <div
      className={cn('rounded-xl border', colours.box, full ? 'p-3' : 'px-2.5 py-2', className)}
      data-nosnippet
    >
      <div className={cn('flex items-center', full ? 'gap-3' : 'gap-2.5')}>
        <span
          className={cn(
            'grid shrink-0 place-items-center rounded-full text-white shadow-sm',
            colours.chip,
            full ? 'size-8' : 'size-6'
          )}
          aria-hidden="true"
        >
          <Icon className={full ? 'size-4' : 'size-3.5'} />
        </span>
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col gap-0.5',
            full
              ? 'supports-[text-box:trim-both_cap_alphabetic]:gap-2.5'
              : 'supports-[text-box:trim-both_cap_alphabetic]:gap-2'
          )}
        >
          <span
            className={cn(
              'font-semibold tabular-nums [text-box:trim-both_cap_alphabetic]',
              full ? 'text-foreground text-sm leading-snug' : 'text-[12px] leading-tight'
            )}
            style={full ? undefined : { color: 'var(--pk-text-1)' }}
          >
            {title}
          </span>
          {detail ? (
            <span
              className={cn(
                'tabular-nums [text-box:trim-both_cap_alphabetic]',
                full ? 'text-muted-foreground text-xs' : 'text-[11px] leading-tight'
              )}
              style={full ? undefined : { color: 'var(--pk-text-2)' }}
            >
              {detail}
            </span>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * Weekday and clock time in the park's zone as a phrase in the reader's language („Sonntag, 21:00
 * Uhr", „Sunday at 09:00 PM"), so every instant a block names reads the same. The phrase is a
 * message (`parks.rideStatus.weekdayTime`) because `Intl` writes neither the „Uhr" nor the „at".
 * Never relative („gestern"), which hydration cannot decide identically on both sides. `null` for
 * an instant or zone `Intl` cannot read.
 */
export function useWeekdayTime(timezone: string | undefined): (iso: string) => string | null {
  const t = useTranslations('parks.rideStatus');
  const locale = useLocale();
  return (iso) => {
    const time = formatShowClock(iso, timezone ?? null, locale);
    if (time === null) return null;
    const weekday = formatTime(new Date(iso), locale, { weekday: 'long', timeZone: timezone });
    return t('weekdayTime', { weekday, time });
  };
}
