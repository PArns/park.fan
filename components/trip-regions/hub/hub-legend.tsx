import { getTranslations } from 'next-intl/server';
import { Check, Star } from 'lucide-react';
import { CROWD_TILE_CLASS, CROWD_TEXT_CLASS } from '@/lib/utils/crowd-level-styles';
import { cn } from '@/lib/utils';
import { WeatherKey } from '@/components/common/day-weather';
import { DaySignalKey } from '@/components/parks/day-signal-key';
import { DAY_SIGNAL_CLASS } from '@/lib/utils/day-signal-styles';
import { PICK_BADGE } from '@/components/parks/calendar-tile-marks';
import { EARLY_CLOSE_CORNER, HUB_CELL, HUB_CELL_BEST, HUB_CELL_PICKED } from './hub-cell-styles';

/** The size a key's small tile is drawn at. */
const SWATCH = 'h-6 w-8 text-[11px]';

/** A small tile with a mark before its figure and a ring inside its edge: room for all three. */
const MARK_SWATCH = 'h-6 gap-1 px-2 text-[11px]';

/** One key: one or more small tiles drawn the way the calendar draws them, and their words. */
function Key({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      {children}
      <span>{label}</span>
    </li>
  );
}

/**
 * How to read the calendar, at the top of its chapter, every key in one list: the wait, the ring
 * with the star (each park's quietest day of the week), the ring with the tick (a day the visitor
 * picked), what the colour means (a day against the park's own normal day, the crowd level and
 * nothing else), the signal bar's school break and public holiday as the park calendar keys them
 * (the storm season is keyed beside the grid, where a region has one), the early close's folded
 * corner and the weather's two tokens (`WeatherKey`). The early close sat alone behind a
 * disclosure, a click for one key. A tile says closed, the level and „Zeiten folgen“ in words, so
 * none of them needs a key.
 */
export async function HubLegend() {
  const t = await getTranslations('tripHub.legend');
  const tSignals = await getTranslations('attractions.historyLegend');
  const row = 'text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs';
  return (
    <div className="space-y-2">
      <ul className={row}>
        <Key label={t('minutes')}>
          <span className={cn(HUB_CELL, SWATCH, CROWD_TILE_CLASS.low, CROWD_TEXT_CLASS.low)}>
            40
          </span>
        </Key>
        <Key label={t('quietest')}>
          <span
            className={cn(
              HUB_CELL,
              MARK_SWATCH,
              HUB_CELL_BEST,
              CROWD_TILE_CLASS.low,
              CROWD_TEXT_CLASS.low
            )}
          >
            <Star aria-hidden className="text-primary size-3 fill-current" />
            35
          </span>
        </Key>
        <Key label={t('picked')}>
          <span
            className={cn(
              HUB_CELL,
              MARK_SWATCH,
              HUB_CELL_PICKED,
              CROWD_TILE_CLASS.low,
              CROWD_TEXT_CLASS.low
            )}
          >
            <span
              aria-hidden
              className={cn(PICK_BADGE, 'flex size-3.5 items-center justify-center rounded-full')}
            >
              <Check className="size-2.5" strokeWidth={3.5} />
            </span>
            45
          </span>
        </Key>
        <Key label={t('colour')}>
          <span aria-hidden className={cn(HUB_CELL, 'h-6 w-4', CROWD_TILE_CLASS.low)} />
          <span aria-hidden className={cn(HUB_CELL, 'h-6 w-4', CROWD_TILE_CLASS.high)} />
        </Key>
        <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <DaySignalKey className={DAY_SIGNAL_CLASS.school} label={tSignals('schoolVacation')} />
          <DaySignalKey className={DAY_SIGNAL_CLASS.holiday} label={tSignals('holiday')} />
        </li>
        <Key label={t('early')}>
          <span
            className={cn(
              HUB_CELL,
              SWATCH,
              'relative',
              CROWD_TILE_CLASS.very_low,
              CROWD_TEXT_CLASS.very_low
            )}
          >
            30
            <span aria-hidden className={EARLY_CLOSE_CORNER} />
          </span>
        </Key>
        <li>
          <WeatherKey />
        </li>
      </ul>
    </div>
  );
}
