'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { CROWD_LEVEL_ORDER, CROWD_SCALE_CLASS } from '@/lib/utils/crowd-level-styles';

/** One meaning of the bar across a cell's top edge: the colour, then the word. */
function SignalKey({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={cn('h-[3px] w-4 shrink-0 rounded-full', className)} aria-hidden="true" />
      <span className="text-[11px]">{label}</span>
    </span>
  );
}

/**
 * What the colours in the month grid mean — the crowd scale, then the signal bar.
 *
 * The scale is ONE strip of butted chips rather than six separate pills, because it is a scale:
 * the reader is meant to see „Niedrig" and „Extrem" as two ends of the same ruler, and six
 * free-floating chips with gaps between them read as six unrelated categories. The signal keys
 * beside it are the opposite — four independent facts — so they keep their gaps.
 *
 * All six tiers are named here even though a given month rarely shows more than four of them. The
 * API sends six, so a reader who meets `very_low` on one park's quiet Tuesday has somewhere to
 * look it up; a legend that lists five and a grid that draws six is how a colour ends up meaning
 * nothing.
 *
 * It used to live INSIDE `ParkCalendarGrid`, which is a `ssr: false` import — so a legend that
 * needs no data, no clock and no viewport was withheld until a JavaScript chunk arrived, and it
 * made the grid's two loading states structurally different: `next/dynamic` drew a bare
 * placeholder, then the mounted-but-fetching grid drew this row PLUS a placeholder. Up in the
 * panel's control row it is server-rendered in the first byte, and the two loading states become
 * the same box by construction.
 */
export function ParkCalendarLegend({ className }: { className?: string }) {
  const t = useTranslations('parks');
  const tLegend = useTranslations('attractions.historyLegend');

  return (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-2', className)}>
      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
        <span className="text-muted-foreground shrink-0 text-[10px] font-medium tracking-widest uppercase">
          {t('calendarLegendGroups.crowd')}
        </span>

        {/* Below `sm` the six names do not fit: „Sehr niedrig" alone wants 60 px and the strip
          measured 400 px inside a 358 px card, which pushed the whole legend row — signal keys
          included — past the card's right edge and gave the document a horizontal scrollbar. So
          the phone gets the ramp itself with only its two ends named; every tile in the grid
          below spells its own tier out in full anyway. */}
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:hidden">
          <div className="flex h-2.5 overflow-hidden rounded-md" aria-hidden="true">
            {CROWD_LEVEL_ORDER.map((level) => (
              <span key={level} className={cn('flex-1', CROWD_SCALE_CLASS[level])} />
            ))}
          </div>
          <div className="text-muted-foreground flex justify-between text-[9px] font-medium tracking-wide uppercase">
            <span>{t('crowdLevels.very_low')}</span>
            <span>{t('crowdLevels.extreme')}</span>
          </div>
        </div>

        <div className="hidden min-w-0 overflow-hidden rounded-md sm:flex">
          {CROWD_LEVEL_ORDER.map((level) => (
            <span
              key={level}
              className={cn(
                'truncate px-2.5 py-1 text-[10.5px] font-bold tracking-wide uppercase',
                CROWD_SCALE_CLASS[level]
              )}
            >
              {t(`crowdLevels.${level}`)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
          {t('calendarLegendGroups.signals')}
        </span>
        <SignalKey
          className="bg-yellow-500 dark:bg-yellow-400"
          label={tLegend('schoolVacation')}
        />
        <SignalKey
          className="bg-amber-600 dark:bg-amber-500"
          label={t('influencingHolidays')}
        />
        <SignalKey className="bg-red-500 dark:bg-red-400" label={tLegend('holiday')} />
        <SignalKey className="bg-blue-500 dark:bg-blue-400" label={tLegend('bridgeDay')} />
      </div>
    </div>
  );
}
