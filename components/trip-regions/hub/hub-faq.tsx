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
import { requireTripRegion } from '@/lib/trip-regions/registry';
import type { TripCalendar, TripRegion } from '@/lib/trip-regions/types';

/** Minutes between two park-local ISO times. */
const minutesBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 60_000);

/**
 * The hub's questions, answered from the same data the page shows: the quietest days of the window,
 * and where the region names the park or the leg (`hub.faq` in its registry entry) a park on a
 * party night, a park on weekends, the drive between the resorts and the hotels' early slots; then
 * why a park with longer lines can be green. The words are the region's own
 * (`tripRegions.<slug>.hub.faq`). No question carries a figure that moves; an answer whose data is
 * missing is left out rather than answered in general. `FaqList` renders them as `<details>` and
 * emits the `FAQPage` from the same array.
 */
export async function HubFaq({
  region,
  calendar,
  summaries,
  monthLabel,
  locale,
}: {
  region: TripRegion;
  calendar: TripCalendar | null;
  summaries: ResortMonthSummary[];
  /** "December 2026" on a month page; `null` on the hub. */
  monthLabel: string | null;
  locale: string;
}) {
  const t = await getRegionTranslations(region.slug, 'hub.faq');
  const { timezone, hub } = requireTripRegion(region.slug);
  const ask = hub.faq;
  const list = getListFormat(locale, { type: 'conjunction' });
  const clock = (iso: string) => formatClockTime(iso, locale, timezone);
  const items: Array<{ question: string; answer: string }> = [];

  const quiet = summaries.filter((s) => s.quiet.length > 0);
  if (quiet.length > 0) {
    items.push({
      question: monthLabel ? t('quietest.qMonth', { month: monthLabel }) : t('quietest.q'),
      answer: [
        ...quiet.map((s) =>
          t('quietest.resort', {
            resort: shortGroupName(s.group.name),
            days: list.format(
              s.quiet.map((q) =>
                t('quietest.day', {
                  date: formatHubDate(q.date, locale),
                  park: shortParkName(q.park.name),
                  minutes: q.wait ?? 0,
                })
              )
            ),
          })
        ),
        t('quietest.note'),
      ].join(' '),
    });
  }

  if (calendar && ask.partyPark) {
    const partyPark = ask.partyPark;
    const party = ticketedEvenings(calendar, partyPark);
    const lane = eventLanes(calendar).find(
      (l) => l.kind === 'party' && l.parkSlugs.includes(partyPark)
    );
    if (party.count > 0 && party.closesAt && lane?.name) {
      items.push({
        question: t('party.q'),
        answer: t('party.a', {
          name: lane.name,
          count: party.count,
          time: clock(party.closesAt),
          on: party.waitOnThem ?? 0,
          off: party.waitOtherwise ?? 0,
        }),
      });
    }
  }

  if (calendar && ask.weekendPark) {
    const split = weekendAgainstWeekday(calendar, ask.weekendPark);
    if (split) {
      const gap = split.weekend - split.weekday;
      items.push({
        question: t('epic.q'),
        answer: t('epic.a', {
          weekend: split.weekend,
          weekday: split.weekday,
          verdict: gap >= 10 ? 'busier' : gap <= 0 ? 'same' : 'little',
        }),
      });
    }
  }

  const toNear = ask.distance && findLeg(region, ask.distance.from, ask.distance.near);
  const toFar = ask.distance && findLeg(region, ask.distance.from, ask.distance.far);
  if (toNear && toFar) {
    items.push({
      question: t('distance.q'),
      answer: t('distance.a', {
        near: toNear.minutes,
        far: toFar.minutes,
        transfer: toFar.transferMinutes ?? 0,
        total: legMinutes(toFar),
        attribution: region.travel.attribution,
      }),
    });
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
    if (first && second) {
      items.push({
        question: t('early.q'),
        answer: t('early.a', { first, second }),
      });
    }
  }

  items.push({ question: t('green.q'), answer: t('green.a') });
  items.push({ question: t('lastYear.q'), answer: t('lastYear.a') });

  return <FaqList items={items} />;
}
