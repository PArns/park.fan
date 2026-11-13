import { getTranslations } from 'next-intl/server';
import { ChevronDown } from 'lucide-react';
import { CROWD_TILE_CLASS, CROWD_TEXT_CLASS } from '@/lib/utils/crowd-level-styles';
import { UNUSABLE_HATCH_IMAGE } from '@/lib/utils/hatch';
import { cn } from '@/lib/utils';
import { formatHubDate } from '@/lib/orlando/hub-data';
import {
  EARLY_CLOSE_CORNER,
  HUB_CELL,
  HUB_CELL_BEST,
  HUB_CELL_LAST_YEAR,
  NO_HOURS_DOT,
} from './hub-cell-styles';

/** One key of the one-line legend: a small cell drawn the way the matrix draws it, and its word. */
function Key({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      {swatch}
      <span>{label}</span>
    </li>
  );
}

/**
 * How to read a square, at the two depths the hub promises: a one-line key that names every mark
 * the matrix draws, and under "How to read this" the paragraphs on what the minutes and the colour
 * mean and how far the forecast reaches. The paragraphs sit in a `<details>`, so they are in the
 * served HTML whether or not anybody opens them.
 */
export async function HubLegend({
  forecastUntil,
  locale,
}: {
  /** The last day the forecast covers, when the API has said. */
  forecastUntil?: string;
  locale: string;
}) {
  const t = await getTranslations('orlando.legend');
  const swatch = 'h-6 w-8 text-[11px]';
  return (
    <div className="space-y-3">
      <ul className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <Key
          swatch={
            <span className={cn(HUB_CELL, swatch, CROWD_TILE_CLASS.low, CROWD_TEXT_CLASS.low)}>
              40
            </span>
          }
          label={t('minutes')}
        />
        <Key
          swatch={
            <span
              className={cn(
                HUB_CELL,
                swatch,
                HUB_CELL_BEST,
                CROWD_TILE_CLASS.low,
                CROWD_TEXT_CLASS.low
              )}
            >
              35
            </span>
          }
          label={t('ring')}
        />
        <Key
          swatch={
            <span
              className={cn(
                HUB_CELL,
                swatch,
                'relative',
                CROWD_TILE_CLASS.very_low,
                CROWD_TEXT_CLASS.very_low
              )}
            >
              30
              <span aria-hidden className={EARLY_CLOSE_CORNER} />
            </span>
          }
          label={t('early')}
        />
        <Key
          swatch={
            <span
              className={cn(HUB_CELL, swatch, 'bg-muted/20')}
              style={{ backgroundImage: UNUSABLE_HATCH_IMAGE }}
            />
          }
          label={t('closed')}
        />
        <Key
          swatch={
            <span
              className={cn(
                HUB_CELL,
                swatch,
                'relative',
                CROWD_TILE_CLASS.low,
                CROWD_TEXT_CLASS.low
              )}
            >
              45
              <span aria-hidden className={NO_HOURS_DOT} />
            </span>
          }
          label={t('noHours')}
        />
        <Key
          swatch={<span className={cn(HUB_CELL, swatch, 'bg-muted/20')} />}
          label={t('unknown')}
        />
        <Key
          swatch={
            <span
              className={cn(
                HUB_CELL,
                swatch,
                HUB_CELL_LAST_YEAR,
                CROWD_TILE_CLASS.moderate,
                CROWD_TEXT_CLASS.moderate
              )}
            >
              45
            </span>
          }
          label={t('lastYear')}
        />
      </ul>
      <details className="group max-w-3xl">
        <summary className="text-primary-ink flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-sm font-medium sm:min-h-0">
          {t('howTo')}
          <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="text-muted-foreground mt-2 space-y-3 text-sm leading-relaxed">
          <p>{t('minutesLong')}</p>
          <p>{t('colourLong')}</p>
          <p>
            {forecastUntil
              ? t('horizonLong', { date: formatHubDate(forecastUntil, locale, 'long') })
              : t('horizonLongNoDate')}
          </p>
          <p>{t('statesLong')}</p>
        </div>
      </details>
    </div>
  );
}
