import { getTranslations } from 'next-intl/server';
import { ChevronDown } from 'lucide-react';
import { CROWD_TILE_CLASS, CROWD_TEXT_CLASS } from '@/lib/utils/crowd-level-styles';
import { UNUSABLE_HATCH_IMAGE } from '@/lib/utils/hatch';
import { cn } from '@/lib/utils';
import { EARLY_CLOSE_CORNER, HUB_CELL, HUB_CELL_BEST, NO_HOURS_DOT } from './hub-cell-styles';

/** The size a key's small cell is drawn at. */
const SWATCH = 'h-6 w-8 text-[11px]';

/** One key: one or more small cells drawn the way the calendar draws them, and their words. */
function Key({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      {children}
      <span>{label}</span>
    </li>
  );
}

/**
 * How to read the calendar, at the top of its chapter. In view: the number, the ring and the
 * hatching, and one line that says what the colour means (a day against the park's own normal day,
 * the crowd level and nothing else). Under „So liest du den Kalender“ the marks that are rarer: the
 * early close, no hours yet (a dot or an empty cell, one meaning) and last year's measured days.
 * What the figure is and how far the forecast reaches are the chapter's questions.
 */
export async function HubLegend() {
  const t = await getTranslations('tripHub.legend');
  const row = 'text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs';
  return (
    <div className="space-y-2">
      <ul className={row}>
        <Key label={t('minutes')}>
          <span className={cn(HUB_CELL, SWATCH, CROWD_TILE_CLASS.low, CROWD_TEXT_CLASS.low)}>
            40
          </span>
        </Key>
        <Key label={t('ring')}>
          <span
            className={cn(
              HUB_CELL,
              SWATCH,
              HUB_CELL_BEST,
              CROWD_TILE_CLASS.low,
              CROWD_TEXT_CLASS.low
            )}
          >
            35
          </span>
        </Key>
        <Key label={t('closed')}>
          <span
            className={cn(HUB_CELL, SWATCH, 'bg-muted/20')}
            style={{ backgroundImage: UNUSABLE_HATCH_IMAGE }}
          />
        </Key>
        <Key label={t('colour')}>
          <span aria-hidden className={cn(HUB_CELL, 'h-6 w-4', CROWD_TILE_CLASS.low)} />
          <span aria-hidden className={cn(HUB_CELL, 'h-6 w-4', CROWD_TILE_CLASS.high)} />
        </Key>
      </ul>
      <details className="group">
        <summary className="text-primary-ink flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-sm font-medium sm:min-h-0">
          {t('howTo')}
          <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <ul className={cn(row, 'mt-2')}>
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
          <Key label={t('noHours')}>
            <span
              className={cn(
                HUB_CELL,
                SWATCH,
                'relative',
                CROWD_TILE_CLASS.low,
                CROWD_TEXT_CLASS.low
              )}
            >
              45
              <span aria-hidden className={NO_HOURS_DOT} />
            </span>
            <span className={cn(HUB_CELL, SWATCH, 'bg-muted/20')} />
          </Key>
        </ul>
      </details>
    </div>
  );
}
