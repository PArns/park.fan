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
            // 23 px measured, and it is the button that opens the very chips
            // this file already raised to 44 — the destination was thumb-sized
            // and the door was not.
            //
            // A pseudo-element rather than `min-h-11`, which is the one place
            // in this change where the two differ. This chip rides in
            // `PlannerContextBand`'s wrapping badge row, inside a reserved
            // `min-h-[60px]` box: growing the control grows that row, the box
            // goes 60 → 76 px and the axis pays 16 — for a control that would
            // then be a 44 px pill standing among 20 px badges. The extension
            // reaches DOWN into the band's own prose row and bottom padding
            // (26 px of it below this row), which carry text and no target, so
            // nothing loses a hit area and the band keeps its height. Same
            // trick and same reason as the block grip and the sheet handle;
            // unlike the grip, no ancestor here clips it — checked.
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
      {/* ABOVE the panel. Both this and `SheetContent` are portalled to
          `<body>`, and the shared popover is `z-50` against the sheet's
          `z-[70]` — so inside the planner this opened BEHIND the panel that
          triggered it, which from the outside is a button that does nothing.
          Fixed at the call site rather than in `components/ui/popover.tsx`:
          every other popover on the site is correct at 50, and raising the
          primitive would put a park page's popover over the header. */}
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

        {/* The label carries the target, not the 16 px box inside it — a
            `<label>` is the checkbox's hit area, which is why the row and not
            the input gets the height. Etappe 4 raised the height chips above
            and left this one at 20 px, in the same popover. */}
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
