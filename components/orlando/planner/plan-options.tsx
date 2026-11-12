'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  chooseHotel,
  effectiveHotel,
  MAX_REST_STREAK,
  PLAN_HOTELS,
  type OrlandoPlanState,
  type PlanHotel,
  type PlanRest,
} from '@/lib/orlando/plan';
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
export function usePlanOptionsSummary(state: OrlandoPlanState): string {
  const t = useTranslations('orlandoPlanner.options');
  const { region } = usePlanContext();
  const area = region.hotelAreas.find((a) => a.key === state.area);
  const streak = restStreak(state.rest);
  return [
    t(`hotelShort.${effectiveHotel(state)}`),
    area ? t('fromArea', { area: area.name }) : null,
    state.blocks ? t('blocksOn') : t('blocksOff'),
    state.rest === 'none'
      ? t('restNone')
      : streak !== null
        ? t('restMaxShort', { n: streak })
        : t('restAuto'),
    state.fireworks === 'want' ? t('fireworksWantShort') : null,
    state.hop ? t('hopOn') : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Fine-tune: everything the plan can be told beyond dates and parks, each with the default the API
 * plans with already chosen, so nothing here is required. Where you sleep (Universal Premier
 * includes Express at Universal Studios and Islands of Adventure), where the drive times start,
 * the fireworks question, resort blocks, rest days and park hopping.
 */
export function PlanOptions({ className }: { className?: string }) {
  const t = useTranslations('orlandoPlanner.options');
  const { region, state, update, areaKeys, live } = usePlanContext();
  const streak = restStreak(state.rest);

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <PlanRadioGroup<PlanHotel>
        legend={t('hotel')}
        value={effectiveHotel(state)}
        disabled={!live}
        onChange={(hotel) => update((s) => chooseHotel(s, hotel, areaKeys))}
        options={PLAN_HOTELS.map((hotel) => ({
          value: hotel,
          label: t(`hotelLabel.${hotel}`),
          hint: t(`hotelHint.${hotel}`),
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

      <PlanRadioGroup<OrlandoPlanState['fireworks']>
        legend={t('fireworks')}
        value={state.fireworks}
        disabled={!live}
        onChange={(fireworks) => update((s) => ({ ...s, fireworks }))}
        options={[
          { value: 'want', label: t('fireworksWant'), hint: t('fireworksWantHint') },
          { value: 'any', label: t('fireworksAny'), hint: t('fireworksAnyHint') },
        ]}
      />

      <div className="flex flex-col">
        <PlanCheckRow
          checked={state.blocks}
          disabled={!live}
          onChange={(blocks) => update((s) => ({ ...s, blocks }))}
          label={t('blocks')}
          hint={t('blocksHint')}
        />
        <PlanCheckRow
          checked={state.hop}
          disabled={!live}
          onChange={(hop) => update((s) => ({ ...s, hop }))}
          label={t('hop')}
          hint={t('hopHint')}
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
