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
 * Who is coming, in the panel, changeable: the wizard's answers decide what the ride list flags all
 * day, so they cannot be write-only. One chip when nothing is set, the common state.
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
            // A 44 px target from a pseudo-element rather than `min-h-11`: growing the chip would
            // grow the context band's reserved box and take axis. The extension reaches down into
            // the band's prose row, which carries no target, and no ancestor clips it.
            'planner-phone:relative planner-phone:after:absolute planner-phone:after:inset-x-0 planner-phone:after:top-0 planner-phone:after:h-11 planner-phone:after:content-[""]',
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
      {/* `z-[80]` above the sheet's `z-[70]`, set here because every other popover on the site is
          right at 50. */}
      <PopoverContent align="start" className="z-[80] w-64 p-3">
        <p className="mb-1.5 text-xs font-medium">{t('wizard.kids.label')}</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ riderHeightCm: undefined })}
            aria-pressed={prefs?.riderHeightCm === undefined}
            className={cn(
              'planner-phone:min-h-11 rounded-full border px-2 py-1 text-[11px] transition-colors',
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
                'planner-phone:min-h-11 rounded-full border px-2 py-1 text-[11px] transition-colors',
                prefs?.riderHeightCm === cm
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-accent border-border'
              )}
            >
              <RiderHeight cm={cm} />
            </button>
          ))}
        </div>

        {/* The label carries the target, since a `<label>` is the checkbox's hit area. */}
        <label className="planner-phone:min-h-11 mt-3 flex cursor-pointer items-center gap-2 text-xs">
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
