'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarCheck } from 'lucide-react';
import { addDays, formatParkDay, formatParkDayRange } from '@/lib/utils/park-day';
import { Button } from '@/components/ui/button';
import {
  MAX_DAYS_AHEAD,
  MAX_TRIP_DAYS,
  MIN_FIND_DAYS,
  effectiveParks,
  setFindMode,
  setTripDates,
  type PlanSearchRange,
} from '@/lib/trip-regions/plan';
import { defaultSearchRange, quietWeek, quietWeekWindow } from '@/lib/trip-regions/trip-dates';
import {
  holidayRegionsFor,
  whenPeriodOf,
  whenPeriods,
  type WhenPeriodKey,
} from '@/lib/trip-regions/plan-when';
import { usePlanContext, useTripEvents } from './plan-context';
import {
  PLAN_FIELD,
  PlanCheckRow,
  PlanChip,
  PlanSegmented,
  PlanSelect,
  PlanStepper,
} from './plan-controls';
import { PlanDates } from './plan-dates';
import { useSchoolBreaks, useTripCalendar } from './use-trip-plan';

/**
 * Step 1, the dates, its two answers side by side as equals: „Ich kenne meine Daten“, the range
 * calendar with the quietest week ahead offered over it (`QuietWeekCard`), or „Daten finden“, the
 * search (a period, a trip length, and if wanted only the school holidays of a region). The choice
 * is the `when` of the URL, so a link from Parky's `find_trip_dates` opens on the search.
 */
export function PlanDatesStep({
  defaultMonth,
  monthChips = false,
  onPending,
}: {
  defaultMonth?: string;
  /** The assistant's month chips over the grid (`PlanDates`). */
  monthChips?: boolean;
  onPending?: (pending: boolean) => void;
}) {
  const t = useTranslations('tripPlanner.wizard.dates');
  const tTickets = useTranslations('tripPlanner.tickets');
  const { state, update, today, live } = usePlanContext();
  const track = useTripEvents();
  const [pending, setPending] = useState(false);
  const find = state.when !== null;
  // `/when` searches a ticket's start; a first day fixed at purchase leaves nothing to search.
  const fixed = state.tickets.some((ticket) => ticket.start !== null);
  const fixedId = useId();
  const choose = (mode: 'known' | 'find') => {
    if (!today || (mode === 'find') === find) return;
    track('trip_find_toggled', { to: mode });
    update((s) => setFindMode(s, mode === 'find', defaultSearchRange(today)));
  };
  const pend = useCallback(
    (next: boolean) => {
      setPending(next);
      onPending?.(next);
    },
    [onPending]
  );

  return (
    <div className="flex flex-col gap-3">
      <PlanSegmented
        label={t('mode')}
        value={find ? 'find' : 'known'}
        disabled={!live || !today}
        onChange={choose}
        options={[
          { value: 'known', label: t('known') },
          {
            value: 'find',
            label: t('find'),
            disabled: !find && fixed,
            describedBy: !find && fixed ? fixedId : undefined,
          },
        ]}
      />
      {fixed && !find && (
        <p id={fixedId} className="text-muted-foreground text-xs">
          {tTickets('find.fixed')}
        </p>
      )}
      {find ? (
        <PlanFind />
      ) : (
        <>
          {!fixed && !pending && !(state.from && state.to) && <QuietWeekCard />}
          <PlanDates defaultMonth={defaultMonth} monthChips={monthChips} onPending={pend} />
        </>
      )}
    </div>
  );
}

/**
 * The quietest week ahead for the parks of the trip (`quietWeek`, from the region calendar's next
 * eight weeks), one press from being the trip's dates. Never chosen for the visitor: the address
 * changes only on the press. Its box is held while the calendar loads, so the grid under it does
 * not move; with no week to offer it leaves.
 */
function QuietWeekCard() {
  const t = useTranslations('tripPlanner.wizard.dates');
  const { state, update, today, locale, live, headliners } = usePlanContext();
  const track = useTripEvents();
  const span = useMemo(() => (today ? quietWeekWindow(today) : null), [today]);
  const calendar = useTripCalendar(span?.from ?? null, span?.to ?? null);
  const parks = useMemo(
    () => effectiveParks(state, headliners).map((p) => p.slug),
    [state, headliners]
  );
  const week = useMemo(
    () => (calendar.data && span ? quietWeek(calendar.data.days, parks, span.from) : null),
    [calendar.data, parks, span]
  );
  if (!week && !calendar.isPending) return null;
  return (
    <div
      className="border-border/60 flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2"
      data-plan-quiet-week=""
      aria-busy={!week}
    >
      <CalendarCheck className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm">
        {week &&
          t('quiet', {
            range: formatParkDayRange(locale, week.from, week.to, {
              day: 'numeric',
              month: 'short',
            }),
          })}
      </p>
      {week && (
        <Button
          variant="outline"
          size="sm"
          disabled={!live}
          onClick={() => {
            track('trip_quiet_week_taken');
            update((s) => setTripDates(s, week.from, week.to));
          }}
        >
          {t('quietTake')}
        </Button>
      )}
    </div>
  );
}

/**
 * The When mode's inputs: the period chips (the next twelve months, next year and its seasons, or
 * a range of the visitor's own), the trip length (3–21 days, 10 to start), and "only in our school
 * holidays" with a region in the holiday data's codes, the reader's own country first.
 */
export function PlanFind() {
  const t = useTranslations('tripPlanner.find');
  const { state, update, today, locale, live } = usePlanContext();
  const track = useTripEvents();
  const regionsId = useId();
  const periods = useMemo(() => (today ? whenPeriods(today, state.days) : []), [today, state.days]);
  // A range of the visitor's own can coincide with a chip's; "Custom" stays chosen once pressed.
  const [custom, setCustom] = useState(false);
  const chosen: WhenPeriodKey = custom ? 'custom' : whenPeriodOf(state.when, periods);
  const last = today ? addDays(today, MAX_DAYS_AHEAD) : undefined;
  const breaks = useSchoolBreaks(live);
  const countries = useMemo(() => holidayRegionsFor(breaks.data, locale), [breaks.data, locale]);
  const countryName = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: 'region' });
    } catch {
      return null;
    }
  }, [locale]);
  const withinRegion = countries.flatMap((c) => c.regions).find((r) => r.code === state.within);
  const withinCountry =
    countries.find((c) => c.regions.some((r) => r.code === state.within))?.country ??
    countries[0]?.country ??
    null;

  const setRange = (range: PlanSearchRange) => update((s) => ({ ...s, when: range }));

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2" disabled={!live}>
        <legend className="mb-1 text-sm font-semibold">{t('period')}</legend>
        <div className="flex flex-wrap gap-2">
          {periods.map((period) => (
            <PlanChip
              key={period.key}
              selected={chosen === period.key}
              onClick={() => {
                setCustom(false);
                setRange(period.range);
                track('trip_find_period', {
                  period: period.key,
                  school_breaks: state.within !== null,
                });
              }}
              label={t(`periods.${period.key}`, { year: period.year })}
            />
          ))}
          <PlanChip
            selected={chosen === 'custom'}
            onClick={() => {
              setCustom(true);
              track('trip_find_period', { period: 'custom', school_breaks: state.within !== null });
            }}
            label={t('periods.custom')}
          />
        </div>
        {chosen === 'custom' && state.when && (
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs">
              {t('customFrom')}
              <input
                type="date"
                value={state.when.from}
                min={today ?? undefined}
                max={last}
                onChange={(e) => {
                  const from = e.currentTarget.value;
                  if (from && state.when)
                    setRange({ from, to: from > state.when.to ? from : state.when.to });
                }}
                className={PLAN_FIELD}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              {t('customTo')}
              <input
                type="date"
                value={state.when.to}
                min={state.when.from}
                max={last}
                onChange={(e) => {
                  const to = e.currentTarget.value;
                  if (to && state.when) setRange({ from: state.when.from, to });
                }}
                className={PLAN_FIELD}
              />
            </label>
          </div>
        )}
      </fieldset>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{t('length')}</span>
        <PlanStepper
          value={t('lengthValue', { days: state.days })}
          disabled={!live}
          canDecrement={state.days > MIN_FIND_DAYS}
          canIncrement={state.days < MAX_TRIP_DAYS}
          onDecrement={() => update((s) => ({ ...s, days: s.days - 1 }))}
          onIncrement={() => update((s) => ({ ...s, days: s.days + 1 }))}
          decrementLabel={t('shorter')}
          incrementLabel={t('longer')}
        />
      </div>

      <div className="flex flex-col gap-2">
        <PlanCheckRow
          checked={state.within !== null}
          disabled={!live || (countries.length === 0 && state.within === null)}
          onChange={(on) => {
            // Whether the search keeps to school holidays, never which: a region says where the
            // visitor lives.
            track('trip_find_period', { period: chosen, school_breaks: on });
            update((s) => ({
              ...s,
              within: on
                ? (countries.find((c) => c.country === withinCountry)?.regions[0]?.code ?? null)
                : null,
            }));
          }}
          label={t('holidays')}
          hint={
            countries.length === 0 && breaks.isError ? t('holidaysUnavailable') : t('holidaysHint')
          }
        />
        {state.within && (
          <div id={regionsId} className="grid grid-cols-2 gap-2 pl-9">
            <label className="flex flex-col gap-1 text-xs">
              {t('country')}
              <PlanSelect
                value={withinCountry ?? ''}
                disabled={!live}
                onChange={(e) => {
                  const country = countries.find((c) => c.country === e.currentTarget.value);
                  if (country) update((s) => ({ ...s, within: country.regions[0]?.code ?? null }));
                }}
              >
                {countries.map((c) => (
                  <option key={c.country} value={c.country}>
                    {countryName?.of(c.country) ?? c.country}
                  </option>
                ))}
              </PlanSelect>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              {t('region')}
              <PlanSelect
                value={state.within}
                disabled={!live}
                onChange={(e) => {
                  const code = e.currentTarget.value;
                  update((s) => ({ ...s, within: code }));
                }}
              >
                {countries
                  .find((c) => c.country === withinCountry)
                  ?.regions.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
              </PlanSelect>
            </label>
            {withinRegion?.through && today && (
              <p className="text-muted-foreground col-span-2 text-xs">
                {t('through', {
                  date: formatParkDay(locale, withinRegion.through, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }),
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
