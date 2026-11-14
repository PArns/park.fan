'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { BedDouble, Castle, Globe, House, type LucideIcon } from 'lucide-react';
import { chooseHotel, effectiveHotel, effectiveParks } from '@/lib/trip-regions/plan';
import { WizardOptionCard, WizardOptionGroup } from '@/components/planner/wizard-option-card';
import { usePlanContext } from '../../planner/plan-context';
import { useAreaName } from '../../planner/plan-place-words';
import type { WizardStepProps } from '../wizard-step';
import { AreaPicker } from './area-picker';

/** A hotel kind's icon by the resort its key names: a castle for Disney, a globe for Universal. */
function hotelIcon(key: string): LucideIcon {
  if (key === 'offsite') return House;
  if (key.startsWith('universal')) return Globe;
  if (key.startsWith('disney')) return Castle;
  return BedDouble;
}

/**
 * Hotel, in a region that sleeps in one place (Orlando, California): the hotel kinds as cards with
 * the line each already has (`hotelHint`), then the area with its ways and the map (`AreaPicker`).
 * Choosing a hotel chooses its area where none is set yet (`chooseHotel`), and the area's lead says
 * so.
 */
export function HotelStep({ questions, merged, askId }: WizardStepProps) {
  const t = useTranslations('tripPlanner.wizard.hotel');
  const tOptions = useTranslations('tripPlanner.options');
  const tRegion = useTranslations('tripRegion.planner.options');
  const { region, hotels, state, update, areaKeys, headliners } = usePlanContext();
  const areaName = useAreaName();
  const areaId = useId();
  const hotel = effectiveHotel(state, hotels);
  const kinds = hotels.filter(({ key }) => tRegion.has(`hotelLabel.${key}`));
  const ofHotel = hotels.find((kind) => kind.key === hotel)?.area;
  const parks = effectiveParks(state, headliners).map((p) => p.slug);

  return (
    <div className="flex flex-col gap-5" data-wizard-hotel="">
      {questions.includes('hotel') && (
        <div className="flex flex-col gap-3">
          {!merged && <p className="text-muted-foreground text-sm">{t('lead')}</p>}
          <WizardOptionGroup labelledBy={askId} className="grid-cols-2">
            {kinds.map(({ key }) => (
              <WizardOptionCard
                key={key}
                size="tile"
                icon={hotelIcon(key)}
                checked={hotel === key}
                onSelect={() => update((s) => chooseHotel(s, key, areaKeys, hotels))}
                title={tRegion(`hotelLabel.${key}`)}
                hint={tRegion.has(`hotelHint.${key}`) ? tRegion(`hotelHint.${key}`) : undefined}
                data-wizard-hotel-kind={key}
              />
            ))}
          </WizardOptionGroup>
        </div>
      )}

      {questions.includes('area') && (
        <section className="flex flex-col gap-2.5">
          <h3 id={areaId} className="text-base font-semibold">
            {t('area')}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t('areaLead')}
            {ofHotel &&
              ofHotel === state.area &&
              ` ${t('areaOfHotel', { area: areaName(ofHotel) })}`}
          </p>
          <AreaPicker
            areas={region.hotelAreas.map((a) => a.key)}
            parks={parks}
            value={state.area}
            onChoose={(area) => update((s) => ({ ...s, area }))}
            labelledBy={areaId}
            openHint={tOptions('areaNoneHint')}
          />
        </section>
      )}
    </div>
  );
}
