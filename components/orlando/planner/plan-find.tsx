'use client';

import { useId, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { addDays } from '@/lib/utils/park-day';
import {
  MAX_DAYS_AHEAD,
  MAX_TRIP_DAYS,
  MIN_FIND_DAYS,
  setFindMode,
  type PlanSearchRange,
} from '@/lib/orlando/plan';
import {
  countryOfRegion,
  holidayRegionsFor,
  whenPeriodOf,
  whenPeriods,
  type WhenPeriodKey,
} from '@/lib/orlando/plan-when';
import { usePlanContext } from './plan-context';
import { PLAN_FOCUS, PlanCheckRow, PlanStepper } from './plan-controls';
import { PlanDates } from './plan-dates';

/** The search the When mode opens on: the next twelve months. */
export function defaultSearchRange(today: string): PlanSearchRange {
  return { from: today, to: addDays(today, MAX_DAYS_AHEAD) };
}

/**
 * Step 1, the dates, as a two-way choice: "I know my dates" (the range calendar) or "Find the best
 * dates" (a period, a trip length, and if wanted only the school holidays of a region). The choice
 * is the `when` of the URL, so a link from Parky's `find_trip_dates` opens on the second.
 */
export function PlanDatesStep({ defaultMonth }: { defaultMonth?: string }) {
  const t = useTranslations('orlandoPlanner.find');
  const { state, update, today, live } = usePlanContext();
  const find = state.when !== null;
  const choose = (next: boolean) =>
    today && update((s) => setFindMode(s, next, defaultSearchRange(today)));

  return (
    <div className="flex flex-col gap-4">
      <div
        role="radiogroup"
        aria-label={t('modeLabel')}
        className="bg-muted/50 grid grid-cols-2 gap-1 rounded-xl p-1"
      >
        {([false, true] as const).map((value) => (
          <button
            key={String(value)}
            type="button"
            role="radio"
            aria-checked={find === value}
            disabled={!live || !today}
            onClick={() => choose(value)}
            className={cn(
              'min-h-11 rounded-lg px-2 text-sm font-medium transition-colors',
              find === value
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              PLAN_FOCUS
            )}
          >
            {value ? t('modeFind') : t('modeKnown')}
          </button>
        ))}
      </div>
      {find ? <PlanFind /> : <PlanDates defaultMonth={defaultMonth} />}
    </div>
  );
}

/**
 * The When mode's inputs: the period chips (the next twelve months, next year and its seasons, or
 * a range of the visitor's own), the trip length (3–21 days, 10 to start), and "only in our school
 * holidays" with a region in the holiday data's codes, the reader's own country first.
 */
export function PlanFind() {
  const t = useTranslations('orlandoPlanner.find');
  const { state, update, today, locale, live } = usePlanContext();
  const regionsId = useId();
  const periods = useMemo(() => (today ? whenPeriods(today, state.days) : []), [today, state.days]);
  // A range of the visitor's own can coincide with a chip's; "Custom" stays chosen once pressed.
  const [custom, setCustom] = useState(false);
  const chosen: WhenPeriodKey = custom ? 'custom' : whenPeriodOf(state.when, periods);
  const last = today ? addDays(today, MAX_DAYS_AHEAD) : undefined;
  const countries = useMemo(() => holidayRegionsFor(locale), [locale]);
  const countryName = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: 'region' });
    } catch {
      return null;
    }
  }, [locale]);
  const withinCountry = state.within
    ? countryOfRegion(state.within)
    : (countries[0]?.country ?? 'DE');

  const setRange = (range: PlanSearchRange) => update((s) => ({ ...s, when: range }));

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2" disabled={!live}>
        <legend className="mb-1 text-sm font-semibold">{t('period')}</legend>
        <div className="flex flex-wrap gap-2">
          {periods.map((period) => (
            <PeriodChip
              key={period.key}
              selected={chosen === period.key}
              onClick={() => {
                setCustom(false);
                setRange(period.range);
              }}
              label={t(`periods.${period.key}`, { year: period.year })}
            />
          ))}
          <PeriodChip
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
          disabled={!live}
          onChange={(on) =>
            update((s) => ({
              ...s,
              within: on
                ? (countries.find((c) => c.country === withinCountry)?.regions[0]?.code ?? null)
                : null,
            }))
          }
          label={t('holidays')}
          hint={t('holidaysHint')}
        />
        {state.within && (
          <div id={regionsId} className="grid grid-cols-2 gap-2 pl-9">
            <label className="flex flex-col gap-1 text-xs">
              {t('country')}
              <select
                value={withinCountry}
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
          </div>
        )}
      </div>
    </div>
  );
}

function PeriodChip({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'min-h-11 rounded-full border px-3.5 text-sm transition-colors lg:min-h-9',
        selected
          ? 'border-primary bg-primary/15 text-foreground font-semibold'
          : 'border-border/70 hover:bg-accent/60',
        PLAN_FOCUS
      )}
    >
      {label}
    </button>
  );
}
