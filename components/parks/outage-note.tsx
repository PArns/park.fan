'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { AttractionOutage } from '@/lib/api/types';

/**
 * "Störung gemeldet seit …" — the one sentence this site says about a ride that
 * is down right now.
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
 * ## Why there is no elapsed counter
 *
 * `queue_data` is a change log whose hourly heartbeat copies the previous row's
 * status AND its `data_source` forward, so a carried DOWN is indistinguishable
 * from an observed one. Minutes derived from it would be wrong upward exactly on
 * the long outages, which are the ones anybody would quote.
 *
 * ## data-nosnippet
 *
 * On a `<span>`, which is one of the three elements Google honours it on. A
 * result answering "Taron Wartezeit" with "Störung gemeldet seit Sonntag" is a
 * result nobody clicks, and the sentence is true for as long as it is on the
 * page and false the moment the ride restarts. Same reasoning as the
 * no-wait-times notice.
 */
export function OutageNote({
  outage,
  timezone,
  className,
}: {
  outage: AttractionOutage | undefined;
  /** The park's IANA timezone. A start is stated in the park's own clock. */
  timezone: string | undefined;
  className?: string;
}) {
  const t = useTranslations('parks.outage');
  const locale = useLocale();

  if (!outage) return null;

  const started = new Date(outage.startedAt);
  if (Number.isNaN(started.getTime())) return null;

  const label = outage.startObserved
    ? t('since', { when: formatStart(started, timezone, locale) })
    : t('startUnknown');

  return (
    <span className={className} data-nosnippet>
      {label}
    </span>
  );
}

/**
 * Weekday and clock time in the park's zone, in the reader's language.
 *
 * Falls back to the browser's zone rather than throwing: an unknown timezone
 * costs the sentence its precision, not the card its render.
 */
function formatStart(started: Date, timezone: string | undefined, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    }).format(started);
  } catch {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(started);
  }
}
