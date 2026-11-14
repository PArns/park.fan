import { getTranslations } from 'next-intl/server';
import { FaqList } from '@/components/marketing/editorial-ui';
import { getListFormat, formatClockTime } from '@/lib/utils/intl-format';
import {
  eventLanes,
  findLeg,
  formatHubDate,
  legMinutes,
  shortGroupName,
  shortParkName,
  ticketedEvenings,
  weekendAgainstWeekday,
  type ResortMonthSummary,
} from '@/lib/trip-regions/hub-data';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { ownWords } from '@/lib/trip-regions/region-words';
import { requireTripRegion } from '@/lib/trip-regions/registry';
import type { TripCalendar, TripRegion } from '@/lib/trip-regions/types';

/** Minutes between two park-local ISO times. */
const minutesBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 60_000);

/** A shorter peak wait on party nights only counts from this many minutes. */
const PARTY_GAIN_MIN = 5;

/**
 * The hub's questions, the method folded in. First the region's own, answered from the data the
 * page shows: the quietest and busiest days of the window per resort, and where the region names
 * the park or the leg (`hub.faq` in its registry entry) a park on a party night, a park on
 * weekends, the drive between the resorts and the hotels' early slots; then the region's questions
 * with a fixed answer (`hub.faq.questions`); then, on the hub and not its month pages, the five
 * every region shares: what the peak wait is, why a longer one can be green, where the figures come
 * from, how far the forecast reaches and how close it gets. A question whose data or words are missing is left out, never answered in
 * general and never shown as a key. `FaqList` renders them as `<details>` and emits the `FAQPage`
 * from the same array.
 */
export async function HubFaq({
  region,
  calendar,
  summaries,
  monthLabel,
  forecastUntil,
  locale,
}: {
  region: TripRegion;
  calendar: TripCalendar | null;
  summaries: ResortMonthSummary[];
  /** "December 2026" on a month page; `null` on the hub. */
  monthLabel: string | null;
  /** The last day the forecast covers, when the API has said. */
  forecastUntil?: string;
  locale: string;
}) {
  const t = await getRegionTranslations(region.slug, 'hub.faq');
  const shared = await getTranslations('tripHub.faq');
  const { timezone, hub } = requireTripRegion(region.slug);
  const ask = hub.faq;
  const list = getListFormat(locale, { type: 'conjunction' });
  const clock = (iso: string) => formatClockTime(iso, locale, timezone);
  const items: Array<{ question: string; answer: string }> = [];
  const add = (question: string | null, answer: string | null) => {
    if (question && answer) items.push({ question, answer });
  };

  const quiet = summaries.filter((s) => s.quiet.length > 0);
  if (quiet.length > 0 && t.has('quietest.day')) {
    const answer = quiet
      .map((s) => {
        const resort = shortGroupName(s.group.name);
        // Every date at one park whose name the resort's already says (Universal Studios Japan,
        // SeaWorld in SeaWorld Orlando): the park is not named again after each date.
        const only = s.quiet.every((q) => q.park.slug === s.quiet[0].park.slug);
        const one = only && resort.includes(shortParkName(s.quiet[0].park.name));
        const days = list.format(
          s.quiet.map((q) => {
            const values = {
              date: formatHubDate(q.date, locale),
              park: shortParkName(q.park.name),
              minutes: q.wait ?? 0,
            };
            return (one && ownWords(t, 'quietest.dayAlone', values)) || t('quietest.day', values);
          })
        );
        const busy = list.format(s.busy.map((b) => formatHubDate(b.date, locale)));
        return s.busy.length > 0
          ? ownWords(t, 'quietest.resort', { resort, days, busy })
          : shared('quietestOnly', { resort, days });
      })
      .filter((line): line is string => !!line)
      .join(' ');
    add(
      monthLabel
        ? ownWords(t, 'quietest.qMonth', { month: monthLabel })
        : ownWords(t, 'quietest.q'),
      answer || null
    );
  }

  if (calendar && ask.partyPark) {
    const partyPark = ask.partyPark;
    const party = ticketedEvenings(calendar, partyPark);
    const lane = eventLanes(calendar).find(
      (l) => l.kind === 'party' && l.parkSlugs.includes(partyPark)
    );
    if (party.count > 0 && party.closesAt && lane?.name) {
      const on = party.waitOnThem ?? 0;
      const off = party.waitOtherwise ?? 0;
      add(
        ownWords(t, 'party.q'),
        ownWords(t, 'party.a', {
          name: lane.name,
          count: party.count,
          time: clock(party.closesAt),
          on,
          off,
          verdict: off - on >= PARTY_GAIN_MIN ? 'shorter' : 'same',
        })
      );
    }
  }

  if (calendar && ask.weekendPark) {
    const split = weekendAgainstWeekday(calendar, ask.weekendPark);
    if (split) {
      const gap = split.weekend - split.weekday;
      add(
        ownWords(t, 'epic.q'),
        ownWords(t, 'epic.a', {
          weekend: split.weekend,
          weekday: split.weekday,
          verdict: gap >= 10 ? 'busier' : gap <= 0 ? 'same' : 'little',
        })
      );
    }
  }

  const toNear = ask.distance && findLeg(region, ask.distance.from, ask.distance.near);
  const toFar = ask.distance && findLeg(region, ask.distance.from, ask.distance.far);
  if (toNear && toFar) {
    add(
      ownWords(t, 'distance.q'),
      ownWords(t, 'distance.a', {
        near: toNear.minutes,
        far: toFar.minutes,
        transfer: toFar.transferMinutes ?? 0,
        total: legMinutes(toFar),
        attribution: region.travel.attribution,
      })
    );
  }

  if (calendar && ask.earlySlots) {
    const slotMinutes = (kind: 'early_entry' | 'early_park_admission') => {
      for (const day of calendar.days) {
        for (const park of Object.values(day.parks)) {
          if (park.early?.kind === kind)
            return minutesBetween(park.early.opensAt, park.early.closesAt);
        }
      }
      return null;
    };
    const first = slotMinutes(ask.earlySlots[0]);
    const second = slotMinutes(ask.earlySlots[1]);
    if (first && second) add(ownWords(t, 'early.q'), ownWords(t, 'early.a', { first, second }));
  }

  for (const key of ask.questions ?? []) add(ownWords(t, `${key}.q`), ownWords(t, `${key}.a`));

  // The same five answers on every month page would make the months read alike; the key in
  // chapter 01 names the figure and the colour there, and the links line leads to the method.
  if (!monthLabel) {
    const horizon = forecastUntil ? formatHubDate(forecastUntil, locale, 'long') : null;
    add(shared('peak.q'), shared('peak.a'));
    add(shared('green.q'), shared('green.a'));
    add(shared('sources.q'), shared('sources.a'));
    add(
      shared('horizon.q'),
      horizon ? shared('horizon.a', { date: horizon }) : shared('horizon.aNoDate')
    );
    add(shared('accuracy.q'), shared('accuracy.a'));
  }

  return <FaqList items={items} />;
}
