'use client';

import { useLocale, useTranslations } from 'next-intl';
import { CirclePause, TriangleAlert } from 'lucide-react';
import type { AttractionOutage } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { formatSpanDuration } from '@/lib/utils/duration';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { outageElapsedMinutes } from '@/lib/utils/outage';
import { OutageEstimateNote } from './outage-estimate-note';

/**
 * "Störung gemeldet seit …" — the one sentence this site says about a ride that
 * is down right now, and the block that carries it.
 *
 * It repeats in the present what the park's own feed is saying, which is what
 * makes it the only downtime figure that needs no methodology page, no event
 * floor and no exposure model. Everything historical is a claim about a company
 * and waits for those.
 *
 * ## Why it names the weekday even when the outage started today
 *
 * Because the alternative is a text swap after hydration, and that is banned
 * here. A shorter "seit 14:20 Uhr" form would have to be chosen by comparing the
 * start against the park's current day, and "the park's current day" is not
 * available identically on both sides of hydration: the shared clock
 * (`useMinuteNow`) deliberately returns `null` during SSR and the hydration
 * render so the markup matches, which means the short form could only appear
 * after mount. The two strings are different widths in all six languages, they
 * sit in a subgrid whose row heights are shared across a whole row of cards, and
 * on a phone the longer one wraps. So the rule is now-independent: the weekday
 * and the clock time both come from `startedAt` alone, and the sentence renders
 * identically whenever it is rendered.
 *
 * Seven days is why a weekday is unambiguous — the query looks back no further,
 * and anything older comes back with `startObserved: false`.
 *
 * ## The elapsed clause is measured, never counted
 *
 * „Seit Dienstag, 16:04" leaves the subtraction to the reader, and on a Thursday
 * that is a sum nobody does standing in front of a ride. The duration beside it
 * is the API's own `estimate.elapsedMinutes` and **not** `now - startedAt`:
 * `queue_data` is a change log whose hourly heartbeat copies the previous row's
 * status AND its `data_source` forward, so a carried DOWN is indistinguishable
 * from an observed one, and wall minutes derived from it would be wrong upward
 * exactly on the long outages — the ones anybody would quote.
 *
 * What the API sends instead is counted on the park's **operating** clock, which
 * is why the clause names it („3:00 Std. bei offenem Park"): an outage that
 * began at 18:00 in a park that shut at 20:00 is two hours old the next morning,
 * not sixteen, and the recovery figures under it are conditioned on that same
 * number. Both guards live in `outageElapsedMinutes` — no estimate means no
 * opening clock to count on, and an unobserved start makes every duration a
 * lower bound rather than a measurement.
 *
 * It is a measurement taken at the moment the payload was written, which is not
 * the same as one taken now: `startedAt` is an instant and does not decay, this
 * does. The park page's server render comes from a fetch cached for a day, so a
 * first paint can carry a figure hours behind the clock — the same staleness
 * the „gemeldet seit" line beside it has always had, and healed by the same
 * first poll (`mergeLiveParkSnapshot` refreshes the whole `outage` key), or by
 * the detail fetch on the ride page. It survives only for a reader with no
 * JavaScript. What makes that tolerable is the direction: operating minutes are
 * a subset of wall minutes, so a stale figure is always SHORT of the truth. The
 * page can understate how long a ride has been broken; it cannot accuse an
 * operator of a longer breakdown than was measured.
 *
 * ## Two signals, two sentences
 *
 * Where a park's feed emits DOWN, this says „Störung gemeldet seit …" and
 * attributes the report. Where it never does — 102 of 182 scheduled parks,
 * Phantasialand among them — the outage is inferred from a closure inside
 * opening hours, and the sentence drops the attribution: „Steht seit … still."
 * We noticed it; nobody told us.
 *
 * ## One block, tinted in the status badge's colour
 *
 * The sentence, the elapsed clause and the „wie lange noch" estimate
 * (`OutageEstimateNote`) sit in one tinted box with a solid icon chip, on the
 * ride card and in the ride page's live panel alike. As three loose grey lines
 * they read as small print under the badges, and on a card they wrapped at the
 * 92 px the corner circles reserve.
 *
 * The tint follows the signal, which is also what the badge above it shows: a
 * reported `down` is the ride's DOWN badge, orange; an inferred `closed_gap`
 * only exists for a ride whose status is CLOSED, so it takes the closed red. The
 * chip is the badges' own fill (`--badge-status-*`), solid, with a white glyph
 * like the badges' white label. The text
 * stays on the surface's own text colours: `--status-down` as small text is
 * 2.65 : 1 on a light surface, see `OutageEstimateNote`.
 *
 * ## data-nosnippet
 *
 * On the block's `<div>`, which is one of the three elements Google honours it
 * on. A result answering "Taron Wartezeit" with "Störung gemeldet seit Sonntag"
 * is a result nobody clicks, and the sentence is true for as long as it is on
 * the page and false the moment the ride restarts. Same reasoning as the
 * no-wait-times notice.
 */
export function OutageNote({
  outage,
  timezone,
  variant = 'compact',
  className,
}: {
  outage: AttractionOutage | undefined;
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

  if (!outage) return null;

  const started = new Date(outage.startedAt);
  // An unreadable start is a start we do not know, which is a sentence of its own.
  const startKnown = outage.startObserved && !Number.isNaN(started.getTime());

  // The two signals get different sentences, and the difference is not
  // cosmetic. A `down` was reported by the park's own feed; a `closed_gap` is
  // our reading of a ride that shut inside opening hours and did not shut with
  // the rest of the park. Nobody reported the second one, so it may not say
  // „gemeldet" — see `AttractionOutage.signal`.
  // Anything that is not exactly the reported signal is treated as inferred.
  //
  // The safe default has to be the WEAKER claim. `signal` is a compile-time
  // union with no runtime validation on the fetch path, and these two repos
  // deploy independently — so a third signal, or a version-skew window where
  // the API ships a new value before this build does, would have fallen through
  // to „Störung gemeldet seit …" and attributed a report to the operator's own
  // feed. That is the one claim this whole two-signal discipline exists to
  // prevent for anything nobody actually reported.
  const inferred = outage.signal !== 'down';
  const label = startKnown
    ? t(inferred ? 'sinceClosed' : 'since', {
        when: formatStart(started, timezone, locale),
      })
    : t(inferred ? 'startUnknownClosed' : 'startUnknown');

  const elapsed = outageElapsedMinutes(outage);
  const full = variant === 'full';
  const Icon = inferred ? CirclePause : TriangleAlert;

  return (
    <div
      className={cn(
        'rounded-xl border',
        inferred
          ? 'border-status-closed/25 bg-status-closed/10'
          : 'border-status-down/25 bg-status-down/10',
        full ? 'p-3' : 'px-2.5 py-2',
        className
      )}
      data-nosnippet
    >
      <div className={cn('flex items-center', full ? 'gap-3' : 'gap-2.5')}>
        <span
          className={cn(
            'grid shrink-0 place-items-center rounded-full text-white shadow-sm',
            inferred ? 'bg-badge-status-closed' : 'bg-badge-status-down',
            full ? 'size-8' : 'size-6'
          )}
          aria-hidden="true"
        >
          <Icon className={full ? 'size-4' : 'size-3.5'} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn(
              'font-semibold tabular-nums',
              full ? 'text-foreground text-sm leading-snug' : 'text-[12px] leading-tight'
            )}
            style={full ? undefined : { color: 'var(--pk-text-1)' }}
          >
            {label}
          </span>
          {elapsed !== null && (
            <span
              className={cn(
                'tabular-nums',
                full ? 'text-muted-foreground text-xs' : 'text-[11px] leading-tight'
              )}
              style={full ? undefined : { color: 'var(--pk-text-2)' }}
            >
              {t('elapsed', { duration: formatSpanDuration(elapsed, locale) })}
            </span>
          )}
        </div>
      </div>
      {/* Under a hairline in the block's own tint, so the estimate reads as the second half of
          the same answer rather than as a note about something else. `OutageEstimateNote`
          renders nothing where the curve cannot answer, and the rule goes with it. */}
      <OutageEstimateNote
        estimate={outage.estimate}
        timezone={timezone}
        variant={variant}
        className={cn(
          'border-t tabular-nums',
          inferred ? 'border-status-closed/20' : 'border-status-down/20',
          full
            ? 'text-muted-foreground mt-3 gap-1.5 pt-3 text-xs'
            : 'mt-2 pt-2 text-[11px] leading-tight text-(--pk-text-2)'
        )}
      />
    </div>
  );
}

/**
 * Weekday and clock time in the park's zone, in the reader's language.
 *
 * Falls back to the browser's zone rather than throwing: an unknown timezone
 * costs the sentence its precision, not the card its render.
 */
function formatStart(started: Date, timezone: string | undefined, locale: string): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  };
  try {
    return getDateTimeFormat(locale, { ...options, timeZone: timezone }).format(started);
  } catch {
    return getDateTimeFormat(locale, options).format(started);
  }
}
