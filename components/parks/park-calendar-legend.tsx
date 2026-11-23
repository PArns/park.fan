'use client';

import { WeatherKey } from '@/components/common/day-weather';
import type { CSSProperties, ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import { TILE_BEST_RING } from '@/components/parks/calendar-tile-marks';
import {
  CROWD_LEVEL_ORDER,
  CROWD_SCALE_CLASS,
  CROWD_TEXT_CLASS,
  CROWD_TILE_CLASS,
} from '@/lib/utils/crowd-level-styles';
import { DAY_SIGNAL_CLASS, type DaySignal } from '@/lib/utils/day-signal-styles';
import { DaySignalKey } from '@/components/parks/day-signal-key';
import { WORKS_TONE_CLASS, WorksIcon } from '@/components/parks/works-period-list';
import { SeasonKindIcon } from '@/components/parks/season-kind-icon';
import type { SeasonEventKind } from '@/lib/parks/park-season-days';

/** Every signal a park's month grid can draw, in the cell's order. */
const ALL_SIGNALS: readonly DaySignal[] = ['school', 'neighbor', 'holiday', 'bridge'];

/**
 * One more key of {@link ParkCalendarLegend}: a segment of the signal bar by its class (and
 * `style`), or any other mark the view draws, then its word.
 */
export interface CalendarLegendKey {
  key: string;
  label: string;
  className?: string;
  style?: CSSProperties;
  /** Drawn instead of the bar segment, hidden from a screen reader like the segment. */
  mark?: ReactNode;
}

/**
 * What the colours in the month grid mean: the crowd scale, then the signal bar. The scale is drawn
 * as the tiles draw a tier (on a phone one ramp with its ends named); the signal keys are independent facts and keep
 * their gaps. All six tiers are named even when a month shows four, so any colour the API sends can
 * be looked up; `showCrowd` drops the scale where the view shows no crowd colour at all. The works
 * icon is keyed only for a park that has a curated window, since on every other park the grid never
 * draws it; `signals` names the bar's segments a grid can draw, so the trip planner's grids, which
 * know no bridge days, key only theirs. `extraSignals` keys what a caller draws beyond the holidays,
 * such as a region's storm season or the Week view's blocks, after them in the same row.
 * `seasonKinds` keys the season icons the shown month draws, and only those: a month without a
 * season has no season key. `showClimateKey` keys the weather's two tokens (`WeatherKey`): past the
 * forecast's reach a tile shows the date's average over past years, never a forecast. `showBestKey`
 * keys the star with its ring, each week's quietest day, drawn as a tile draws it; `showLocalTimes`
 * says once that the hours are the park's.
 */
export function ParkCalendarLegend({
  showCrowd = true,
  showWorks = false,
  signals = ALL_SIGNALS,
  signalsLabel = true,
  extraSignals = [],
  seasonKinds = [],
  showClimateKey = false,
  showBestKey = false,
  showLocalTimes = false,
  className,
}: {
  showCrowd?: boolean;
  showWorks?: boolean;
  signals?: readonly DaySignal[];
  /** Whether the signal keys open with their group's label; the coloured dashes say enough alone. */
  signalsLabel?: boolean;
  /** More keys after the signal bar's, in the caller's order. */
  extraSignals?: readonly CalendarLegendKey[];
  /** The season kinds the shown month's tiles carry (`seasonKindsIn`). */
  seasonKinds?: readonly SeasonEventKind[];
  /** Whether the grid's days can show an average over past years (`DayWeather`). */
  showClimateKey?: boolean;
  /** Whether the grid stars each week's quietest day. */
  showBestKey?: boolean;
  /** Whether the grid prints opening hours, all in the park's time. */
  showLocalTimes?: boolean;
  className?: string;
}) {
  const tGroups = useTranslations('parks.calendarLegendGroups');
  const tWorks = useTranslations('parks.worksPeriod');
  const tCrowd = useTranslations('parks.crowdLevels');
  const tHolidays = useTranslations('parks.holidayContext');
  const tLegend = useTranslations('attractions.historyLegend');
  const tKind = useTranslations('parks.seasons.kind');
  const tMarks = useTranslations('parks.calendarMarks');

  return (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-2', className)}>
      {showCrowd && (
        <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
          <span className="text-muted-foreground shrink-0 text-[10px] font-medium tracking-widest uppercase">
            {tGroups('crowd')}
          </span>

          {/* Below `sm` the six names do not fit and pushed the legend past the card's edge, so the
            phone gets the ramp with only its two ends named. Every tile in the grid spells out its
            own tier. */}
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:hidden">
            <div className="flex h-2.5 overflow-hidden rounded-md" aria-hidden="true">
              {CROWD_LEVEL_ORDER.map((level) => (
                <span key={level} className={cn('flex-1', CROWD_SCALE_CLASS[level])} />
              ))}
            </div>
            <div className="text-muted-foreground flex justify-between text-[9px] font-medium tracking-wide uppercase">
              <span>{tCrowd('very_low')}</span>
              <span>{tCrowd('extreme')}</span>
            </div>
          </div>

          {/* From `sm` the six tiers as the tiles draw them, tint, rim and ink, so a key reads
            like the tile it explains. */}
          <div className="hidden min-w-0 flex-wrap gap-1 sm:flex">
            {CROWD_LEVEL_ORDER.map((level) => (
              <span
                key={level}
                className={cn(
                  'truncate rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase',
                  CROWD_TILE_CLASS[level],
                  CROWD_TEXT_CLASS[level]
                )}
              >
                {tCrowd(level)}
              </span>
            ))}
          </div>
        </div>
      )}

      {(signals.length > 0 || extraSignals.length > 0 || showWorks) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {signalsLabel && (
            <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
              {tGroups('signals')}
            </span>
          )}
          {signals.map((signal) => (
            <DaySignalKey
              key={signal}
              className={DAY_SIGNAL_CLASS[signal]}
              label={
                signal === 'school'
                  ? tLegend('schoolVacation')
                  : signal === 'neighbor'
                    ? tHolidays('influencingHolidays')
                    : signal === 'holiday'
                      ? tLegend('holiday')
                      : tLegend('bridgeDay')
              }
            />
          ))}
          {extraSignals.map((signal) => (
            <DaySignalKey
              key={signal.key}
              className={signal.className}
              style={signal.style}
              mark={signal.mark}
              label={signal.label}
            />
          ))}
          {showWorks && (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <WorksIcon className={cn('h-3 w-3 shrink-0', WORKS_TONE_CLASS)} aria-hidden="true" />
              <span className="text-[11px]">{tWorks('closedRidesTitle')}</span>
            </span>
          )}
        </div>
      )}

      {seasonKinds.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {seasonKinds.map((kind) => (
            <span key={kind} className="flex items-center gap-1.5 whitespace-nowrap">
              <SeasonKindIcon kind={kind} />
              <span className="text-[11px]">{tKind(kind)}</span>
            </span>
          ))}
        </div>
      )}

      {showBestKey && (
        <span className="flex items-center gap-1.5 text-[11px] whitespace-nowrap">
          <span
            aria-hidden
            className={cn(
              'inline-flex h-5 items-center gap-0.5 rounded-md border px-1.5 text-[9.5px] font-bold tracking-wider uppercase',
              CROWD_TILE_CLASS.low,
              CROWD_TEXT_CLASS.low,
              TILE_BEST_RING
            )}
          >
            <Star className="text-primary size-2.5 fill-current" />
            {tCrowd('low')}
          </span>
          {tMarks('quietestOfWeek')}
        </span>
      )}

      {showClimateKey && <WeatherKey />}

      {showLocalTimes && (
        <span className="text-muted-foreground text-[11px]">{tMarks('localTimes')}</span>
      )}
    </div>
  );
}
