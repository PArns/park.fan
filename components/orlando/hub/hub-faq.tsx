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
} from '@/lib/orlando/hub-data';
import { ORLANDO_TIMEZONE } from '@/lib/orlando/types';
import type { TripCalendar, TripRegion } from '@/lib/orlando/types';

const MAGIC_KINGDOM = 'magic-kingdom-park';
const EPIC_UNIVERSE = 'universal-epic-universe';

/** Minutes between two park-local ISO times. */
const minutesBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 60_000);

/**
 * The hub's questions, answered from the same data the page shows: the quietest days of the window,
 * Magic Kingdom on a party night, Epic Universe on weekends, the drive between the resorts, Early
 * Entry and why a park with longer lines can be green. No question carries a figure that moves; an
 * answer whose data is missing is left out rather than answered in general. `FaqList` renders them
 * as `<details>` and emits the `FAQPage` from the same array.
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
  const t = await getTranslations('orlando.faq');
  const list = getListFormat(locale, { type: 'conjunction' });
  const clock = (iso: string) => formatClockTime(iso, locale, ORLANDO_TIMEZONE);
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

  if (calendar) {
    const party = ticketedEvenings(calendar, MAGIC_KINGDOM);
    const lane = eventLanes(calendar).find(
      (l) => l.kind === 'party' && l.parkSlugs.includes(MAGIC_KINGDOM)
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

    const epic = weekendAgainstWeekday(calendar, EPIC_UNIVERSE);
    if (epic) {
      const gap = epic.weekend - epic.weekday;
      items.push({
        question: t('epic.q'),
        answer: t('epic.a', {
          weekend: epic.weekend,
          weekday: epic.weekday,
          verdict: gap >= 10 ? 'busier' : gap <= 0 ? 'same' : 'little',
        }),
      });
    }
  }

  const toEpcot = findLeg(region, 'universal-studios-florida', 'epcot');
  const toMagic = findLeg(region, 'universal-studios-florida', MAGIC_KINGDOM);
  if (toEpcot && toMagic) {
    items.push({
      question: t('distance.q'),
      answer: t('distance.a', {
        epcot: toEpcot.minutes,
        magic: toMagic.minutes,
        transfer: toMagic.transferMinutes ?? 0,
        total: legMinutes(toMagic),
        attribution: region.travel.attribution,
      }),
    });
  }

  if (calendar) {
    const slotMinutes = (kind: 'early_entry' | 'early_park_admission') => {
      for (const day of calendar.days) {
        for (const park of Object.values(day.parks)) {
          if (park.early?.kind === kind)
            return minutesBetween(park.early.opensAt, park.early.closesAt);
        }
      }
      return null;
    };
    const disney = slotMinutes('early_entry');
    const universal = slotMinutes('early_park_admission');
    if (disney && universal) {
      items.push({
        question: t('early.q'),
        answer: t('early.a', { disney, universal }),
      });
    }
  }

  items.push({ question: t('green.q'), answer: t('green.a') });
  items.push({ question: t('lastYear.q'), answer: t('lastYear.a') });

  return <FaqList items={items} />;
}
