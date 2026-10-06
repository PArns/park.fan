'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { AttractionOutage, OutageEstimate } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { formatShortDuration, formatWholeHours } from '@/lib/utils/duration';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import {
  OUTAGE_BAR_HORIZON_MIN,
  OUTAGE_BAR_TICKS_MIN,
  OUTAGE_MIN_SEGMENT_PCT,
  outageRecoveryClock,
  outageRecoveryLine,
  outageRecoveryPercent,
  outageRemainingBar,
  outageRemainingWindow,
  type OutageRemainingBar,
} from '@/lib/utils/outage';

/**
 * "Wie lange dauert das noch?" — the one thing a visitor standing at a stopped
 * ride actually wants to know.
 *
 * Renders wherever a `DOWN` ride appears, always as the lower half of `OutageNote`'s block:
 * compact on a park page's ride card, in full in the ride page's live panel.
 *
 * It may be said where a breakdown forecast may not: the outage has already started, and the
 * figure describes what happened to the outages that got this far (calibrated out of sample, see
 * the API's `DowntimeRecoveryCurve`). The copy names that condition („Störungen, die schon so
 * lange dauern"), because the unconditional figure is wrong exactly for the long outages.
 *
 * A range, never a point: the distribution is heavy-tailed and a single number reads as a
 * promise. Past roughly two hours the upper quartile stops resolving and renders as an open
 * range („über …"); `outageRemainingWindow` reads both shapes the payload uses for that.
 *
 * A clock time where the API places one (`estimate.recoveryWindow`), a duration everywhere else:
 * `remaining` counts operating minutes and only the API knows the opening calendar, so nothing
 * here derives a time from minutes. The weekday comes from the instant alone, never from "now",
 * so both sides of hydration render the same text. No bar under a clock time: the bar's axis is
 * operating minutes and would contradict the sentence across a closing.
 *
 * The bar puts the window on a fixed „jetzt" to four-hours scale, so a short outage looks short
 * beside a long one (the trap `Sparkline`'s `yMax` exists for); its geometry is in
 * `outageRemainingBar`. Neither bar is in the accessibility tree: each restates the sentence
 * above it, inside the card's one `<Link>`. Not `components/ui/progress.tsx`, which fills from
 * zero and colours by value. Both bars are `bg-primary` on a white track, which clears 3:1 inside
 * `OutageNote`'s tinted block where the muted track vanishes; the ride's orange cannot reach 3:1.
 *
 * Percentages and minutes in steps of five (the calibration error is 2.55 points), from
 * `lib/utils/outage.ts`, and the bars use the same rounded figures as the sentence.
 * `data-nosnippet` for the same reason as `OutageNote`.
 */
export function OutageEstimateNote({
  estimate,
  signal,
  timezone,
  variant = 'compact',
  className,
}: {
  estimate: OutageEstimate | undefined;
  /**
   * Which signal placed the outage, because the sentence depends on it: a reported DOWN was
   * „behoben", an inferred `closed_gap` only „vorbei", since nothing says it was repaired. The
   * API reads each from its own curve. Anything that is not exactly `down` takes the closure
   * sentences, the same weaker-claim default `OutageNote` applies.
   */
  signal: AttractionOutage['signal'] | undefined;
  /**
   * The park's IANA timezone. A clock time is stated in the park's own clock,
   * the way every other time on these two surfaces is; without one the block
   * keeps the duration sentence rather than naming a time in whichever zone the
   * renderer happens to sit in.
   */
  timezone?: string;
  /**
   * `compact` says one thing, for a card where every row is shared with every
   * other card in the grid through the subgrid: the range and its bar, or the
   * probability and its meter where no range resolved. `full` says both, for the
   * ride page's live panel.
   */
  variant?: 'compact' | 'full';
  className?: string;
}) {
  // Both namespaces carry the same six sentence keys; the scale's „jetzt" is
  // the same word for either signal and lives only in the first.
  const tReported = useTranslations('parks.outage.estimate');
  const tStanding = useTranslations('parks.outage.estimateClosed');
  const t = signal === 'down' ? tReported : tStanding;
  const locale = useLocale();

  if (!estimate) return null;

  const percent = outageRecoveryPercent(estimate);
  const clock = outageRecoveryClock(estimate, timezone);
  const remaining = outageRemainingWindow(estimate);
  // Only under the duration sentence. Under a clock time the bar would be
  // drawn on the other unit — see the note on the component.
  const bar = clock ? null : outageRemainingBar(remaining);

  const range = clock
    ? clock.to === null
      ? t('clockRangeOpen', { from: formatClock(clock.from, timezone, locale, true) })
      : t('clockRange', {
          from: formatClock(clock.from, timezone, locale, true),
          to: formatClock(clock.to, timezone, locale, clock.toOnLaterDay),
        })
    : remaining
      ? remaining.to === null
        ? t('rangeOpen', {
            from: formatShortDuration(remaining.from, locale),
          })
        : t('range', {
            from: formatShortDuration(remaining.from, locale),
            to: formatShortDuration(remaining.to, locale),
          })
      : null;

  // A rounded 0 % would read as "never", a claim the curve does not make, so
  // `outageRecoveryPercent` answers `null` there and the range alone carries the block.
  if (percent === null && !range) return null;

  // Whether the probability is said here, and in which of its two sentences, takes three rules,
  // so `outageRecoveryLine` decides it and is tested there.
  const recovery = outageRecoveryLine(percent, variant, range !== null);

  return (
    <div className={cn('flex w-full flex-col gap-1', className)} data-nosnippet>
      {/* Cut to cap height and baseline like `OutageNote`'s own lines, so the block's last
          line sits as far from its lower edge as the first one does from the top. */}
      {range ? <span className="[text-box:trim-both_cap_alphabetic]">{range}</span> : null}
      {bar ? (
        <RemainingBar
          bar={bar}
          nowLabel={tReported('barNow')}
          endLabel={formatWholeHours(OUTAGE_BAR_HORIZON_MIN / 60, locale)}
        />
      ) : null}
      {recovery ? (
        <>
          <span className="[text-box:trim-both_cap_alphabetic]">
            {t(recovery.key, { percent: recovery.percent })}
          </span>
          <RecoveryMeter percent={recovery.percent} />
        </>
      ) : null}
    </div>
  );
}

/**
 * One end of the clock window, in the park's zone and the reader's language.
 *
 * `withWeekday` because a bare „11:00 Uhr" reads as today, which cannot be decided
 * identically on both sides of hydration; `outageRecoveryClock` has worked out which
 * end needs it. Falls back to the runtime's own zone rather than throwing, like
 * `OutageNote`: `outageRecoveryClock` already withheld the clock form for any zone
 * `Intl` refuses, so the fallback cannot disagree across hydration.
 */
function formatClock(
  instant: string,
  timezone: string | undefined,
  locale: string,
  withWeekday: boolean
): string {
  const options: Intl.DateTimeFormatOptions = {
    ...(withWeekday ? { weekday: 'long' as const } : {}),
    hour: '2-digit',
    minute: '2-digit',
  };
  const date = new Date(instant);
  try {
    return getDateTimeFormat(locale, { ...options, timeZone: timezone }).format(date);
  } catch {
    return getDateTimeFormat(locale, options).format(date);
  }
}

/**
 * The quartile window on the fixed „jetzt … 4 Std." scale.
 *
 * The two ends of the scale are labelled on the same line as the track rather
 * than on one of their own: on a ride card this renders in `OutageNote`'s block,
 * where a second text line costs every card in the grid row the same height.
 * Three hairlines mark the hours in between, so the reader has four intervals
 * and two labels rather than five labels.
 */
function RemainingBar({
  bar,
  nowLabel,
  endLabel,
}: {
  bar: OutageRemainingBar;
  nowLabel: string;
  endLabel: string;
}) {
  // How much of the segment is drawn solid before the open end fades out: a share of the
  // SEGMENT, floored so the solid head is never narrower than `OUTAGE_MIN_SEGMENT_PCT`, the sliver
  // `outageRemainingBar` refuses to produce. A segment too narrow for the fade is drawn solid.
  const width = bar.endPct - bar.startPct;
  const solidPct = Math.min(100, Math.max(35, (OUTAGE_MIN_SEGMENT_PCT / width) * 100));

  // 10 px is the floor of the site's chart furniture, and the labels keep the inherited
  // `text-muted-foreground`: more dimming would take small text under the 4.5 : 1 it owes.
  // Hidden at the OUTER element, not at the track: „jetzt" and „4 Std." are the scale's two
  // ends, numbers about the drawing rather than about the ride.
  return (
    <span className="flex items-center gap-1.5 text-[10px] leading-none" aria-hidden="true">
      <span className="shrink-0">{nowLabel}</span>
      <span className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
        {OUTAGE_BAR_TICKS_MIN.map((minutes) => (
          <span
            key={minutes}
            className="bg-muted-foreground/30 absolute inset-y-0 w-px"
            style={{ left: `${(minutes / OUTAGE_BAR_HORIZON_MIN) * 100}%` }}
          />
        ))}
        <span
          className={cn('absolute inset-y-0 rounded-full', !bar.openEnd && 'bg-primary')}
          style={{
            left: `${bar.startPct}%`,
            width: `${bar.endPct - bar.startPct}%`,
            // An open window does not end, so its segment may not draw an end.
            // The fade is the whole difference between „bis 4:00 Std." and „über
            // 50 Min." once both segments reach the right edge of the track.
            ...(bar.openEnd
              ? {
                  backgroundImage: `linear-gradient(to right, var(--color-primary) ${solidPct}%, transparent)`,
                }
              : {}),
          }}
        />
      </span>
      <span className="shrink-0">{endLabel}</span>
    </span>
  );
}

/** P(back within the hour) as a share of the track. The sentence above it names the figure. */
function RecoveryMeter({ percent }: { percent: number }) {
  return (
    <span
      className="block h-1.5 w-full overflow-hidden rounded-full bg-white/70 dark:bg-white/10"
      aria-hidden="true"
    >
      <span className="bg-primary block h-full rounded-full" style={{ width: `${percent}%` }} />
    </span>
  );
}
