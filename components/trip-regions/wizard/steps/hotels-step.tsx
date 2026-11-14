'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { BedDouble, Luggage } from 'lucide-react';
import { getListFormat } from '@/lib/utils/intl-format';
import { effectiveParks, setBaseArea, setMoveBuffer } from '@/lib/trip-regions/plan';
import { DEFAULT_MOVE_BUFFERS } from '@/lib/trip-regions/plan-query';
import { planStays } from '@/lib/trip-regions/plan-stays';
import { regionOrShared } from '@/lib/trip-regions/region-words';
import { homeBases } from '@/lib/trip-regions/wizard-choices';
import type { TripBase } from '@/lib/trip-regions/types';
import { usePlanContext } from '../../planner/plan-context';
import { PlanSegmented } from '../../planner/plan-controls';
import { useAreaName, useBaseName } from '../../planner/plan-place-words';
import { useStatePlan } from '../../planner/use-trip-plan';
import { useWizardAsk, type WizardStepProps } from '../wizard-step';
import { AreaPicker } from './area-picker';

/**
 * Hotels per city, in a region that sleeps in several (Japan, Paris): for each city the trip stays
 * in, its `stayNote` and its areas (`AreaPicker`), and the time a hotel change takes on top of the
 * ride where the trip changes hotels; until the plan answers, the cities are those nearest the
 * trip's parks (`homeBases`). Parky names the cities ("Where are you staying in Tokyo and
 * Osaka?"), unless the step is drawn inside the Route of a short trip.
 */
export function HotelsStep({ questions, merged }: WizardStepProps) {
  const t = useTranslations('tripPlanner.wizard.hotels');
  const { region, state, locale, headliners } = usePlanContext();
  const plan = useStatePlan().data;
  const baseName = useBaseName();
  const stays = plan
    ? planStays(plan).map((s) => s.base)
    : homeBases(
        region.bases ?? [],
        effectiveParks(state, headliners).map((p) => p.slug)
      );
  const cities = (region.bases ?? []).filter(
    (b) =>
      b.hotelAreas.length > 0 &&
      (stays.includes(b.key) || state.bases.some((p) => p.key === b.key && p.nights !== 0))
  );
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });
  useWizardAsk(
    !merged && cities.length > 0
      ? t('ask', { cities: list.format(cities.map((b) => baseName(b.key))) })
      : null
  );
  const moves = plan ? (plan.totals.moves ?? 0) > 0 : true;

  return (
    <div className="flex flex-col gap-6" data-wizard-hotels="">
      {questions.includes('city_areas') &&
        cities.map((base) => <CityAreas key={base.key} base={base} />)}
      {questions.includes('move_buffer') && moves && <MoveBuffer />}
    </div>
  );
}

/** Where to sleep in one city: its note, its areas with their ways to the trip's parks there. */
function CityAreas({ base }: { base: TripBase }) {
  const t = useTranslations('tripPlanner.wizard.hotels');
  const tRegion = useTranslations('tripRegion.planner');
  const { region, state, update, headliners } = usePlanContext();
  const baseName = useBaseName();
  const areaName = useAreaName();
  const headingId = useId();
  const order = (region.bases ?? []).map((b) => b.key);
  const pick = state.bases.find((p) => p.key === base.key);
  const reach = new Set(base.parks.map((p) => p.slug));
  const parks = effectiveParks(state, headliners)
    .map((p) => p.slug)
    .filter((slug) => reach.has(slug));
  const note = tRegion.has(`stayNote.${base.key}`) ? tRegion(`stayNote.${base.key}`) : null;
  const fallback = base.defaultArea ?? base.hotelAreas[0];
  return (
    <section className="flex flex-col gap-2.5" data-wizard-city-areas={base.key}>
      <h3 id={headingId} className="flex items-center gap-2 text-base font-semibold">
        <BedDouble className="text-muted-foreground size-4" aria-hidden="true" />
        {t('in', { city: baseName(base.key) })}
      </h3>
      {note && <p className="text-muted-foreground text-sm">{note}</p>}
      <AreaPicker
        areas={base.hotelAreas}
        parks={parks}
        value={pick?.area ?? null}
        onChoose={(area) => update((s) => setBaseArea(s, base.key, area, order))}
        labelledBy={headingId}
        openHint={fallback ? t('openHint', { area: areaName(fallback) }) : null}
      />
    </section>
  );
}

/** The minutes a hotel change takes on top of the ride, from the region's choices. */
function MoveBuffer() {
  const t = useTranslations('tripPlanner.wizard.hotels');
  const tOptions = useTranslations('tripPlanner.options');
  const tPlanner = useTranslations('tripPlanner');
  const tRegion = useTranslations('tripRegion.planner');
  const { region, state, update } = usePlanContext();
  const headingId = useId();
  const rules = region.stayRules;
  const buffers = rules?.moveBufferOptions ?? DEFAULT_MOVE_BUFFERS;
  const regionDefault = rules?.moveOverheadMinutes ?? buffers[1] ?? buffers[0];
  return (
    <section className="flex flex-col gap-2.5" aria-labelledby={headingId}>
      <h3 id={headingId} className="flex items-center gap-2 text-base font-semibold">
        <Luggage className="text-muted-foreground size-4" aria-hidden="true" />
        {t('moveBuffer')}
      </h3>
      <PlanSegmented<string>
        label={t('moveBuffer')}
        value={String(state.moveBuffer ?? regionDefault)}
        onChange={(minutes) => update((s) => setMoveBuffer(s, Number(minutes), regionDefault))}
        options={buffers.map((minutes) => ({
          value: String(minutes),
          label: tOptions('moveBufferMinutes', { minutes }),
        }))}
      />
      <p className="text-muted-foreground text-xs leading-relaxed">
        {regionOrShared(tRegion, tPlanner, 'options.moveBufferHint')}
      </p>
    </section>
  );
}
