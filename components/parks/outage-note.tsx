'use client';

import { useLocale, useTranslations } from 'next-intl';
import { TriangleAlert } from 'lucide-react';
import type { AttractionOutage } from '@/lib/api/types';
import { formatSpanDuration } from '@/lib/utils/duration';
import { outageElapsedMinutes } from '@/lib/utils/outage';
import { OutageEstimateNote } from './outage-estimate-note';
import { RideStatusBlock, rideStatusFooterClass, useWeekdayTime } from './ride-status-block';

/**
 * "Störung gemeldet seit …" — the one sentence this site says about a ride that
 * is down right now, and the block that carries it.
 *
 * It repeats in the present what the park's own feed is saying, so it needs no methodology page;
 * everything historical is a claim about a company and waits for one.
 *
 * It names the weekday even for an outage that started today: a shorter form would have to be
 * chosen against the park's current day, which exists only after mount (`useMinuteNow` is `null`
 * during SSR and hydration), and a text swap in a subgrid row shared across a row of cards is
 * banned here. The query looks back seven days, so a weekday is unambiguous.
 *
 * The elapsed clause is the API's `estimate.elapsedMinutes`, never `now - startedAt`: the
 * change log's hourly heartbeat carries a DOWN forward, so wall minutes would overstate exactly
 * the long outages. It counts the park's operating clock, which is why the clause says so, and a
 * stale figure from the cached server render is always short of the truth until the first poll
 * refreshes `outage`. Both guards live in `outageElapsedMinutes`.
 *
 * Two signals, two sentences: a DOWN from the park's feed attributes the report („Störung
 * gemeldet seit …"); an outage inferred from a closure inside opening hours does not („Steht seit
 * … still"). Both get the same block in the DOWN badge's orange, with the estimate
 * (`OutageEstimateNote`) under it, so the sentence alone carries who noticed. The text keeps the
 * surface's own colours, since `--status-down` as small text is under 3:1.
 *
 * `data-nosnippet` on the block's `<div>`: the sentence is false the moment the ride restarts.
 * See docs/rules/parks-we-cannot-read.md.
 */
export function OutageNote({
  outage,
  timezone,
  variant = 'compact',
  className,
}: {
  /** `null` is what the five-minute poll sends for a ride that is not down. */
  outage: AttractionOutage | null | undefined;
  /** The park's IANA timezone. A start is stated in the park's own clock. */
  timezone: string | undefined;
  /**
   * `compact` for a park page's ride card: card text colours, 11 to 12 px, and
   * the estimate in its compact form. `full` for the ride page's live panel,
   * which has the room for the probability and its meter.
   */
  variant?: 'compact' | 'full';
  className?: string;
}) {
  const t = useTranslations('parks.outage');
  const locale = useLocale();
  const weekdayTime = useWeekdayTime(timezone);

  if (!outage) return null;

  // An unreadable start is a start we do not know, which is a sentence of its own.
  const when = outage.startObserved ? weekdayTime(outage.startedAt) : null;

  // A `down` was reported by the park's own feed; a `closed_gap` is our reading, so it may not
  // say „gemeldet" (see `AttractionOutage.signal`). Anything that is not exactly `down` counts as
  // inferred: `signal` is not validated at runtime and the API deploys on its own, so an unknown
  // value must fall to the WEAKER claim.
  const inferred = outage.signal !== 'down';
  const label =
    when !== null
      ? t(inferred ? 'sinceClosed' : 'since', { when })
      : t(inferred ? 'startUnknownClosed' : 'startUnknown');

  const elapsed = outageElapsedMinutes(outage);

  return (
    <RideStatusBlock
      icon={TriangleAlert}
      tone="outage"
      title={label}
      detail={
        elapsed !== null ? t('elapsed', { duration: formatSpanDuration(elapsed, locale) }) : null
      }
      variant={variant}
      className={className}
    >
      {/* Under a hairline in the block's own tint, so the estimate reads as the second half of
          the same answer rather than as a note about something else. `OutageEstimateNote`
          renders nothing where the curve cannot answer, and the rule goes with it. */}
      <OutageEstimateNote
        estimate={outage.estimate}
        signal={outage.signal}
        timezone={timezone}
        variant={variant}
        className={rideStatusFooterClass('outage', variant)}
      />
    </RideStatusBlock>
  );
}
