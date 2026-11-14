'use client';

import { useCallback, useDeferredValue, useMemo, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { monthLabel, monthMatrix, monthOf } from '@/lib/planner/month-grid';
import { formatClockTime, getDateTimeFormat, getListFormat } from '@/lib/utils/intl-format';
import { CROWD_TEXT_CLASS, isColoredCrowdLevel } from '@/lib/utils/crowd-level-styles';
import { addDays, formatParkDayRange } from '@/lib/utils/park-day';
import { MAX_DAYS_AHEAD, MAX_TRIP_DAYS, setTripDates, tripDates } from '@/lib/trip-regions/plan';
import { ticketWindows } from '@/lib/trip-regions/plan-tickets';
import { dateLevel, parkCodeKey, parkLabel, TRIP_DAY_SIGNALS } from '@/lib/trip-regions/plan-week';
import {
  calendarResorts,
  dateParties,
  datePicks,
  defaultCalendarMode,
  isNewYearsEve,
  modePick,
  monthEvents,
  type CalendarMode,
  type DateParty,
  type DatePick,
} from '@/lib/trip-regions/date-facts';
import { dayGuestClose, shortGroupName } from '@/lib/trip-regions/hub-data';
import type { TripCalendarDay, TripRegionPark } from '@/lib/trip-regions/types';
import { holidaySignals } from '@/lib/utils/day-signal-styles';
import { ParkCalendarLegend } from '@/components/parks/park-calendar-legend';
import { usePlanContext } from './plan-context';
import { useTripCalendar } from './use-trip-plan';
import { PlanCheckRow, PlanSegmented } from './plan-controls';
import { PlanMonthGrid, type PlanGridPick } from './plan-month-grid';
import { PlanCodeKey, PlanMonthEvents } from './plan-calendar-keys';
import { useResortWord } from './plan-ticket-words';
import { useSeasonName } from './use-day-facts';

/** The bars a date grid draws per ticket, in entry order: the first in brand blue, the rest muted. */
const BAR_ROWS = 3;

/** What the grid says of one date, worked out once for the cell, its label and the line below. */
interface DateFacts {
  day: TripCalendarDay;
  picks: DatePick[];
  parties: DateParty[];
  nye: boolean;
}

/**
 * A date as the switch's mode shows it: one pick, the other resorts' picks (overall only), the
 * parties of the resorts in view, and the one the cell marks: the party of the pick's own resort.
 */
interface DateView {
  pick: DatePick | null;
  others: DatePick[];
  parties: DateParty[];
  cellParty: DateParty | null;
}

/**
 * The date the line under the grid explains: the last one pointed at, focused or pressed. A store
 * rather than state, so pointing at a date redraws that line and not the forty-two tiles.
 */
function createShownDate() {
  let shown: string | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => shown,
    set: (date: string) => {
      if (date === shown) return;
      shown = date;
      for (const listener of listeners) listener();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * The trip's dates: a month at a time (`PlanMonthGrid`), the first press the arrival and the second
 * the departure, at most {@link MAX_TRIP_DAYS} days. A switch above the grid picks what each date
 * shows: the park with the shortest peak wait overall, or in one resort (`calendarResorts`,
 * `modePick`), in its crowd colour, with a ticket where a party night sends day guests home early
 * and a mark on New Year's Eve; a date without picks is tinted by how busy the headliners are
 * (`dateLevel`). The switch starts on the one resort the visitor's parks or tickets lie in
 * (`defaultCalendarMode`) and lives in this component, not in the address.
 * Pointing at a date or pressing it explains its pick in a line under the grid; the codes, the
 * month's events and the colours are keyed below. A last-year tint has a dashed border. Arrival and
 * departure carry their plane and a light band joins the days between. The tickets' windows are
 * thin bars along the dates, named in a key. Then whether the travel days hold a park.
 */
export function PlanDates({ defaultMonth }: { defaultMonth?: string }) {
  const t = useTranslations('tripPlanner');
  const tCrowd = useTranslations('parks.crowdLevels');
  const {
    state,
    update,
    today,
    locale,
    timeZone,
    region,
    config,
    parkName,
    headliners,
    live,
    tickets: catalog,
  } = usePlanContext();
  const resortWord = useResortWord();
  const seasonName = useSeasonName();

  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [shownDate] = useState(createShownDate);
  const [chosenMode, setMode] = useState<CalendarMode | null>(null);
  const windows = useMemo(() => ticketWindows(state.tickets, catalog), [state.tickets, catalog]);
  const shown =
    month ??
    monthOf(
      state.from ?? windows[0]?.from ?? (defaultMonth ? `${defaultMonth}-01` : (today ?? ''))
    );
  const last = today ? addDays(today, MAX_DAYS_AHEAD) : null;

  const cells = useMemo(() => (shown ? monthMatrix(shown) : []), [shown]);
  const windowFrom = cells.length && today ? (cells[0].date < today ? today : cells[0].date) : null;
  const windowTo =
    cells.length && last ? (cells.at(-1)!.date > last ? last : cells.at(-1)!.date) : null;
  const calendar = useTripCalendar(
    windowFrom && windowTo && windowFrom <= windowTo ? windowFrom : null,
    windowFrom && windowTo && windowFrom <= windowTo ? windowTo : null
  );
  const facts = useMemo(() => {
    const out = new Map<string, DateFacts>();
    for (const day of calendar.data?.days ?? []) {
      out.set(day.date, {
        day,
        picks: datePicks(day, region, calendar.data),
        parties: dateParties(day, region, calendar.data),
        nye: isNewYearsEve(day.date),
      });
    }
    return out;
  }, [calendar.data, region]);

  const resorts = useMemo(() => calendarResorts(region), [region]);
  const resortKeys = useMemo(() => resorts.map((r) => r.key), [resorts]);
  const fallbackMode = defaultCalendarMode(
    region,
    state.parks?.map((p) => p.slug) ?? null,
    windows.map((w) => w.resort)
  );
  const mode: CalendarMode =
    chosenMode && (chosenMode === 'all' || resortKeys.includes(chosenMode))
      ? chosenMode
      : fallbackMode;
  // The switch lights at once; the forty-two tiles follow the deferred copy.
  const gridMode = useDeferredValue(mode);
  const views = useMemo(() => {
    const out = new Map<string, DateView>();
    const inScope = (group: string) =>
      gridMode === 'all' ? resortKeys.includes(group) : group === gridMode;
    for (const [date, fact] of facts) {
      const pick = modePick(fact.picks, gridMode, resortKeys);
      const parties = fact.parties.filter((p) => inScope(p.park.group));
      out.set(date, {
        pick,
        others:
          gridMode === 'all'
            ? fact.picks.filter((p) => p !== pick && resortKeys.includes(p.group.key))
            : [],
        parties,
        cellParty: parties.find((p) => p.park.group === pick?.group.key) ?? null,
      });
    }
    return out;
  }, [facts, gridMode, resortKeys]);

  const parkBy = useMemo(() => new Map(region.parks.map((p) => [p.slug, p])), [region.parks]);
  const tight = useCallback(
    (park: TripRegionPark) => parkLabel(park, config.parkShortNames, 'tight'),
    [config.parkShortNames]
  );
  const codeOf = useCallback(
    (slug: string) => {
      const park = parkBy.get(slug);
      return park ? tight(park) : slug;
    },
    [parkBy, tight]
  );
  const considered = useMemo(() => {
    const parks = state.parks?.map((p) => p.slug) ?? [...headliners];
    return gridMode === 'all'
      ? parks
      : parks.filter((slug) => parkBy.get(slug)?.group === gridMode);
  }, [state.parks, headliners, gridMode, parkBy]);
  const events = useMemo(
    () => (calendar.data && shown ? monthEvents(calendar.data, shown, considered) : []),
    [calendar.data, shown, considered]
  );
  const inMonth = useMemo(
    () =>
      [...facts.values()]
        .filter((f) => shown && f.day.date.startsWith(shown))
        .map((fact) => ({ fact, view: views.get(fact.day.date)! })),
    [facts, views, shown]
  );
  const codeKey = useMemo(
    () =>
      parkCodeKey(
        region.parks,
        [
          ...inMonth.flatMap(({ view }) => [
            view.pick?.park.slug ?? '',
            view.cellParty?.park.slug ?? '',
            ...view.others.map((p) => p.park.slug),
          ]),
          ...events.flatMap((e) => e.parkSlugs),
        ],
        (park) => parkName(park.slug),
        tight
      ),
    [region.parks, inMonth, events, parkName, tight]
  );
  const anyParty = inMonth.some(({ view }) => view.cellParty);
  const anyNye = inMonth.some(({ fact }) => fact.nye);
  const anyUnpublished = inMonth.some(({ view }) => view.pick?.hoursUnpublished);
  const anyTint = inMonth.some(({ fact, view }) => !view.pick && dateLevel(fact.day, headliners));

  const start = pendingFrom ?? state.from;
  const end = pendingFrom ? null : state.to;
  const selectable = (date: string) => {
    if (!today || !last || date < today || date > last) return false;
    if (pendingFrom && date > addDays(pendingFrom, MAX_TRIP_DAYS - 1)) return false;
    return true;
  };

  const choose = (date: string) => {
    if (!pendingFrom || date < pendingFrom) {
      setPendingFrom(date);
      return;
    }
    setPendingFrom(null);
    update((s) => setTripDates(s, pendingFrom, date));
  };

  const dayLabel = getDateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });
  const clock = useCallback(
    (iso: string) => formatClockTime(iso, locale, timeZone),
    [locale, timeZone]
  );
  const length = tripDates(state).length;
  const anyLastYear = (calendar.data?.days ?? []).some((d) =>
    headliners.some((s) => d.parks[s]?.basis === 'last_year')
  );
  const shortRange = (from: string, to: string) =>
    formatParkDayRange(locale, from, to, { day: 'numeric', month: 'short' });

  /**
   * A pick in words: the resort (or „overall“), the park, its peak wait, how busy, and why it beat
   * a quieter park.
   */
  const pickText = useCallback(
    (pick: DatePick, overall = false) => {
      const level = isColoredCrowdLevel(pick.day.crowdLevel) ? pick.day.crowdLevel : null;
      const rival = pick.earlyElsewhere;
      const rivalLeaves = rival ? dayGuestClose(rival.day) : undefined;
      const parts = [
        overall
          ? t('dates.overall', { park: parkName(pick.park.slug) })
          : `${shortGroupName(pick.group.name)}: ${parkName(pick.park.slug)}`,
        pick.day.headlinerWait != null ? t('peakWait', { minutes: pick.day.headlinerWait }) : null,
        level ? t('dates.level', { level: tCrowd(level) }) : null,
        pick.hoursUnpublished ? t('dates.unpublished') : null,
      ];
      const ahead =
        rival && rivalLeaves && rival.day.headlinerWait != null
          ? t('dates.ahead', {
              park: parkName(rival.park.slug),
              minutes: rival.day.headlinerWait,
              time: clock(rivalLeaves),
            })
          : null;
      return [parts.filter(Boolean).join(', '), ahead].filter(Boolean).join('. ');
    },
    [clock, parkName, t, tCrowd]
  );
  const partyText = useCallback(
    (party: DateParty) => {
      const values = {
        park: parkName(party.park.slug),
        time: party.day.evening ? clock(party.day.evening.opensAt) : '',
        leave: clock(party.leaveAt),
      };
      return party.season
        ? t('dates.party', { ...values, name: seasonName(party.season) })
        : t('dates.partyUnnamed', values);
    },
    [clock, parkName, seasonName, t]
  );

  return (
    <div className="flex flex-col gap-3">
      {resorts.length > 1 && (
        <PlanSegmented<CalendarMode>
          label={t('dates.modeLabel')}
          value={mode}
          disabled={!live}
          onChange={setMode}
          options={[
            { value: 'all', label: t('dates.modeAll') },
            ...resorts.map((r) => ({ value: r.key, label: resortWord(r.key) })),
          ]}
        />
      )}
      <PlanMonthGrid
        month={shown}
        onMonth={setMonth}
        title={shown && today ? monthLabel(shown, locale) : ' '}
        locale={locale}
        canPrev={Boolean(today && shown && shown > monthOf(today))}
        canNext={Boolean(last && shown && shown < monthOf(last))}
        prevLabel={t('dates.prevMonth')}
        nextLabel={t('dates.nextMonth')}
        gridLabel={t('dates.gridLabel')}
        preferred={start}
        live={live}
        rich
        onPick={choose}
        onShow={shownDate.set}
        day={(date) => {
          const fact = facts.get(date);
          const view = views.get(date);
          const day = fact?.day;
          const pick = view?.pick ?? null;
          // The pick carries the colour where there is one: a region tint behind it would be a
          // second, flatter answer to the same question.
          const level = pick ? null : dateLevel(day, headliners);
          const lastYear = headliners.some((s) => day?.parks[s]?.basis === 'last_year');
          const isStart = date === start;
          const isEnd = !isStart && date === end;
          const inRange = Boolean(start && end && date > start && date < end);
          const held = windows.filter((w) => date >= w.from && date <= w.to);
          const ticketResorts = [...new Set(held.map((w) => resortWord(w.resort)))];
          const party = view?.cellParty ?? null;
          const picks: PlanGridPick[] = pick
            ? [
                {
                  code: tight(pick.park),
                  wide: parkLabel(pick.park, config.parkShortNames, 'wide'),
                  name: parkName(pick.park.slug),
                  level: isColoredCrowdLevel(pick.day.crowdLevel) ? pick.day.crowdLevel : null,
                  unpublished: pick.hoursUnpublished,
                  party: party
                    ? {
                        wide: parkLabel(party.park, config.parkShortNames, 'wide'),
                        name: partyText(party),
                      }
                    : null,
                },
              ]
            : [];
          return {
            enabled: selectable(date),
            mark: isStart ? 'start' : isEnd ? 'end' : inRange ? 'range' : null,
            band:
              start && end && start !== end
                ? isStart
                  ? 'start'
                  : isEnd
                    ? 'end'
                    : inRange
                      ? 'middle'
                      : undefined
                : undefined,
            lastYear,
            level,
            signals: holidaySignals(day ?? null),
            picks,
            nye: fact?.nye,
            bars: windows
              .slice(0, BAR_ROWS)
              .map((w, row) =>
                date >= w.from && date <= w.to ? (row === 0 ? 'primary' : 'muted') : null
              )
              .filter((b): b is 'primary' | 'muted' => b !== null),
            label: [
              today ? dayLabel.format(new Date(`${date}T12:00:00Z`)) : date,
              isStart ? t('day.arrival') : isEnd ? t('day.departure') : null,
              fact?.nye ? t('dates.nye') : null,
              level
                ? t(lastYear ? 'dates.levelLastYear' : 'dates.level', { level: tCrowd(level) })
                : null,
              pick ? pickText(pick, gridMode === 'all') : null,
              ...(view?.parties ?? []).map(partyText),
              ticketResorts.length > 0
                ? t('tickets.dates.inTicket', {
                    resorts: list.format(ticketResorts),
                    count: ticketResorts.length,
                  })
                : null,
            ]
              .filter(Boolean)
              .join(', '),
          };
        }}
      />

      <PlanDateInfo
        shownDate={shownDate}
        facts={facts}
        views={views}
        overall={gridMode === 'all'}
        labelOf={tight}
        dayLabel={(date) => dayLabel.format(new Date(`${date}T12:00:00Z`))}
        pickText={pickText}
        partyText={partyText}
      />

      <PlanCodeKey entries={codeKey} />

      {windows.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs" data-plan-ticket-key="">
          {windows.slice(0, BAR_ROWS).map((w, row) => (
            <li key={w.index} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  'h-[3px] w-5 shrink-0 rounded-full',
                  row === 0 ? 'bg-primary' : 'bg-foreground/55'
                )}
              />
              <span>
                {today
                  ? t('tickets.dates.key', {
                      resort: resortWord(w.resort),
                      range: shortRange(w.from, w.to),
                    })
                  : ' '}
              </span>
            </li>
          ))}
        </ul>
      )}

      {shown && <PlanMonthEvents events={events} month={shown} codeOf={codeOf} locale={locale} />}

      <ParkCalendarLegend signals={TRIP_DAY_SIGNALS} signalsLabel={false} />

      <ul className="text-muted-foreground flex flex-col gap-1 text-xs leading-snug">
        <li>
          {gridMode === 'all'
            ? t('dates.picksLegendAll')
            : t('dates.picksLegendResort', { resort: resortWord(gridMode) })}
        </li>
        <li>{t('crowdColour')}</li>
        {anyParty && (
          <li className="flex items-center gap-1.5">
            <Ticket className="text-crowd-ink-high size-3 shrink-0" aria-hidden="true" />
            {t('dates.partyKey')}
          </li>
        )}
        {anyNye && (
          <li className="flex items-center gap-1.5">
            <Sparkles className="text-primary-ink size-3 shrink-0" aria-hidden="true" />
            {t('dates.nyeKey')}
          </li>
        )}
        {anyUnpublished && <li>{t('dates.unpublishedKey')}</li>}
        {(anyTint || anyLastYear) && (
          <li>
            {[anyTint ? t('dates.legend') : null, anyLastYear ? t('dates.legendLastYear') : null]
              .filter(Boolean)
              .join(' ')}
          </li>
        )}
      </ul>

      <p className="min-h-5 text-sm font-medium" aria-live="polite">
        {!today
          ? ' '
          : pendingFrom
            ? t('dates.pickDeparture')
            : state.from && state.to
              ? `${formatParkDayRange(locale, state.from, state.to, { weekday: 'short', day: 'numeric', month: 'short' })} · ${t('dates.dayCount', { count: length })}`
              : t('dates.pickArrival')}
      </p>

      <div className="flex flex-col">
        <PlanCheckRow
          checked={state.arrival === 'park'}
          disabled={!live}
          onChange={(on) => update((s) => ({ ...s, arrival: on ? 'park' : 'free' }))}
          label={t('dates.arrivalPark')}
          hint={t('dates.arrivalParkHint')}
        />
        <PlanCheckRow
          checked={state.departure === 'park'}
          disabled={!live}
          onChange={(on) => update((s) => ({ ...s, departure: on ? 'park' : 'free' }))}
          label={t('dates.departurePark')}
          hint={t('dates.departureParkHint')}
        />
      </div>
      {pendingFrom && (
        <p className="text-muted-foreground text-xs">
          {t('dates.maxLength', { days: MAX_TRIP_DAYS })}
        </p>
      )}
    </div>
  );
}

/**
 * The line under the date grid: the date last pointed at, focused or pressed, with its pick in words
 * and why it won (overall, then the other resorts' picks it beat), and the night's parties. Before
 * any, a hint that it is there.
 */
function PlanDateInfo({
  shownDate,
  facts,
  views,
  overall,
  labelOf,
  dayLabel,
  pickText,
  partyText,
}: {
  shownDate: ReturnType<typeof createShownDate>;
  facts: ReadonlyMap<string, DateFacts>;
  views: ReadonlyMap<string, DateView>;
  /** The switch is on „overall“: the pick's line says so. */
  overall: boolean;
  /** A park's label as the cells write it. */
  labelOf: (park: TripRegionPark) => string;
  dayLabel: (date: string) => string;
  pickText: (pick: DatePick, overall?: boolean) => string;
  partyText: (party: DateParty) => string;
}) {
  const t = useTranslations('tripPlanner.dates');
  const date = useSyncExternalStore(shownDate.subscribe, shownDate.get, () => null);
  const fact = date ? facts.get(date) : undefined;
  const view = date ? views.get(date) : undefined;
  const picks = view?.pick ? [view.pick, ...view.others] : [];
  return (
    <div
      data-plan-date-info={date ?? ''}
      className="border-border/60 bg-muted/30 min-h-24 rounded-lg border px-3 py-2 text-xs leading-snug"
    >
      {!date || !fact || !view ? (
        <p className="text-muted-foreground">{t('infoHint')}</p>
      ) : (
        <>
          <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
            {dayLabel(date)}
            {fact.nye && (
              <>
                <Sparkles className="text-primary-ink size-3.5" aria-hidden="true" />
                <span className="text-primary-ink">{t('nye')}</span>
              </>
            )}
          </p>
          {picks.length === 0 && <p className="text-muted-foreground">{t('noPick')}</p>}
          <ul className="flex flex-col gap-0.5">
            {picks.map((pick, index) => {
              const level = isColoredCrowdLevel(pick.day.crowdLevel) ? pick.day.crowdLevel : null;
              return (
                <li
                  key={pick.group.key}
                  className={cn('flex gap-1.5', index > 0 && 'text-muted-foreground')}
                >
                  <span
                    className={cn(
                      'w-8 shrink-0 font-bold tracking-wide',
                      level ? CROWD_TEXT_CLASS[level] : 'text-muted-foreground'
                    )}
                    aria-hidden="true"
                  >
                    {labelOf(pick.park)}
                  </span>
                  <span>{pickText(pick, overall && index === 0)}</span>
                </li>
              );
            })}
            {view.parties.map((party) => (
              <li key={party.park.slug} className="flex gap-1.5">
                <span className="text-crowd-ink-high flex w-8 shrink-0" aria-hidden="true">
                  <Ticket className="mt-0.5 size-3" />
                </span>
                <span>{partyText(party)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
