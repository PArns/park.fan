'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  chooseHotel,
  effectiveHotel,
  MAX_REST_STREAK,
  type TripPlanState,
  type PlanHotel,
  type PlanRest,
} from '@/lib/trip-regions/plan';
import { hopperTicketResorts, ticketsCoverBothResorts } from '@/lib/trip-regions/plan-tickets';
import { usePlanContext } from './plan-context';
import { PlanCheckRow, PlanRadioGroup, PlanStepper } from './plan-controls';

/** The streak `rest=max:n` holds, and the one the stepper offers first. */
const restStreak = (rest: PlanRest): number | null =>
  rest.startsWith('max:') ? Number(rest.slice(4)) : null;
const DEFAULT_STREAK = 3;

/**
 * The options' one-line summary ("Disney hotel · resorts together · rest days on busy days"), the
 * defaults included, so the line under "Fine-tune" says what the plan assumes without opening it.
 */
export function usePlanOptionsSummary(state: TripPlanState): string {
  const t = useTranslations('tripPlanner.options');
  const tRegion = useTranslations('tripRegion.planner.options');
  const { region, config, hotels, tickets: catalog } = usePlanContext();
  const area = region.hotelAreas.find((a) => a.key === state.area);
  const hotelShort = `hotelShort.${effectiveHotel(state, hotels)}`;
  const mixable = ticketsCoverBothResorts(config.blockResorts, state.tickets, catalog);
  const streak = restStreak(state.rest);
  return [
    tRegion.has(hotelShort) ? tRegion(hotelShort) : null,
    area ? t('fromArea', { area: area.name }) : null,
    !config.blockResorts
      ? null
      : state.blocks === false
        ? t('blocksOff')
        : state.blocks === null && mixable
          ? null
          : t('blocksOn'),
    state.rest === 'none'
      ? t('restNone')
      : streak !== null
        ? t('restMaxShort', { n: streak })
        : t('restAuto'),
    config.fireworks && state.fireworks === 'want' ? tRegion('fireworksWantShort') : null,
    state.hop ? t('hopOn') : null,
    state.evenings ? null : t('eveningsOff'),
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Fine-tune: everything the plan can be told beyond tickets, dates and parks, each with the default
 * the API plans with already chosen, so nothing here is required. Where you sleep (the region's
 * `hotels`: Universal Premier includes Express at Universal Studios and Islands of Adventure),
 * where the drive times start, the fireworks question and resort blocks where the region asks
 * them, rest days and park hopping, which only a hopper makes count (owned, or plan first's).
 */
export function PlanOptions({ className }: { className?: string }) {
  const t = useTranslations('tripPlanner.options');
  const tRegion = useTranslations('tripRegion.planner.options');
  const {
    region,
    config,
    hotels,
    state,
    update,
    areaKeys,
    live,
    tickets: catalog,
  } = usePlanContext();
  const streak = restStreak(state.rest);
  const hopper =
    state.ticket === 'hopper' ||
    state.hopper.length > 0 ||
    hopperTicketResorts(state.tickets, catalog).length > 0;
  // Two owned windows decide where Disney and Universal days go; the API mixes them only where it
  // pays, unless told to keep them together or to mix.
  const mixable = ticketsCoverBothResorts(config.blockResorts, state.tickets, catalog);

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <PlanRadioGroup<PlanHotel>
        legend={t('hotel')}
        value={effectiveHotel(state, hotels)}
        disabled={!live}
        onChange={(hotel) => update((s) => chooseHotel(s, hotel, areaKeys, hotels))}
        // A kind this client has no words for yet (a new region's) is not offered.
        options={hotels
          .filter(({ key }) => tRegion.has(`hotelLabel.${key}`))
          .map(({ key }) => ({
            value: key,
            label: tRegion(`hotelLabel.${key}`),
            ...(tRegion.has(`hotelHint.${key}`) && { hint: tRegion(`hotelHint.${key}`) }),
          }))}
      />

      <PlanRadioGroup<string>
        legend={t('area')}
        value={state.area ?? ''}
        disabled={!live}
        onChange={(area) => update((s) => ({ ...s, area: area || null }))}
        options={[
          ...region.hotelAreas.map((a) => ({ value: a.key, label: a.name })),
          { value: '', label: t('areaNone'), hint: t('areaNoneHint') },
        ]}
      />

      {config.fireworks && (
        <PlanRadioGroup<TripPlanState['fireworks']>
          legend={tRegion('fireworks')}
          value={state.fireworks}
          disabled={!live}
          onChange={(fireworks) => update((s) => ({ ...s, fireworks }))}
          options={[
            { value: 'want', label: t('fireworksWant'), hint: tRegion('fireworksWantHint') },
            { value: 'any', label: t('fireworksAny'), hint: tRegion('fireworksAnyHint') },
          ]}
        />
      )}

      {mixable && (
        <PlanRadioGroup<'auto' | 'on' | 'off'>
          legend={tRegion('blocksTickets')}
          value={state.blocks === null ? 'auto' : state.blocks ? 'on' : 'off'}
          disabled={!live}
          onChange={(mode) =>
            update((s) => ({ ...s, blocks: mode === 'auto' ? null : mode === 'on' }))
          }
          options={[
            { value: 'auto', label: t('blocksAuto'), hint: t('blocksAutoHint') },
            { value: 'on', label: t('blocksAlways') },
            { value: 'off', label: t('blocksFree') },
          ]}
        />
      )}

      <div className="flex flex-col">
        {!mixable && config.blockResorts && (
          <PlanCheckRow
            checked={state.blocks !== false}
            disabled={!live}
            onChange={(blocks) => update((s) => ({ ...s, blocks: blocks ? null : false }))}
            label={tRegion('blocks')}
            hint={t('blocksHint')}
          />
        )}
        {hopper && (
          <PlanCheckRow
            checked={state.hop}
            disabled={!live}
            onChange={(hop) => update((s) => ({ ...s, hop }))}
            label={t('hop')}
            hint={t('hopHint')}
          />
        )}
        <PlanCheckRow
          checked={state.evenings}
          disabled={!live}
          onChange={(evenings) => update((s) => ({ ...s, evenings }))}
          label={t('evenings')}
          hint={tRegion('eveningsHint')}
        />
      </div>

      <div className="flex flex-col gap-1">
        <PlanRadioGroup<'auto' | 'none' | 'max'>
          legend={t('rest')}
          value={streak !== null ? 'max' : (state.rest as 'auto' | 'none')}
          disabled={!live}
          onChange={(mode) =>
            update((s) => ({
              ...s,
              rest: mode === 'max' ? (`max:${streak ?? DEFAULT_STREAK}` as PlanRest) : mode,
            }))
          }
          options={[
            { value: 'auto', label: t('restAutoLabel'), hint: t('restAutoHint') },
            { value: 'max', label: t('restMaxLabel') },
            { value: 'none', label: t('restNoneLabel') },
          ]}
        />
        {streak !== null && (
          <div className="flex items-center justify-between gap-3 pl-9">
            <span className="text-sm">{t('restMax', { n: streak })}</span>
            <PlanStepper
              value={streak}
              disabled={!live}
              canDecrement={streak > 1}
              canIncrement={streak < MAX_REST_STREAK}
              onDecrement={() => update((s) => ({ ...s, rest: `max:${streak - 1}` as PlanRest }))}
              onIncrement={() => update((s) => ({ ...s, rest: `max:${streak + 1}` as PlanRest }))}
              decrementLabel={t('restFewer')}
              incrementLabel={t('restMore')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
