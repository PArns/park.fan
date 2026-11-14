'use client';

import { useId, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { addDays, formatParkDay } from '@/lib/utils/park-day';
import {
  MAX_DAYS_AHEAD,
  MAX_TRIP_DAYS,
  MIN_FIND_DAYS,
  setFindMode,
  type PlanSearchRange,
} from '@/lib/trip-regions/plan';
import {
  holidayRegionsFor,
  whenPeriodOf,
  whenPeriods,
  type WhenPeriodKey,
} from '@/lib/trip-regions/plan-when';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS, PlanCheckRow, PlanChip, PlanStepper } from './plan-controls';
import { PlanDates } from './plan-dates';
import { useSchoolBreaks } from './use-trip-plan';

/** The search the When mode opens on: the next twelve months. */
export function defaultSearchRange(today: string): PlanSearchRange {
  return { from: today, to: addDays(today, MAX_DAYS_AHEAD) };
}

/**
 * Step 1, the dates: the range calendar, and under it one quiet way to the other question, "No
 * dates yet? Find the best time" (a period, a trip length, and if wanted only the school holidays
 * of a region), with its way back. The choice is the `when` of the URL, so a link from Parky's
 * `find_trip_dates` opens on the search.
 */
export function PlanDatesStep({ defaultMonth }: { defaultMonth?: string }) {
  const t = useTranslations('tripPlanner.find');
  const tSetup = useTranslations('tripPlanner.setup');
  const tTickets = useTranslations('tripPlanner.tickets');
  const { state, update, today, live } = usePlanContext();
  const find = state.when !== null;
  // `/when` searches a ticket's start; a first day fixed at purchase leaves nothing to search.
  const fixed = state.tickets.some((ticket) => ticket.start !== null);
  const fixedId = useId();
  const choose = (next: boolean) =>
    today && update((s) => setFindMode(s, next, defaultSearchRange(today)));
  const switchLink = (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => choose(!find)}
        disabled={!live || !today || (!find && fixed)}
        aria-describedby={!find && fixed ? fixedId : undefined}
        data-plan-find-switch={find ? 'known' : 'find'}
        className={cn(
          'text-primary-ink min-h-11 self-start rounded-md px-1 text-left text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50 disabled:hover:no-underline',
          PLAN_FOCUS
        )}
      >
        {find ? t('modeKnown') : tSetup('findLink')}
      </button>
      {fixed && !find && (
        <p id={fixedId} className="text-muted-foreground text-xs">
          {tTickets('find.fixed')}
        </p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {find ? <PlanFind /> : <PlanDates defaultMonth={defaultMonth} />}
      {switchLink}
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
              }}
              label={t(`periods.${period.key}`, { year: period.year })}
            />
          ))}
          <PlanChip
            selected={chosen === 'custom'}
            onClick={() => setCustom(true)}
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
                className={cn(
                  'border-border bg-background h-11 rounded-md border px-2 text-sm',
                  PLAN_FOCUS
                )}
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
                className={cn(
                  'border-border bg-background h-11 rounded-md border px-2 text-sm',
                  PLAN_FOCUS
                )}
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
          onChange={(on) =>
            update((s) => ({
              ...s,
              within: on
                ? (countries.find((c) => c.country === withinCountry)?.regions[0]?.code ?? null)
                : null,
            }))
          }
          label={t('holidays')}
          hint={
            countries.length === 0 && breaks.isError ? t('holidaysUnavailable') : t('holidaysHint')
          }
        />
        {state.within && (
          <div id={regionsId} className="grid grid-cols-2 gap-2 pl-9">
            <label className="flex flex-col gap-1 text-xs">
              {t('country')}
              <select
                value={withinCountry ?? ''}
                disabled={!live}
                onChange={(e) => {
                  const country = countries.find((c) => c.country === e.currentTarget.value);
                  if (country) update((s) => ({ ...s, within: country.regions[0]?.code ?? null }));
                }}
                className={cn(
                  'border-border bg-background h-11 rounded-md border px-2 text-sm',
                  PLAN_FOCUS
                )}
              >
                {countries.map((c) => (
                  <option key={c.country} value={c.country}>
                    {countryName?.of(c.country) ?? c.country}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              {t('region')}
              <select
                value={state.within}
                disabled={!live}
                onChange={(e) => {
                  const code = e.currentTarget.value;
                  update((s) => ({ ...s, within: code }));
                }}
                className={cn(
                  'border-border bg-background h-11 rounded-md border px-2 text-sm',
                  PLAN_FOCUS
                )}
              >
                {countries
                  .find((c) => c.country === withinCountry)
                  ?.regions.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
            {withinRegion && today && (
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
