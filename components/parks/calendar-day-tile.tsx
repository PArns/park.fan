'use client';

import type { ComponentProps, KeyboardEvent, ReactNode } from 'react';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SeasonEventKind } from '@/lib/parks/park-season-days';
import { cn } from '@/lib/utils';
import {
  CROWD_TEXT_CLASS,
  CROWD_TILE_CLASS,
  type ColoredCrowdLevel,
} from '@/lib/utils/crowd-level-styles';
import { SEASON_ICON_QUIET_CLASS, SeasonKindIcon } from './season-kind-icon';

/** One season kind a tile marks: its icon, quiet or on a chip, and the seasons it stands for. */
export interface TileSeasonMark {
  kind: SeasonEventKind;
  /** Drawn bare and faded: a season most of the window runs in, or one only expected. */
  quiet: boolean;
  /** The seasons' names, for the icon's name and its hover. */
  label: string;
}

/** What a tile shows; how it reads a day is the caller's (`ParkCalendarDay`, the trip hub). */
export interface CalendarDayTileProps extends Omit<ComponentProps<'div'>, 'onSelect' | 'children'> {
  /**
   * `full`: the crowd calendar's tile, the date in its corner. `compact`: a row of a park's week
   * beside other parks, where the column names the date, so the wait leads and the tile is a fixed
   * 60 px tall.
   */
  density?: 'full' | 'compact';
  /** The level that tints the tile; `null` keeps it grey. */
  level: ColoredCrowdLevel | null;
  closed: boolean;
  /** The date in the corner, `full` only; „Heute" takes the weekday's place and rims the tile. */
  date?: { day: string; weekday: string; today: boolean };
  /** The peak wait in minutes, rounded to five. */
  wait: number | null;
  /** The level in words, or why there is none. */
  status: string;
  /** The star and its name: the park calendar's recommended day, the hub's quietest of a week. */
  best?: string | null;
  seasons?: readonly TileSeasonMark[];
  /** The bar along the top edge, one segment per signal (holidays, school breaks). */
  signals?: readonly { key: string; className: string }[];
  /** More chips beside the season icons, before the level (the park calendar's works chip). */
  chips?: ReactNode;
  hours?: ReactNode;
  weather?: ReactNode;
  /** Which of two compared days this is, as a numbered badge. */
  selectionIndex?: 1 | 2 | null;
  /** Makes the tile a button (Enter and Space too); its name comes as `aria-label`. */
  onSelect?: () => void;
  /** Marks laid over the tile by its caller, such as the hub's early-close corner. */
  overlay?: ReactNode;
}

/**
 * The crowd calendar's day tile, drawn from what it shows rather than from an API day, so the park
 * calendar and the trip hub's week share one object: tinted by the level, the peak wait in the
 * level's ink, the star, the season icons and the level in words, the hours on the floor.
 */
export function CalendarDayTile({
  density = 'full',
  level,
  closed,
  date,
  wait,
  status,
  best,
  seasons = [],
  signals = [],
  chips,
  hours,
  weather,
  selectionIndex = null,
  onSelect,
  overlay,
  className,
  ...props
}: CalendarDayTileProps) {
  const tCommon = useTranslations('common');
  const compact = density === 'compact';
  const ink = level ? CROWD_TEXT_CLASS[level] : 'text-muted-foreground';
  const isToday = !compact && !!date?.today;

  const marks = seasons.map((mark) => (
    <span
      key={mark.kind}
      role="img"
      aria-label={mark.label}
      title={mark.label}
      data-calendar-season={mark.kind}
      className={cn(
        'inline-flex shrink-0 items-center',
        !mark.quiet && 'bg-background/70 rounded-full px-1 py-px'
      )}
    >
      <SeasonKindIcon
        kind={mark.kind}
        className={mark.quiet ? SEASON_ICON_QUIET_CLASS : undefined}
      />
    </span>
  ));
  const waitText = wait !== null && (
    <>
      {wait} {tCommon('min')}
    </>
  );

  return (
    <Card
      className={cn(
        compact
          ? 'relative flex h-15 flex-col gap-0 overflow-hidden rounded-lg px-2 py-1.5 backdrop-blur-none'
          : 'relative flex h-full min-h-[92px] flex-col gap-0 overflow-hidden rounded-xl p-[10px] lg:min-h-[150px] lg:p-3',
        level ? CROWD_TILE_CLASS[level] : 'bg-muted/25 border-border/60',
        isToday && 'border-primary border-2',
        // The picked state is a ring, not a border colour: the crowd tile and „heute" already own
        // the border, and a ring outside the box keeps the day's crowd level readable.
        selectionIndex !== null && 'ring-primary ring-offset-background z-10 ring-2 ring-offset-2',
        onSelect &&
          'focus-visible:ring-primary cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
        className
      )}
      {...(onSelect
        ? {
            role: 'button' as const,
            tabIndex: 0,
            onClick: onSelect,
            onKeyDown: (e: KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect();
              }
            },
          }
        : {})}
      {...props}
    >
      {/* Which of the two picks this is. Numbered, not ticked: the comparison's left column is the
          first day chosen. */}
      {selectionIndex !== null && (
        <span className="bg-primary text-primary-foreground absolute right-1 bottom-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums">
          {selectionIndex}
        </span>
      )}

      {/* Inside the cell's rounding, so it reads as part of the tile rather than a chip laid on it.
       */}
      {signals.length > 0 && (
        <span className="pointer-events-none absolute inset-x-0 top-0 flex h-[3px]">
          {signals.map((s) => (
            <span key={s.key} className={cn('h-full flex-1', s.className)} />
          ))}
        </span>
      )}

      {compact ? (
        // The wait leads, the season icons at its end, so the level's line keeps its width.
        <div className="flex min-h-[15px] items-center justify-between gap-1">
          <span
            className={cn('text-[15px] leading-none font-bold whitespace-nowrap tabular-nums', ink)}
          >
            {waitText}
          </span>
          {marks.length > 0 && <span className="flex shrink-0 items-center gap-0.5">{marks}</span>}
        </div>
      ) : (
        // `flex-wrap` and a date group that does not shrink: in the narrowest seven-column cell the
        // date, the „Heute" pill and the wait do not fit one line, and without the wrap the pill
        // slid across the wait time.
        <div className="flex flex-wrap items-start justify-between gap-x-1.5 gap-y-0.5">
          <div className="flex shrink-0 items-baseline gap-1.5">
            <span
              className={cn('text-[21px] leading-none font-bold tabular-nums lg:text-[26px]', ink)}
            >
              {date?.day}
            </span>
            {/* The weekday gives way to the „Heute" pill: at `lg` the two do not fit side by side.
             */}
            {isToday ? (
              <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-[3px] text-[8.5px] font-bold tracking-wider whitespace-nowrap uppercase">
                {tCommon('today')}
              </span>
            ) : (
              <span className="text-muted-foreground text-[11px] font-medium lg:text-xs">
                {date?.weekday}
              </span>
            )}
          </div>
          {waitText && (
            <span
              className={cn(
                'ml-auto text-[13px] leading-tight font-bold whitespace-nowrap tabular-nums lg:text-[15px]',
                ink
              )}
            >
              {waitText}
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          compact
            ? 'mt-1 flex items-center gap-1 text-[9.5px] leading-tight font-bold tracking-wider uppercase'
            : 'mt-1.5 flex items-center gap-1 text-[9.5px] font-bold tracking-wider uppercase lg:mt-2 lg:text-[10.5px]',
          closed ? 'text-status-closed' : ink
        )}
      >
        {best && !closed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Star className="h-3 w-3 shrink-0 fill-current" aria-label={best} />
            </TooltipTrigger>
            <TooltipContent>
              <p>{best}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {/* The season's kind, beside the star: a chip on the page's own surface like the works one,
            or, for a season most of the window runs in or one only expected, the bare icon in the
            row's colour, so a month of Wintertraum does not drown the crowd colours. Named on
            hover; the day's dialog says the rest. */}
        {!compact && marks}
        {chips}
        <span className="truncate">{status}</span>
      </div>

      {/* Hours and weather sit on the cell's floor so a row lines them up. Below `lg` they share a
          line; stacked, they would cost a phone row a third of its height. */}
      <div
        className={
          compact
            ? 'text-muted-foreground mt-auto flex min-w-0 items-center pt-0.5 text-[10.5px] leading-tight'
            : 'text-muted-foreground mt-auto flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1 text-[10.5px] lg:flex-col lg:items-start lg:gap-1 lg:text-[11px]'
        }
      >
        {hours}
        {weather}
      </div>
      {overlay}
    </Card>
  );
}
