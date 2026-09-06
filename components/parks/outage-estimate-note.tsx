'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { OutageEstimate } from '@/lib/api/types';
import { formatShortDuration } from '@/lib/utils/duration';

/**
 * "Wie lange dauert das noch?" — the one thing a visitor standing at a stopped
 * ride actually wants to know.
 *
 * Renders in both places a `DOWN` ride appears, from the same numbers: compact
 * under the badge on a park page's ride card, and as a full sentence on the
 * ride's own page.
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
 * promise, so the compact form renders the quartile range and lets its width
 * carry the uncertainty. Past roughly two hours the upper quartile stops
 * resolving and the API sends `p75: null`; that renders as „ab 50 Min.", which
 * is the honest shape of a long outage — still measurable, no longer bounded.
 *
 * ## Rounding
 *
 * Percentages in steps of five, because the calibration error is 2.55 points and
 * "47 %" claims a precision the estimate does not have. Minutes in steps of five
 * too, which is the site's convention everywhere and the real resolution of the
 * feed.
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
   * `compact` is the range alone, for a card where a full sentence would grow
   * the shared subgrid row. `full` adds the probability, for the ride page.
   */
  variant?: 'compact' | 'full';
  className?: string;
}) {
  const t = useTranslations('parks.outage.estimate');
  const locale = useLocale();

  if (!estimate) return null;

  const percent = roundTo5(estimate.recoveryWithin60 * 100);
  const remaining = estimate.remaining;

  // A rounded 0 % would read as "never", a claim the curve does not make: the
  // thinnest measured bucket is still 8.5 %. If a future curve produced it,
  // saying nothing beats saying never.
  if (percent <= 0 && !remaining) return null;

  const range = remaining
    ? remaining.p75 === null
      ? t('rangeOpen', {
          from: formatShortDuration(roundTo5(remaining.p25), locale),
        })
      : t('range', {
          from: formatShortDuration(roundTo5(remaining.p25), locale),
          to: formatShortDuration(roundTo5(remaining.p75), locale),
        })
    : null;

  if (variant === 'compact') {
    // No range means the curve answered with a probability only. On a card
    // that is still worth a line, because the alternative is a visitor
    // assuming the ride is about to reopen.
    return (
      <span className={className} data-nosnippet>
        {range ?? t('compactProbability', { percent })}
      </span>
    );
  }

  return (
    <span className={className} data-nosnippet>
      {range ? t('fullWithRange', { percent, range }) : t('fullProbability', { percent })}
    </span>
  );
}

/** Five-point steps, the precision the calibration supports. */
function roundTo5(value: number): number {
  return Math.round(value / 5) * 5;
}
