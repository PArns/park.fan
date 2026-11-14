import { getTranslations } from 'next-intl/server';
import { HelpCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { FaqList } from '@/components/marketing/editorial-ui';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { oneFullStop } from '@/lib/utils/metadata';
import {
  formatClockTime,
  formatHoursRange,
  getListFormat,
  weekdayName,
} from '@/lib/utils/intl-format';
import { translateHolidayName } from '@/lib/utils/holiday-names';
import {
  closesEarly,
  eventLanes,
  findLeg,
  formatDateRange,
  formatHubDate,
  legMinutes,
  shortGroupName,
  shortParkName,
  ticketedEvenings,
  weekendAgainstWeekday,
  type ResortMonthSummary,
} from '@/lib/trip-regions/hub-data';
import {
  breakFacts,
  countWords,
  factDays,
  parkClosures,
  parkMeans,
  usualHours,
  weekdayFacts,
} from '@/lib/trip-regions/hub-facts';
import { TRIP_ACCURACY_ID } from '@/lib/trip-regions/paths';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { ownWords } from '@/lib/trip-regions/region-words';
import { requireTripRegion } from '@/lib/trip-regions/registry';
import type { TripCalendar, TripForecastAccuracy, TripRegion } from '@/lib/trip-regions/types';

/** Minutes between two park-local ISO times. */
const minutesBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 60_000);

/** A shorter peak wait on party nights only counts from this many minutes. */
const PARTY_GAIN_MIN = 5;

/** The hub asks this many questions: its data and region questions, then the four on the figure. */
const HUB_QUESTIONS = 10;

/** The questions on the figure itself, which the hub asks and its months leave to it. */
const SHARED_ON_HUB = 4;

/** At most this many events in one answer; the calendar's events row lists them all. */
const MAX_EVENTS = 6;

/**
 * The owner's length for each list of questions, collapsed text a reader opens one at a time and a
 * search engine reads whole: the hub's ten stay under 800 words, a month's under 500, and a month
 * with few events takes the park and closure questions to reach 250.
 */
const HUB_WORDS_MAX = 800;
const MONTH_WORDS_MAX = 500;
const MONTH_WORDS_MIN = 250;

/** A park closed on more days than this is said with its count, not its dates. */
const MAX_CLOSED_RUNS = 2;

/**
 * One question with its answer, the anchor a link may open it by, and its message key, which
 * `faq_opened` reports: the list depends on the data, so a place names a different question on
 * another page or day.
 */
interface Item {
  question: string;
  answer: string;
  id?: string;
  key?: string;
}

/** The question under its message key. */
const keyed = (key: string, item: Item | null): Item | null => item && { ...item, key };

/**
 * Chapter 04's questions, answered from the data the page shows. The hub asks ten: the region's
 * data questions first (the quietest and busiest days per resort, the events of the window, a park
 * on a party night, a park on weekends, the drive between the resorts, the hotels' early slots,
 * the region's questions with a fixed answer, then the weekdays, the breaks and the hours where
 * room is left), and then four on the figure: what the peak wait is, why a longer one can be
 * green, where the figures come from, and how far and how well the forecast reaches, with the
 * measured error when the API has it. A month page asks only about its month: its quietest days,
 * events, party nights, weekdays, breaks, weekends and hours, and where that says little, each
 * park's mean and its closed days, so twelve month pages never repeat one block. Each list keeps
 * the owner's length (`HUB_WORDS_MAX`, `MONTH_WORDS_MAX`), dropping the question that would pass
 * it. A question whose data or words are missing is left out, never answered in general
 * and never shown as a key. `FaqList` renders them as `<details>` and emits the `FAQPage` from the
 * same array; without a question there is no chapter and no `FAQPage`.
 */
export async function HubFaq({
  index,
  region,
  calendar,
  summaries,
  monthLabel,
  forecastUntil,
  accuracy,
  locale,
}: {
  /** The chapter's number: 04 after the best-time chapter, 03 where a region has none. */
  index: string;
  region: TripRegion;
  calendar: TripCalendar | null;
  summaries: ResortMonthSummary[];
  /** "December 2026" on a month page; `null` on the hub. */
  monthLabel: string | null;
  /** The last day the forecast covers, when the API has said. */
  forecastUntil?: string;
  /** The measured error the route started reading, bounded; `null` without one. */
  accuracy: Promise<TripForecastAccuracy | null>;
  locale: string;
}) {
  const [t, tLanes, shared] = await Promise.all([
    getRegionTranslations(region.slug, 'hub.faq'),
    getRegionTranslations(region.slug, 'hub.lanes'),
    getTranslations('tripHub.faq'),
  ]);
  const link = 'text-primary-ink underline underline-offset-4';
  const { timezone, hub } = requireTripRegion(region.slug);
  const ask = hub.faq;
  const onMonth = monthLabel !== null;
  const list = getListFormat(locale, { type: 'conjunction' });
  const clock = (iso: string) => formatClockTime(iso, locale, timezone);
  const parkOrder = region.parks.map((p) => p.slug);
  const parkNames = (slugs: readonly string[]) =>
    list.format(
      slugs
        .map((slug) => region.parks.find((p) => p.slug === slug))
        .filter((p) => p !== undefined)
        .map((p) => shortParkName(p.name))
    );
  const headliners = region.parks.filter((p) => p.headliner).length;
  // A question in the window's words on the hub, in the month's on a month page.
  const question = (key: string) =>
    onMonth ? shared(`${key}.qMonth`, { month: monthLabel }) : shared(`${key}.q`);
  const lastYear = calendar ? factDays(calendar).lastYear : false;

  const quietest = (): Item | null => {
    const quiet = summaries.filter((s) => s.quiet.length > 0);
    if (quiet.length === 0 || !t.has('quietest.day')) return null;
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
    const q = onMonth
      ? ownWords(t, 'quietest.qMonth', { month: monthLabel })
      : ownWords(t, 'quietest.q');
    // A month past the forecast reads last year's days; its first answer says so once.
    const note = onMonth && lastYear ? `${shared('lastYearNote', { month: monthLabel })} ` : '';
    return q && answer ? { question: q, answer: note + answer } : null;
  };

  const events = (): Item | null => {
    if (!calendar) return null;
    const lanes = eventLanes(calendar, parkOrder)
      .filter((lane) => lane.kind !== 'break' && lane.name)
      .slice(0, MAX_EVENTS);
    if (lanes.length === 0) return null;
    const items = lanes.map((lane) => {
      const values = {
        name: lane.name!,
        parks: parkNames(lane.parkSlugs),
        count: lane.dates.length,
        dates: formatDateRange(lane.dates[0], lane.dates[lane.dates.length - 1], locale),
      };
      if (lane.status === 'expected') return shared('events.expected', values);
      return lane.kind === 'party'
        ? shared('events.party', values)
        : shared('events.festival', values);
    });
    const answer = onMonth
      ? shared('events.aMonth', { month: monthLabel, list: list.format(items) })
      : shared('events.a', { list: list.format(items) });
    const party = lanes.some((lane) => lane.kind === 'party' && lane.status !== 'expected');
    return {
      question: question('events'),
      answer: party ? `${answer} ${shared('events.partyNote')}` : answer,
    };
  };

  const partyNight = (): Item | null => {
    if (!calendar || !ask.partyPark) return null;
    const partyPark = ask.partyPark;
    const party = ticketedEvenings(calendar, partyPark);
    const lane = eventLanes(calendar).find(
      (l) => l.kind === 'party' && l.parkSlugs.includes(partyPark)
    );
    if (party.count === 0 || !party.closesAt || !lane?.name) return null;
    const on = party.waitOnThem ?? 0;
    const off = party.waitOtherwise ?? 0;
    const q = ownWords(t, 'party.q');
    const a = ownWords(t, 'party.a', {
      name: lane.name,
      count: party.count,
      time: clock(party.closesAt),
      on,
      off,
      verdict: off - on >= PARTY_GAIN_MIN ? 'shorter' : 'same',
    });
    return q && a ? { question: q, answer: a } : null;
  };

  const weekendPark = (): Item | null => {
    if (!calendar || !ask.weekendPark) return null;
    const split = weekendAgainstWeekday(calendar, ask.weekendPark);
    if (!split) return null;
    const gap = split.weekend - split.weekday;
    const q = ownWords(t, 'epic.q');
    const a = ownWords(t, 'epic.a', {
      weekend: split.weekend,
      weekday: split.weekday,
      verdict: gap >= 10 ? 'busier' : gap <= 0 ? 'same' : 'little',
    });
    return q && a ? { question: q, answer: a } : null;
  };

  const distance = (): Item | null => {
    const toNear = ask.distance && findLeg(region, ask.distance.from, ask.distance.near);
    const toFar = ask.distance && findLeg(region, ask.distance.from, ask.distance.far);
    if (!toNear || !toFar) return null;
    const q = ownWords(t, 'distance.q');
    const a = ownWords(t, 'distance.a', {
      near: toNear.minutes,
      far: toFar.minutes,
      transfer: toFar.transferMinutes ?? 0,
      total: legMinutes(toFar),
      attribution: region.travel.attribution,
    });
    return q && a ? { question: q, answer: a } : null;
  };

  const earlySlots = (): Item | null => {
    if (!calendar || !ask.earlySlots) return null;
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
    if (!first || !second) return null;
    const q = ownWords(t, 'early.q');
    const a = ownWords(t, 'early.a', { first, second });
    return q && a ? { question: q, answer: a } : null;
  };

  const fixed = (): Item[] =>
    (ask.questions ?? []).flatMap((key) => {
      const q = ownWords(t, `${key}.q`);
      const a = ownWords(t, `${key}.a`);
      return q && a ? [{ question: q, answer: a, key }] : [];
    });

  const weekdays = (): Item | null => {
    const facts = calendar ? weekdayFacts(calendar, region) : null;
    if (!facts || !calendar) return null;
    const names = (waits: typeof facts.quiet) =>
      list.format(waits.map((w) => weekdayName(w.weekday % 7, locale)));
    const values = {
      quiet: names(facts.quiet),
      quietCount: facts.quiet.length,
      low: facts.quiet[0].minutes,
      busy: names(facts.busy),
      busyCount: facts.busy.length,
      high: facts.busy[0].minutes,
      minutes: facts.quiet[0].minutes,
      days: factDays(calendar).days.length,
      parks: headliners,
    };
    // Where most weekdays share the lowest figure, the answer names the busy ones, not the five
    // others, and the other way round.
    const form = facts.flat
      ? 'flat'
      : facts.quiet.length > 3
        ? 'busyOnly'
        : facts.busy.length > 3
          ? 'quietOnly'
          : 'a';
    return { question: question('weekdays'), answer: shared(`weekdays.${form}`, values) };
  };

  const breaks = (): Item | null => {
    const facts = calendar ? breakFacts(calendar, region) : null;
    if (!facts) return null;
    const named = tLanes.has('break');
    const lines = [
      ...(named
        ? facts.breaks.map(
            (run) =>
              `${tLanes('break', {
                name: translateHolidayName(run.name, locale),
                dates: formatDateRange(run.from, run.to, locale),
              })}.`
          )
        : []),
      ...facts.holidays.map((h) =>
        shared('breaks.holiday', {
          name: translateHolidayName(h.name, locale),
          dates: list.format(h.dates.map((d) => formatHubDate(d, locale))),
        })
      ),
    ];
    if (lines.length === 0) return null;
    const effect =
      facts.onBreak === null || facts.otherwise === null
        ? null
        : facts.onBreak === facts.otherwise
          ? shared('breaks.effectSame', { minutes: facts.onBreak })
          : shared('breaks.effect', { on: facts.onBreak, off: facts.otherwise });
    return { question: question('breaks'), answer: [...lines, effect].filter(Boolean).join(' ') };
  };

  const hours = (): Item | null => {
    const usual = calendar ? usualHours(calendar, region) : [];
    if (usual.length === 0 || !calendar) return null;
    const parks = list.format(
      usual.map((u) =>
        shared('hours.park', {
          park: shortParkName(u.park.name),
          hours: formatHoursRange(u.opensAt, u.closesAt, locale, timezone),
        })
      )
    );
    const headlinerSlugs = region.parks.filter((p) => p.headliner).map((p) => p.slug);
    const early = factDays(calendar).days.filter((day) =>
      headlinerSlugs.some((slug) => closesEarly(day.parks[slug]))
    ).length;
    return {
      question: question('hours'),
      answer: [
        shared('hours.a', { parks }),
        early > 0 ? shared('hours.early', { count: early }) : '',
      ]
        .filter(Boolean)
        .join(' '),
    };
  };

  const parks = (): Item | null => {
    const means = calendar ? parkMeans(calendar, region) : [];
    if (means.length < 2 || !calendar) return null;
    return {
      question: question('parks'),
      answer: shared('parks.a', {
        days: factDays(calendar).days.length,
        list: list.format(
          means.map((m) =>
            shared('parks.park', { park: shortParkName(m.park.name), minutes: m.minutes })
          )
        ),
      }),
    };
  };

  const closures = (): Item | null => {
    const closed = calendar ? parkClosures(calendar, region) : [];
    if (closed.length === 0) return null;
    const lines = closed.map((c) =>
      c.runs.length > MAX_CLOSED_RUNS
        ? shared('closures.days', { park: shortParkName(c.park.name), count: c.days })
        : shared('closures.run', {
            park: shortParkName(c.park.name),
            dates: list.format(c.runs.map((r) => formatDateRange(r.from, r.to, locale))),
          })
    );
    return {
      question: question('closures'),
      answer: shared('closures.a', { list: list.format(lines) }),
    };
  };

  const onTheFigure = async (): Promise<Item[]> => {
    const figure = await accuracy;
    const horizon = forecastUntil
      ? shared('accuracy.horizon', { date: formatHubDate(forecastUntil, locale, 'long') })
      : shared('accuracy.horizonNoDate');
    const measured = figure
      ? `${shared('accuracy.figure', {
          lead: figure.leadDays,
          days: figure.days,
          minutes: Math.round(figure.maeMinutes),
          parks: figure.parks,
        })} ${shared('accuracy.planner')}`
      : shared('accuracy.plannerNoFigure');
    return [
      { question: shared('peak.q'), answer: shared('peak.a'), key: 'peak' },
      { question: shared('green.q'), answer: shared('green.a'), key: 'green' },
      { question: shared('sources.q'), answer: shared('sources.a'), key: 'sources' },
      {
        question: shared('accuracy.q'),
        answer: [horizon, measured, shared('accuracy.rounding')].join(' '),
        id: TRIP_ACCURACY_ID,
        key: 'accuracy',
      },
    ];
  };

  const words = (item: Item) => countWords(`${item.question} ${item.answer}`);
  // The questions in their order of worth, each taken while the list stays within its words.
  const within = (candidates: Array<Item | null>, max: number, room: number, used = 0) => {
    const taken: Item[] = [];
    for (const item of candidates) {
      if (!item || taken.length === room || used + words(item) > max) continue;
      taken.push(item);
      used += words(item);
    }
    return taken;
  };
  let items: Item[];
  if (onMonth) {
    items = within(
      [
        keyed('quietest', quietest()),
        keyed('events', events()),
        keyed('party', partyNight()),
        keyed('weekdays', weekdays()),
        keyed('breaks', breaks()),
        keyed('epic', weekendPark()),
        keyed('hours', hours()),
      ],
      MONTH_WORDS_MAX,
      Infinity
    );
    const used = items.reduce((sum, item) => sum + words(item), 0);
    if (used < MONTH_WORDS_MIN) {
      items = [
        ...items,
        ...within(
          [keyed('parks', parks()), keyed('closures', closures())],
          MONTH_WORDS_MAX,
          Infinity,
          used
        ),
      ];
    }
  } else {
    const onFigure = await onTheFigure();
    const reserved = onFigure.reduce((sum, item) => sum + words(item), 0);
    items = [
      ...within(
        [
          keyed('quietest', quietest()),
          keyed('events', events()),
          keyed('party', partyNight()),
          keyed('epic', weekendPark()),
          keyed('distance', distance()),
          keyed('early', earlySlots()),
          ...fixed(),
          keyed('weekdays', weekdays()),
          keyed('parks', parks()),
          keyed('breaks', breaks()),
          keyed('hours', hours()),
        ],
        HUB_WORDS_MAX,
        HUB_QUESTIONS - SHARED_ON_HUB,
        reserved
      ),
      ...onFigure,
    ];
  }

  if (items.length === 0) return null;
  // A date that ends a sentence on its abbreviation („21. Nov.“) keeps one full stop.
  const answered = items.map((item) => ({ ...item, answer: oneFullStop(item.answer) }));
  return (
    <section className="scroll-mt-24" id="faq">
      <ChapterHeading
        index={index}
        icon={HelpCircle}
        title={ownWords(t, 'title') ?? shared('title')}
      />
      <FaqList items={answered} />
      <p className="mt-6 text-sm">
        {shared.rich('links', {
          fancast: (chunks) => (
            <Link href="/fancast" className={link}>
              {chunks}
            </Link>
          ),
          howto: (chunks) => (
            <Link
              href={`/${HOWTO_SEGMENTS[locale as Locale] ?? HOWTO_SEGMENTS.en}`}
              className={link}
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </section>
  );
}
