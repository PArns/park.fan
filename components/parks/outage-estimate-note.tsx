'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { OutageEstimate } from '@/lib/api/types';
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
 * ## A clock time where the API can place one, a duration everywhere else
 *
 * „meist noch 25 Min. bis 1:00 Std." is a subtraction a visitor standing at the
 * ride should not have to do, and for most of the day the answer is simply
 * „zwischen 14:35 und 16:10 Uhr". What stops the component from computing it is
 * the unit: `remaining` counts OPERATING minutes, so two hours left in a park
 * shutting in twenty minutes is tomorrow morning, and the opening calendar that
 * says so lives in the API. It sends the placed instants as
 * `estimate.recoveryWindow`, and where they are missing — a park that publishes
 * no hours, a calendar that does not reach — the duration sentence stays
 * exactly as it was. Nothing here derives a time from minutes.
 *
 * **The sentence names the weekday, and never asks what day it is now.**
 * `OutageNote` directly above settled this: „the park's current day" is not
 * available identically on both sides of hydration, so a form chosen by
 * comparing against now can only appear after mount, and a text swap in a
 * subgrid whose row heights are shared across a whole row of cards is banned
 * here. So the weekday comes from the instant alone. `from` always carries one;
 * `to` carries one only where it falls on a later day, because that is the case
 * a bare „11:00 Uhr" would be read as this evening. Both renders are identical
 * whenever they happen, which is why this needs no mount guard.
 *
 * **No bar under a clock time.** The bar's axis is operating minutes, from
 * „jetzt" to four hours. Where the window crosses a closing — the case the
 * placed instants exist for — the picture would put the ride back in two hours
 * while the sentence over it says tomorrow morning, and a picture that
 * contradicts its caption is worse than no picture. Which of the two forms a
 * park gets is a property of the park rather than of the ride, so the cards in
 * one grid do not disagree.
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
 * the window leaves no room for a full segment there is no bar at all — the
 * geometry, and why it refuses, sit in `outageRemainingBar`.
 *
 * Neither bar is in the accessibility tree. Each restates, as a picture, the
 * sentence directly above it, and on a park page the whole block sits inside the
 * card's one `<Link>`, so a label here would be read out as part of the link's
 * name. The numbers are in the sentence, where a screen reader reaches them once.
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
  timezone,
  variant = 'compact',
  className,
}: {
  estimate: OutageEstimate | undefined;
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
  const t = useTranslations('parks.outage.estimate');
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

  // Whether the probability is said here, and in which of its two sentences — three inputs, all
  // three of them rules rather than layout, so the answer comes from `outageRecoveryLine` and is
  // tested there. This branch got it wrong on its first write while it lived in this file: it
  // read the range instead of the variant and put the ride page's long, conditioned sentence on
  // a card, in exactly the case a card can reach.
  const recovery = outageRecoveryLine(percent, variant, range !== null);

  return (
    <div className={cn('flex w-full flex-col gap-1', className)} data-nosnippet>
      {range ? <span>{range}</span> : null}
      {bar ? (
        <RemainingBar
          bar={bar}
          nowLabel={t('barNow')}
          endLabel={formatWholeHours(OUTAGE_BAR_HORIZON_MIN / 60, locale)}
        />
      ) : null}
      {recovery ? (
        <>
          <span>{t(recovery.key, { percent: recovery.percent })}</span>
          <RecoveryMeter percent={recovery.percent} />
        </>
      ) : null}
    </div>
  );
}

/**
 * One end of the clock window, in the park's zone and the reader's language.
 *
 * `withWeekday` is not a style choice: a bare „11:00 Uhr" is read as today, and
 * whether it is today cannot be decided identically on both sides of hydration
 * (see the note on the component). The weekday is therefore attached from the
 * instant alone — always on the lower end, and on the upper one only where it
 * sits on a later day, which is what `outageRecoveryClock` has already worked
 * out against the park's calendar day.
 *
 * Falls back to the runtime's own zone rather than throwing, the way
 * `OutageNote` does: an unknown zone costs the sentence its precision, not the
 * card its render. The fallback cannot disagree across hydration here —
 * `outageRecoveryClock` has already withheld the whole clock form for any zone
 * `Intl` refuses, so a throw at this point means a zone that resolves there and
 * not here, which no runtime does.
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
 * than on one of their own: this block renders inside a ride card's badge row,
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
  // How much of the segment is drawn solid before the open end fades out.
  //
  // A share of the SEGMENT, floored so the solid head is never narrower than the whole segment
  // was guaranteed to be: at 35 % of a five-percent segment the visible part is 1.75 % of the
  // track, which is the sliver `outageRemainingBar` refuses to produce, put back by the paint.
  // A segment that cannot afford the fade is drawn solid — at that width the fade is a pixel and
  // the sentence above says „über …" either way.
  const width = bar.endPct - bar.startPct;
  const solidPct = Math.min(100, Math.max(35, (OUTAGE_MIN_SEGMENT_PCT / width) * 100));

  // 10 px is the floor the rest of the site's chart furniture sits at, and the labels keep the
  // block's inherited `text-muted-foreground` rather than dimming it further: an opacity on top
  // of it would take small text under the 4.5 : 1 it owes.
  // Hidden at the OUTER element, not at the track: „jetzt" and „4 Std." are the scale's two ends
  // and neither is this outage's remaining time, so a reader who has just heard „meist noch
  // 25 Min. bis 1:00 Std." would get two more numbers that are about the drawing rather than
  // about the ride. Hiding the track alone left exactly those two behind.
  return (
    <span className="flex items-center gap-1.5 text-[10px] leading-none" aria-hidden="true">
      <span className="shrink-0">{nowLabel}</span>
      <span className="bg-muted/40 relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full">
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
      className="bg-muted/40 block h-1.5 w-full overflow-hidden rounded-full"
      aria-hidden="true"
    >
      <span className="bg-primary block h-full rounded-full" style={{ width: `${percent}%` }} />
    </span>
  );
}
