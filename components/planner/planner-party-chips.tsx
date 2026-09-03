'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Droplets, Ruler, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RiderHeight } from '@/components/common/unit-display';
import { cn } from '@/lib/utils';
import { RIDER_HEIGHT_CHOICES, hasPartyPrefs } from '@/lib/planner/party';
import type { PlannerDayPrefs } from '@/lib/planner/types';

interface PlannerPartyChipsProps {
  prefs: PlannerDayPrefs | undefined;
  /** Merged into the day's answers — see `setDayPrefs`. */
  onChange: (patch: PlannerDayPrefs) => void;
}

/**
 * Who is coming, in the panel, changeable.
 *
 * The wizard asks these two questions once and the answers then decide what the
 * ride list flags for the rest of the day — so they cannot be write-only. A
 * stored preference a visitor can see the effects of but not change is worse
 * than one that was never asked for: the family arrives, grandma takes the
 * pushchair, and the 105 cm the wizard was told is now marking half the park
 * with a warning nobody can switch off.
 *
 * It reads as one chip when nothing is set, because that is the common state
 * and an empty control row in a 448 px panel is a control row that has to earn
 * its line.
 */
export function PlannerPartyChips({ prefs, onChange }: PlannerPartyChipsProps) {
  const t = useTranslations('planner');
  const [open, setOpen] = useState(false);
  const set = hasPartyPrefs(prefs);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-planner-party=""
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors',
            set
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'hover:bg-accent text-muted-foreground'
          )}
        >
          <Users className="size-3 shrink-0" aria-hidden="true" />
          {set ? (
            <span className="flex items-center gap-1.5">
              {prefs?.riderHeightCm !== undefined && (
                <span className="flex items-center gap-0.5">
                  <Ruler className="size-3 shrink-0" aria-hidden="true" />
                  <RiderHeight cm={prefs.riderHeightCm} />
                </span>
              )}
              {prefs?.avoidWet && <Droplets className="size-3 shrink-0" aria-hidden="true" />}
            </span>
          ) : (
            t('party.add')
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <p className="mb-1.5 text-xs font-medium">{t('wizard.kids.label')}</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ riderHeightCm: undefined })}
            aria-pressed={prefs?.riderHeightCm === undefined}
            className={cn(
              'rounded-full border px-2 py-1 text-[11px] transition-colors max-sm:min-h-9',
              prefs?.riderHeightCm === undefined
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-accent border-border'
            )}
          >
            {t('wizard.kids.none')}
          </button>
          {RIDER_HEIGHT_CHOICES.map((cm) => (
            <button
              key={cm}
              type="button"
              onClick={() => onChange({ riderHeightCm: cm })}
              aria-pressed={prefs?.riderHeightCm === cm}
              className={cn(
                'rounded-full border px-2 py-1 text-[11px] transition-colors max-sm:min-h-9',
                prefs?.riderHeightCm === cm
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-accent border-border'
              )}
            >
              <RiderHeight cm={cm} />
            </button>
          ))}
        </div>

        <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={prefs?.avoidWet === true}
            onChange={(event) => onChange({ avoidWet: event.target.checked })}
            className="accent-primary size-4 shrink-0"
          />
          <Droplets className="size-3.5 shrink-0" aria-hidden="true" />
          {t('wizard.wet.label')}
        </label>
      </PopoverContent>
    </Popover>
  );
}
