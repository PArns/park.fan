'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarPlus, Check, Crown, Droplets, Ruler, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { foldRideName } from '@/lib/utils/text-fold';
import { PHONE_TARGET_32 } from '@/lib/planner/touch-target';
import { usePlanner } from '@/lib/planner/use-planner';
import { partyFlags } from '@/lib/planner/party';
import { RiderHeight } from '@/components/common/unit-display';
import { PlannerRideThumb } from '@/components/planner/planner-ride-thumb';
import type { PlannerDayPrefs, PlannerGeo } from '@/lib/planner/types';
import { buildDayGrid, earlyEntryOpenMin, nextFreeStart, rideFloor } from '@/lib/planner/day-grid';
import { usePlannerPxPerMin } from '@/lib/planner/use-grid-scale';
import { dayClock, resolveTimeZone } from '@/lib/planner/park-time';
import { startRideDrag } from '@/lib/planner/ride-drag';
import { spansFor } from '@/lib/planner/estimate';
import type { PlanDay, PlanDayRide } from '@/lib/api/types';
import type { PlannerDayState } from './planner-context-band';

interface PlannerRideSearchProps {
  parkSlug: string;
  parkName: string;
  geo: PlannerGeo;
  date: string;
  /** The day's payload — its rides are the ones that can actually be planned. */
  day: PlanDay | null;
  /** Why there is no payload, when there is none. */
  dayState: PlannerDayState;
  /** The park's IANA zone, stored with the park so the plan reckons in it. */
  timezone?: string;
  /**
   * Who is coming, if anybody asked. A row the shortest rider cannot ride is flagged with the
   * height and still offered, never dropped: the visitor knows who is holding the bags.
   */
  prefs?: PlannerDayPrefs;
  /**
   * Adds a block the visitor writes themselves, beside the ride search because both answer "what
   * else goes in the day".
   */
  onAddCustom?: () => void;
  /** The show picker, drawn wherever the free block's button is. */
  showPicker?: ReactNode;
  /**
   * The phone's search mode: the panel hides the axis and the foot and hands this block the sheet,
   * so the rows are above the keyboard. The field turns it on at focus and „Fertig" turns it off;
   * a blur does not, or the layout would jump out from under the tap on a row.
   */
  searching?: boolean;
  onSearchingChange?: (searching: boolean) => void;
  /**
   * A portrait phone, whatever the pointer: out of search mode the block is one row, the field and
   * the free-block button, and the ride list is drawn only in search mode, because the sheet has no
   * room for it at rest. A landscape phone draws the search in a column of its own.
   */
  compact?: boolean;
  /**
   * The desktop's copy, inside each column's foot row beside the free-block button: no border,
   * padding or free-block button of its own, and the list only while a query is typed, so it does
   * not take the axis's room. Rows are clicked or dragged onto the axis.
   */
  inline?: boolean;
}

/**
 * Adding a ride without a ride card in reach, which is the way in on a phone.
 *
 * The list comes from the day, not the park: `/plan/day` omits rides with no hourly shape, so the
 * search only offers rides the planner can draw. No debounce and no request, since the day's rides
 * are already in memory.
 */
export function PlannerRideSearch({
  parkSlug,
  parkName,
  geo,
  date,
  day,
  dayState,
  timezone,
  prefs,
  onAddCustom,
  showPicker,
  searching = false,
  onSearchingChange,
  compact = false,
  inline = false,
}: PlannerRideSearchProps) {
  const t = useTranslations('planner');
  /** The axis' scale; see {@link usePlannerPxPerMin}. */
  const pxPerMin = usePlannerPxPerMin();
  const locale = useLocale();
  const { state, addRide } = usePlanner();
  // This day's entries, by park and date rather than the active day: the desktop draws one search
  // per column.
  const dayEntries = useMemo(
    () => state.parks[parkSlug]?.days[date]?.entries ?? [],
    [state, parkSlug, date]
  );
  const [query, setQuery] = useState('');
  const fieldRef = useRef<HTMLInputElement>(null);
  /** The one-row state: a portrait phone that is not searching. See `compact`. */
  const resting = (compact && !searching) || (inline && query.trim().length === 0);

  // How often each ride is already in this day: a count, because a ride can be planned twice.
  const planned = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of dayEntries) {
      if (!entry.attractionSlug) continue;
      counts.set(entry.attractionSlug, (counts.get(entry.attractionSlug) ?? 0) + 1);
    }
    return counts;
  }, [dayEntries]);

  // Where the next ride goes, per render so a second add lands after the first, and per ride,
  // because the floor is the ride's own, not the park's.
  const grid = buildDayGrid(
    day?.context.openHour,
    day?.context.closeHour,
    pxPerMin,
    earlyEntryOpenMin(day?.context)
  );
  // Per render too, so a row tapped at 14:00 cannot file into the morning. `resolveTimeZone` here,
  // since the zone handed in can be undefined.
  const clock = dayClock(date, resolveTimeZone(timezone));
  const startFor = (ride: PlanDayRide) =>
    grid
      ? nextFreeStart(
          spansFor(day, dayEntries),
          grid,
          undefined,
          rideFloor(grid, ride, clock).softMin
        )
      : undefined;

  /**
   * The day's rides by name. The API sorts them busiest first, which put only headliners in a
   * capped list. A copy, because `day.rides` is React Query's cached array and must not be sorted
   * in place.
   */
  const byName = useMemo(
    () =>
      day
        ? [...day.rides].sort((a, b) => a.attractionName.localeCompare(b.attractionName, locale))
        : [],
    [day, locale]
  );

  const matches = useMemo(() => {
    const needle = foldRideName(query);
    if (needle.length === 0) return byName;
    return byName.filter((ride) => foldRideName(ride.attractionName).includes(needle));
  }, [byName, query]);

  return (
    /* Named so `check:planner` can ask whether this surface is on screen: the empty day's sentence
       and the free-block row mean different things depending on it. `py-1`, because the panel
       squeezes this block first. */
    <div
      data-planner-ride-search=""
      data-planner-search-mode={searching ? 'on' : undefined}
      className={cn(
        'border-border/60 planner-phone:py-0.5 border-t px-2 pt-1 pb-1',
        // 6 px above and below the 32 px row on a portrait phone: the room its controls' 44 px
        // reach lands in, so it stays inside this block.
        compact && 'planner-phone:py-1.5',
        // In search mode the block is the sheet's, and the list scrolls under a fixed field.
        searching && 'flex min-h-0 flex-1 flex-col',
        // Inside the desktop foot's row, which draws the rule and the room.
        inline && 'border-t-0 p-0'
      )}
    >
      {/* 32 px on a phone, the height every other control in the sheet is drawn at; 16 px type on a
          coarse pointer, see `[data-planner-sheet]` in `app/globals.css`. */}
      <div className="relative flex items-center gap-2">
        <Search className="text-muted-foreground/60 pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
        <input
          ref={fieldRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => onSearchingChange?.(true)}
          placeholder={t('search.placeholder')}
          className={cn(
            'bg-accent/40 focus:bg-accent placeholder:text-muted-foreground/70 planner-phone:h-8 h-9 w-full min-w-0 flex-1 rounded-md pr-2 pl-7 text-sm transition-colors outline-none',
            // The height of the free-block button beside it in the desktop row.
            inline && 'h-8'
          )}
        />
        {/* The way out of search mode, where iOS puts it. It empties the field too. 32 px drawn and
            44 to a finger, 6 px up and down. */}
        {searching && onSearchingChange && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              fieldRef.current?.blur();
              onSearchingChange(false);
            }}
            data-planner-search-done=""
            className="text-primary relative flex h-8 shrink-0 items-center px-1 text-sm font-medium after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-['']"
          >
            {t('search.done')}
          </button>
        )}
        {/* At rest the free block sits beside the field; in search mode it heads the list below.
            Never both: see the pair below. */}
        {resting && onAddCustom && (
          <button
            type="button"
            onClick={onAddCustom}
            data-planner-add-custom-search=""
            className={cn(
              'text-muted-foreground hover:text-foreground hover:bg-accent/50 flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs transition-colors',
              PHONE_TARGET_32
            )}
          >
            <CalendarPlus className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{t('custom.add')}</span>
          </button>
        )}
        {resting && showPicker}
      </div>

      {/* What a tap does, since this list is the phone's way in. Only until the first ride is in,
          when the sentence has done its job and its two lines are room the axis needs. Not in the
          desktop row, whose way in is the drag the empty axis names. */}
      {planned.size === 0 && !inline && (
        <p className="text-muted-foreground planner-phone:mt-0.5 mt-1 px-1 text-[11px] leading-snug">
          {t('search.tapHint')}
        </p>
      )}

      {/* The phone's copy of the free-block offer, under its own name, so the pair can be counted:
          this one where the search is, the foot's where it is not, never both. */}
      {!resting && onAddCustom && (
        <button
          type="button"
          onClick={onAddCustom}
          data-planner-add-custom-search=""
          className="text-muted-foreground hover:text-foreground hover:bg-accent/50 planner-phone:min-h-11 mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors"
        >
          <CalendarPlus className="size-3.5 shrink-0" />
          <span className="truncate">{t('custom.add')}</span>
        </button>
      )}
      {!resting && showPicker && <div className="mt-1">{showPicker}</div>}
      {resting ? null : matches.length === 0 ? (
        <p className="text-muted-foreground mt-2 px-1 text-xs">
          {/* Three silences that are not interchangeable: no match, no forecast, a failed request.
              The input never disappears: on a phone it is the only way into the plan. */}
          {day
            ? t('search.noResults')
            : dayState === 'error'
              ? t('error')
              : dayState === 'loading'
                ? t('loading')
                : t('noPlan')}
        </p>
      ) : (
        <ul
          className={cn(
            'mt-2 overflow-y-auto',
            searching ? 'min-h-0 flex-1 overscroll-y-contain' : 'max-h-44 sm:max-h-56'
          )}
        >
          {matches.map((ride) => (
            <li key={ride.attractionSlug}>
              <button
                type="button"
                onClick={() =>
                  addRide({
                    parkSlug,
                    parkName,
                    geo,
                    date,
                    timezone,
                    attractionSlug: ride.attractionSlug,
                    attractionName: ride.attractionName,
                    // The first free slot, not the opening hour, so rides added in a row do not
                    // pile up on one minute.
                    startMinute: startFor(ride),
                  })
                }
                /* Draggable, so a ride can be put at a chosen hour from here as from any card. The
                   click stays the whole path on a phone, which has no HTML5 drag. */
                draggable
                onDragStart={(event) =>
                  startRideDrag(
                    event.dataTransfer,
                    {
                      parkSlug,
                      attractionSlug: ride.attractionSlug,
                      attractionName: ride.attractionName,
                    },
                    // The row's own decoded thumbnail, the only kind the chip can draw; `photo` is
                    // the fallback while it is in flight.
                    {
                      element: event.currentTarget,
                      photo: ride.backgroundImage,
                      photoPosition: ride.backgroundPosition,
                    }
                  )
                }
                className="hover:bg-accent planner-phone:py-2.5 flex w-full cursor-grab items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors active:cursor-grabbing"
              >
                {/* The ride's photo, already in the payload (`enrichAttractionsWithImages`), so no
                    request and no `@/lib/media` import in a Client Component. */}
                <PlannerRideThumb
                  src={ride.backgroundImage}
                  position={ride.backgroundPosition}
                  size={8}
                />
                <span className="min-w-0 flex-1 truncate text-sm">{ride.attractionName}</span>
                {/* When the ride starts, where that is not when the park does, so a rope drop can
                    see which queues do not exist yet. Absent prints nothing. */}
                {ride.opensAt && (
                  <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
                    {t('search.opensAt', { time: ride.opensAt })}
                  </span>
                )}
                {/* The curated headliner set, never the day's busiest rides: a headliner on a quiet
                    day is still the ride somebody travelled for. */}
                {ride.isHeadliner && (
                  <Crown
                    className="text-crowd-high size-3 shrink-0"
                    aria-label={t('headliners.label')}
                  />
                )}
                {/* What this party's answers say about this ride: a flag, never a filter. */}
                {(() => {
                  const flags = partyFlags(ride, prefs);
                  if (!flags.tooShort && !flags.wet) return null;
                  return (
                    <span className="flex shrink-0 items-center gap-1">
                      {flags.tooShort && ride.minimumHeight != null && (
                        <span
                          className="bg-crowd-high/15 text-crowd-high flex items-center gap-0.5 rounded-full px-1.5 text-[10px] font-medium"
                          title={t('party.tooShort')}
                        >
                          <Ruler className="size-2.5 shrink-0" aria-hidden="true" />
                          <RiderHeight cm={ride.minimumHeight} />
                        </span>
                      )}
                      {flags.wet && (
                        <Droplets
                          className="text-crowd-moderate size-3 shrink-0"
                          aria-label={t('party.wet')}
                        />
                      )}
                    </span>
                  );
                })()}
                {/* One lap is a tick; two or more is a number, so a repeat stands out. */}
                {(planned.get(ride.attractionSlug) ?? 0) === 1 && (
                  <Check className="text-crowd-low size-3.5 shrink-0" />
                )}
                {(planned.get(ride.attractionSlug) ?? 0) > 1 && (
                  <span className="bg-crowd-low/20 text-crowd-low shrink-0 rounded-full px-1.5 text-[10px] font-medium tabular-nums">
                    {planned.get(ride.attractionSlug)}×
                  </span>
                )}
                {ride.land && (
                  <span className="text-muted-foreground shrink-0 truncate text-[11px]">
                    {ride.land}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
