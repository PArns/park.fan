'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { OutageEstimate } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { formatShortDuration, formatWholeHours } from '@/lib/utils/duration';
import {
  OUTAGE_BAR_HORIZON_MIN,
  OUTAGE_BAR_TICKS_MIN,
  outageRecoveryPercent,
  outageRemainingBar,
  outageRemainingWindow,
  type OutageRemainingBar,
} from '@/lib/utils/outage';

/**
 * "Wie lange dauert das noch?" — the one thing a visitor standing at a stopped
 * ride actually wants to know.
 *
 * Renders in both places a `DOWN` ride appears, from the same numbers: compact
 * under the badge on a park page's ride card, and in full in the ride page's
 * live panel.
 *
 * ## Why this may be said when a forecast may not
 *
 * The API refuses to say when a ride will break next, and that refusal is not
 * softened here. This is a different question with a different sample behind it:
 * the outage has already started, and the figure describes what happened to the
 * outages that got this far. It is measured over 5900-128 000 intervals per
 * bucket and calibrated out-of-sample to 2.55 percentage points. The full
 * argument lives on the API's `DowntimeRecoveryCurve`.
 *
 * ## The copy names the condition, because the condition is the whole point
 *
 * Not "outages usually last 25 minutes". That is the unconditional figure, and
 * it is wrong for the ride in front of the visitor exactly when it matters: 54 %
 * of outages are over within half an hour, but of those still down after four
 * hours only 8.5 % are. So the sentence says *„Störungen, die schon so lange
 * dauern"*, and a reader can see the estimate is about this outage's history
 * rather than about outages in general.
 *
 * ## A range, never a point — and an open range when that is the truth
 *
 * The distribution is heavy-tailed: at one hour elapsed the quartiles sit at 25
 * and 255 minutes around a median of 70. A single number would read as a
 * promise, so both surfaces render the quartile range and let its width carry
 * the uncertainty. Past roughly two hours the upper quartile stops resolving;
 * that renders as „über 1:55 Std.", which is the honest shape of a long outage
 * — still measurable, no longer bounded. Which shape the payload uses to say so
 * is `outageRemainingWindow`'s problem, not this component's: it arrives as an
 * absent key at least as often as the documented `null`, and the `=== null`
 * test that used to sit here formatted the difference as „NaN:NaN Std.".
 *
 * ## Why the numbers are drawn as well as written
 *
 * „meist noch 25 Min. bis 1:00 Std." and „meist noch 50 Min. bis 3:40 Std." are
 * the same sentence with different digits in it, and a visitor scanning a park
 * page reads the shape before the digits. The bar puts the window on a **fixed**
 * scale — „jetzt" to four hours, hour marks inside the track — so a short outage
 * looks short beside a long one on the next card. The scale is fixed for exactly
 * that reason; one drawn per window would make every ride look alike, which is
 * the trap `Sparkline`'s `yMax` exists for. Where the window's top is not on the
 * scale the segment fades out to the right instead of ending in a cap, and where
 * even its bottom is past four hours there is no bar at all — the geometry, and
 * why it refuses, sit in `outageRemainingBar`.
 *
 * The probability gets a plain meter, which needs no axis: 0 to 100 % is the
 * axis. `components/ui/progress.tsx` is not reused for either — it fills from
 * zero and cannot draw a segment that starts somewhere else, and its colour ramp
 * runs green→red with the value, so a ride with a 77 % chance of being back
 * within the hour would be painted in the alarm colour of a full park.
 *
 * Both bars are `bg-primary` on a `bg-muted/40` track — the pair
 * `AttractionTypicalWaits` already uses, measured at 3.36 : 1 in light and
 * 5.24 : 1 in dark. The ride's own orange is not available for this: a solid
 * `--status-down` on `--muted` computes to **2.65 : 1** in light, and its
 * ceiling against pure white is 2.89 : 1, so no lighter track brings it to the
 * 3 : 1 a graphical object owes.
 *
 * ## Rounding
 *
 * Percentages in steps of five, because the calibration error is 2.55 points and
 * "47 %" claims a precision the estimate does not have. Minutes in steps of five
 * too, which is the site's convention everywhere and the real resolution of the
 * feed. Both live in `lib/utils/outage.ts`, and the bars are drawn from the same
 * rounded figures the sentence prints — a segment placed off the raw quartile
 * under a label reading the rounded one is a picture disagreeing with its
 * caption.
 *
 * `data-nosnippet` for the same reason as `OutageNote`: it is true while it is
 * on the page and false the moment the ride restarts.
 */
export function OutageEstimateNote({
  estimate,
  variant = 'compact',
  className,
}: {
  estimate: OutageEstimate | undefined;
  /**
   * `compact` says one thing, for a card where every row is shared with every
   * other card in the grid through the subgrid: the range and its bar, or the
   * probability and its meter where no range resolved. `full` says both, for the
   * ride page's live panel.
   */
  variant?: 'compact' | 'full';
  className?: string;
}) {
  const t = useTranslations('parks.outage.estimate');
  const locale = useLocale();

  if (!estimate) return null;

  const percent = outageRecoveryPercent(estimate);
  const remaining = outageRemainingWindow(estimate);
  const bar = outageRemainingBar(remaining);

  const range = remaining
    ? remaining.to === null
      ? t('rangeOpen', {
          from: formatShortDuration(remaining.from, locale),
        })
      : t('range', {
          from: formatShortDuration(remaining.from, locale),
          to: formatShortDuration(remaining.to, locale),
        })
    : null;

  // A rounded 0 % would read as "never", a claim the curve does not make: the
  // thinnest measured bucket is still 8.5 %. If a future curve produced it,
  // saying nothing beats saying never. `outageRecoveryPercent` answers `null`
  // there, and the range alone carries the block.
  //
  // The `&& !remaining` this used to carry defeated the guard exactly where it
  // was needed: a long-elapsed bucket with a sub-2.5 % 60-minute share and a
  // still-resolvable median would have rendered "0 %" beside a numeric time
  // range, which reads as "never coming back" rather than "we cannot say".
  // The range alone is honest; the zero is not.
  if (percent === null && !range) return null;

  // The probability rides along only where the range is missing on a card: the
  // compact block sits in the badge row of a card whose height every card in
  // that grid row inherits, and the sentence is the widest thing in it.
  const recovery = percent !== null && (variant === 'full' || !range) ? percent : null;

  // Which of the two sentences carries the probability is the VARIANT's question, not the
  // range's. The long one names the condition the curve is conditioned on — „Von Störungen, die
  // schon so lange dauern …" — and it is the ride page's, where there is a line to spend on it.
  // A card gets the short one, for the same reason it gets no probability at all beside a range:
  // the sentence is the widest thing in the badge row, and every card in that grid row inherits
  // whatever height it wraps to. Deciding this on `range` instead put the long sentence on the
  // card in exactly the case a card can reach — `remaining` is absent past about two hours
  // elapsed, which is when the compact block has nothing else to say.
  const recoveryText =
    recovery === null
      ? null
      : variant === 'full' && !range
        ? t('recoveryOnly', { percent: recovery })
        : t('recovery', { percent: recovery });

  return (
    <div className={cn('flex w-full flex-col gap-1', className)} data-nosnippet>
      {range ? <span>{range}</span> : null}
      {bar ? (
        <RemainingBar
          bar={bar}
          nowLabel={t('barNow')}
          endLabel={formatWholeHours(OUTAGE_BAR_HORIZON_MIN / 60, locale)}
          ariaLabel={t('barLabel')}
        />
      ) : null}
      {recovery !== null ? (
        <>
          <span>{recoveryText}</span>
          <RecoveryMeter percent={recovery} />
        </>
      ) : null}
    </div>
  );
}

/**
 * The quartile window on the fixed „jetzt … 4 Std." scale.
 *
 * The two ends of the scale are labelled on the same line as the track rather
 * than on one of their own: this block renders inside a ride card's badge row,
 * where a second text line costs every card in the grid row the same height.
 * Three hairlines mark the hours in between, so the reader has four intervals
 * and two labels rather than five labels.
 */
function RemainingBar({
  bar,
  nowLabel,
  endLabel,
  ariaLabel,
}: {
  bar: OutageRemainingBar;
  nowLabel: string;
  endLabel: string;
  ariaLabel: string;
}) {
  // 10 px is the floor the rest of the site's chart furniture sits at, and the labels keep the
  // block's inherited `text-muted-foreground` rather than dimming it further: an opacity on top
  // of it would take small text under the 4.5 : 1 it owes.
  return (
    <span className="flex items-center gap-1.5 text-[10px] leading-none">
      <span className="shrink-0">{nowLabel}</span>
      <span
        className="bg-muted/40 relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full"
        role="img"
        aria-label={ariaLabel}
      >
        {OUTAGE_BAR_TICKS_MIN.map((minutes) => (
          <span
            key={minutes}
            className="bg-muted-foreground/30 absolute inset-y-0 w-px"
            style={{ left: `${(minutes / OUTAGE_BAR_HORIZON_MIN) * 100}%` }}
            aria-hidden="true"
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
                  backgroundImage:
                    'linear-gradient(to right, var(--color-primary) 35%, transparent)',
                }
              : {}),
          }}
          aria-hidden="true"
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
      className="bg-muted/40 block h-1.5 w-full overflow-hidden rounded-full"
      aria-hidden="true"
    >
      <span className="bg-primary block h-full rounded-full" style={{ width: `${percent}%` }} />
    </span>
  );
}
