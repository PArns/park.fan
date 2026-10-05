import type { LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatShowClock } from '@/lib/push/show-clock';
import { formatTime } from '@/lib/utils/intl-format';

/**
 * The colours a block takes, each the colour of the status badge it sits under.
 *
 * `outage` is the DOWN badge's orange, for both outage signals (`OutageNote`).
 * `idle` is a slate grey for a ride that has not run yet today
 * (`NotRunTodayNote`): that line claims no fault, so it may not borrow the
 * fault's colour, and red would read as the closed badge shouting twice.
 *
 * The chip is a solid fill with a white glyph in both tones, the pair the
 * status badges already print their labels in.
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
 * The block a ride's standing still is said in: a solid icon chip, a bold line,
 * an optional second line, and whatever sits under a hairline below them.
 *
 * One component for every such block, because they stand on the same cards and
 * a reader compares them side by side: a „steht still" block that was drawn a
 * little differently from a „Störung" block was read as a different thing, and
 * was reported as such. What may differ is the tone and the words.
 *
 * `compact` is a park page's ride card — card text colours, 11 to 12 px.
 * `full` is the ride page's live panel.
 *
 * ## Centring
 *
 * Each line is cut to its cap height and baseline (`text-box`), so
 * `items-center` centres the letters on the chip rather than the line boxes.
 * Geist reserves more room under the baseline than over the caps, and a lone
 * line sat visibly high in the block: 24 px of block above the caps and 28 px
 * below the baseline, measured off a reader's screenshot. The gaps only open up
 * where the trim applies; a browser without `text-box` keeps the line boxes and
 * the old gaps.
 *
 * ## data-nosnippet
 *
 * On the root `<div>`, one of the three elements Google honours it on. Every
 * sentence a block holds is true for as long as it is on the page and false the
 * moment the ride runs again, which is the reason the outage line gives.
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
 * Weekday and clock time in the park's zone, as a phrase in the reader's
 * language: „Sonntag, 21:00 Uhr", „Sunday at 09:00 PM", „zondag 21:00 uur".
 *
 * Every instant a block names goes through here, so „seit Montag, 09:38 Uhr"
 * and „zuletzt Sonntag, 18:00 Uhr" are the same format on the same card. The
 * time is `formatShowClock`, the park-zone clock every other time on the site
 * reads like. The phrase around it is a message (`parks.rideStatus.weekdayTime`)
 * because `Intl` writes neither the „Uhr" nor the „at", and both belong to the
 * time in the languages that use them — the same split as „um {time} Uhr" on
 * the show alerts.
 *
 * The weekday is never relative („gestern"): which day is yesterday cannot be
 * decided identically on both sides of hydration, and the API keeps every
 * instant it sends a block inside the last week, where a weekday is
 * unambiguous.
 *
 * `null` for an instant or a zone `Intl` cannot read, which the caller renders
 * as the sentence for an unknown start rather than a time in the wrong zone.
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
