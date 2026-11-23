'use client';

import type { ComponentProps, KeyboardEvent, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SeasonEventKind } from '@/lib/parks/park-season-days';
import { cn } from '@/lib/utils';
import { TILE_BEST_RING, TILE_PICKED_RING } from './calendar-tile-marks';
import {
  CROWD_TEXT_CLASS,
  CROWD_TILE_CLASS,
  type ColoredCrowdLevel,
} from '@/lib/utils/crowd-level-styles';
import { CalendarIcon, CalendarSeasonIcon } from './calendar-icon-sprite';
import { SEASON_ICON_QUIET_CLASS } from './season-kind-icon';

/** A season mark that should stand out: on the page's own surface, so it reads on any crowd tile. */
const SEASON_CHIP_CLASS = 'bg-background/70 rounded-full px-1 py-px';

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
   * 60 px tall. `mini`: a phone's seven days across, 44 px: the wait without its unit, the star in
   * the corner, and the rest in the caller's `aria-label` and the day's sheet.
   */
  density?: 'full' | 'compact' | 'mini';
  /** The level that tints the tile; `null` keeps it grey. */
  level: ColoredCrowdLevel | null;
  closed: boolean;
  /** The date in the corner, `full` only; „Heute" takes the weekday's place and rims the tile. */
  date?: { day: string; weekday: string; today: boolean };
  /** The peak wait in minutes, rounded to five. */
  wait: number | null;
  /** The level in words, or why there is none. */
  status: string;
  /**
   * The star and its name, with the accent ring (`TILE_BEST_RING`): the quietest day of a week, in
   * the park calendar's rows and the hub's parks alike.
   */
  best?: string | null;
  /**
   * The tick and its name, in the star's place, with the stronger ring (`TILE_PICKED_RING`): the
   * hub's day the visitor picked for the park. A picked day carries no star.
   */
  picked?: string | null;
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
 * level's ink, the star, the season icons and the level in words, the hours on the floor. What every
 * tile of a density shares is a class in `app/globals.css` (`calendar-tile-*`), and its icons come
 * from a `CalendarIconSprite` around the grid, since a calendar's HTML holds hundreds of tiles.
 */
export function CalendarDayTile({
  density = 'full',
  level,
  closed,
  date,
  wait,
  status,
  best,
  picked = null,
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
  const isToday = density === 'full' && !!date?.today;
  const tint = level ? CROWD_TILE_CLASS[level] : 'bg-muted/25 border-border/60';
  const pressable = onSelect && 'calendar-tile-press focus-visible:ring-primary';
  // The mark's ring, drawn here so every calendar rings a tile alike; a day picked for the
  // comparison wears that ring instead, since two rings on one box are one box-shadow.
  const markRing =
    selectionIndex !== null
      ? null
      : picked
        ? TILE_PICKED_RING
        : best && !closed
          ? TILE_BEST_RING
          : null;
  const selectable = onSelect
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
    : {};

  if (density === 'mini') {
    return (
      <div
        className={cn('calendar-tile-mini', tint, markRing, pressable, className)}
        {...selectable}
        {...props}
      >
        {picked ? (
          <span
            aria-hidden
            className="bg-primary text-primary-foreground absolute top-0.5 left-0.5 flex size-3.5 items-center justify-center rounded-full"
          >
            <CalendarIcon name="check" className="size-2.5" strokeWidth={3.5} />
          </span>
        ) : (
          best &&
          !closed && (
            <CalendarIcon
              name="star"
              aria-hidden
              className="text-primary absolute top-0.5 left-0.5 size-2.5 fill-current"
            />
          )
        )}
        <span className={cn('calendar-tile-mini-wait', closed ? 'text-status-closed' : ink)}>
          {closed || wait === null ? '–' : wait}
        </span>
        {overlay}
      </div>
    );
  }

  const named = seasons.filter((mark) => !mark.quiet);
  // At full size from `lg` a season that stands out has a line of its own, which carries its icon
  // instead; a quiet one keeps the icon here, its name is above the grid.
  const marks = seasons.map((mark) => (
    <span
      key={mark.kind}
      role="img"
      aria-label={mark.label}
      title={mark.label}
      data-calendar-season={mark.kind}
      className={cn(
        'inline-flex shrink-0 items-center',
        !compact && !mark.quiet && 'lg:hidden',
        !mark.quiet && SEASON_CHIP_CLASS
      )}
    >
      <CalendarSeasonIcon
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
    <div
      className={cn(
        compact ? 'calendar-tile-compact' : 'calendar-tile-full',
        tint,
        markRing,
        isToday && 'border-primary border-2',
        // The picked state is a ring, not a border colour: the crowd tile and „heute" already own
        // the border, and a ring outside the box keeps the day's crowd level readable.
        selectionIndex !== null && 'ring-primary ring-offset-background z-10 ring-2 ring-offset-2',
        pressable,
        className
      )}
      {...selectable}
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
        <div className="calendar-tile-head">
          <span className={cn('calendar-tile-wait', ink)}>{waitText}</span>
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
            ? 'calendar-tile-status'
            : 'mt-1.5 flex items-center gap-1 text-[9.5px] font-bold tracking-wider uppercase lg:mt-2 lg:text-[10.5px]',
          closed ? 'text-status-closed' : ink
        )}
      >
        {picked ? (
          <span
            role="img"
            aria-label={picked}
            title={picked}
            className="bg-primary text-primary-foreground flex size-3.5 shrink-0 items-center justify-center rounded-full"
          >
            <CalendarIcon name="check" className="size-2.5" strokeWidth={3.5} />
          </span>
        ) : (
          best &&
          !closed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <CalendarIcon
                  name="star"
                  className="text-primary h-3 w-3 shrink-0 fill-current"
                  aria-label={best}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{best}</p>
              </TooltipContent>
            </Tooltip>
          )
        )}
        {/* The season's kind, beside the star: a chip on the page's own surface like the works one,
            or, for a season most of the window runs in or one only expected, the bare icon in the
            row's colour, so a month of Wintertraum does not drown the crowd colours. Named on
            hover; the day's dialog says the rest. */}
        {!compact && marks}
        {chips}
        <span className="truncate">{status}</span>
      </div>

      {/* The season by name, where the week grid's tile has the height for a line between the
          crowd level and the floor; the two-column list below `lg` and the compact tile keep the
          icon alone. Only a season that stands out: a quiet one (most of the month, or only
          expected) is named once above the grid (`quietSeasonRuns`), not on thirty tiles. */}
      {!compact && named.length > 0 && (
        <div className="mt-1.5 hidden min-w-0 flex-col items-start gap-0.5 text-[10.5px] lg:flex">
          {named.map((mark) => (
            <span
              key={mark.kind}
              data-calendar-season-name={mark.kind}
              className={cn(
                'flex max-w-full min-w-0 items-center gap-1 font-medium',
                mark.quiet ? 'text-muted-foreground' : cn('text-foreground', SEASON_CHIP_CLASS)
              )}
            >
              <CalendarSeasonIcon
                kind={mark.kind}
                className={mark.quiet ? SEASON_ICON_QUIET_CLASS : undefined}
              />
              <span className="truncate">{mark.label}</span>
            </span>
          ))}
        </div>
      )}

      {/* Hours and weather sit on the cell's floor so a row lines them up. Below `lg` they share a
          line; stacked, they would cost a phone row a third of its height. */}
      <div
        className={
          compact
            ? 'calendar-tile-floor'
            : 'text-muted-foreground mt-auto flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1 text-[10.5px] lg:flex-col lg:items-start lg:gap-1 lg:text-[11px]'
        }
      >
        {hours}
        {weather}
      </div>
      {overlay}
    </div>
  );
}
