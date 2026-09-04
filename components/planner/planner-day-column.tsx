'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarPlus } from 'lucide-react';
import { PlannerColumnHead } from './planner-column-head';
import { PlannerContextBand, type PlannerDayState } from './planner-context-band';
import { PlannerPartyChips } from './planner-party-chips';
import { PlannerShowBand } from './planner-show-band';
import { PlannerDayGrid } from './planner-day-grid';
import { PlannerGridActions } from './planner-grid-actions';
import { PlannerTimeline } from './planner-timeline';
import { PlannerHelpSteps } from './planner-help';
import { PlannerPlanParkCta } from './planner-plan-park-cta';
import { usePlanner } from '@/lib/planner/use-planner';
import { entriesFor, type PlannerEntry } from '@/lib/planner/types';
import { usePlanDay } from '@/lib/hooks/use-plan-day';
import { usePlannerDayFacts } from '@/lib/planner/use-day-facts';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { buildDayGrid, growGridForSpans } from '@/lib/planner/day-grid';
import { occupiedMinutes } from '@/lib/planner/estimate';
import { closedNowFor, liveWaitsFor } from '@/lib/planner/live';
import { parkToday, resolveTimeZone } from '@/lib/planner/park-time';
import { showLinesFor } from '@/lib/planner/shows';
import { plannerShowsVisible } from '@/lib/planner/shows-visible';
import { PLANNER_RIDE_MIME, parseRideDrag } from '@/lib/planner/ride-drag';
import { cn } from '@/lib/utils';

interface PlannerDayColumnProps {
  parkSlug: string | null;
  date: string | null;
  /**
   * The plan's ACTIVE column. Exactly one is, and it is the one every
   * panel-level control speaks for — the ride search, the headliner band, the
   * free-block row and the summary in the foot. A second column is a day beside
   * it, not a second active day.
   */
  primary: boolean;
  /** Whether the panel is open, which is what gates this column's queries. */
  open: boolean;
  onPickPark: (parkSlug: string) => void;
  onPickDate: (date: string) => void;
  onNewPark: () => void;
  /** Absent on the primary column: the plan's active day cannot be closed away. */
  onClose?: () => void;
  /** The park the page behind the panel is about, where it has no day yet. */
  unplannedPagePark?: { slug: string; name: string } | null;
  onStartPagePark?: () => void;
  onOpenWizard?: () => void;
}

/**
 * One day of one park, with everything that is about THAT day.
 *
 * It exists because the panel can hold two. With one column every per-day
 * question was answered in the panel's own header — one park name, one day
 * picker — and that stops working the moment there is a second, because the
 * header has no way to say which of the two it means. So the pair moved onto the
 * column, and the rest of the day's chrome came with it: the context band, the
 * showtime strip, the axis, and the action row that a selected block docks into.
 *
 * Two things are deliberately NOT in here, and both are about what a control
 * speaks for rather than about layout. The panel's foot — the ride search, the
 * headliner band, the free-block row, the totals — follows the PRIMARY column,
 * because those are how a day is filled and the plan has exactly one active day.
 * And the park photo behind the panel is panel-level for the same reason: it is
 * one wash under both columns, and it is the active park's.
 *
 * Every query in here is keyed by (park, date), so two columns of the same park
 * on two dates share the park-level ones — the best-days snapshot has no date in
 * its key, and the live poll is gated on `isToday` — and pay twice only for the
 * two things that really are per day.
 */
export function PlannerDayColumn({
  parkSlug,
  date,
  primary,
  open,
  onPickPark,
  onPickDate,
  onNewPark,
  onClose,
  unplannedPagePark = null,
  onStartPagePark,
  onOpenWizard,
}: PlannerDayColumnProps) {
  const t = useTranslations('planner');
  const { state, addRide, moveRide, removeRide, shiftFrom, editCustom, setDone, setDayPrefs } =
    usePlanner();

  const park = parkSlug ? state.parks[parkSlug] : null;
  const entries = useMemo(() => entriesFor(state, parkSlug, date), [state, parkSlug, date]);

  /**
   * Which block is selected, and it is per COLUMN.
   *
   * Entry ids are unique only within one (park, date) — `makeId` counts
   * collisions among that day's entries alone — so `taron-1` legitimately exists
   * in a Saturday column and a Sunday column of the same park, which is exactly
   * the case two columns are for. A panel-level selection would highlight both
   * blocks and edit whichever one the action row happened to be handed.
   */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flatDropActive, setFlatDropActive] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const {
    data: day,
    isFetching,
    isError,
  } = usePlanDay({
    continent: park?.geo.continent ?? '',
    country: park?.geo.country ?? '',
    city: park?.geo.city ?? '',
    parkSlug: parkSlug ?? '',
    date: date ?? undefined,
    enabled: open && Boolean(park && date),
  });

  // Keyed off `isFetching` rather than `isPending`: a disabled query is pending
  // forever, so with no park picked the band would pulse without a request ever
  // having been made.
  const dayState: PlannerDayState = isError
    ? 'error'
    : isFetching && !day
      ? 'loading'
      : day
        ? 'ready'
        : 'empty';

  const timezone = resolveTimeZone(day?.timezone ?? park?.timezone);
  const isToday = Boolean(date && date === parkToday(timezone));

  const spans = useMemo(
    () =>
      entries.map((entry: PlannerEntry) => ({
        startMinute: entry.startMinute,
        spanMinutes: occupiedMinutes(day, entry),
      })),
    [entries, day]
  );

  /**
   * The park's axis, grown until it contains the plan. `openMin`/`closeMin` are
   * untouched by the growth, so the opening-hours band still marks the park's
   * real day and every placement rule still speaks for the park.
   */
  const grid = growGridForSpans(buildDayGrid(day?.context.openHour, day?.context.closeHour), spans);

  const dayFacts = usePlannerDayFacts(park, open);
  const prefs = date ? park?.days[date]?.prefs : undefined;

  // Gated on TODAY for two reasons that point the same way: a standby reading
  // describes this minute and says nothing about a Tuesday in November, and on a
  // park page this is a cache hit on the key the page already holds.
  const { data: livePark } = useLiveParkData({
    continent: park?.geo.continent ?? '',
    country: park?.geo.country ?? '',
    city: park?.geo.city ?? '',
    parkSlug: parkSlug ?? '',
    enabled: open && isToday && Boolean(park),
  });
  const liveWaits = liveWaitsFor(livePark);
  const closedNow = closedNowFor(livePark);

  const showsVisible = useSyncExternalStore(
    plannerShowsVisible.subscribe,
    plannerShowsVisible.getSnapshot,
    plannerShowsVisible.getServerSnapshot
  );
  const showLines = day
    ? showLinesFor(
        day.shows,
        day.context.openHour !== null && day.context.closeHour !== null
          ? { openMin: day.context.openHour * 60, closeMin: day.context.closeHour * 60 }
          : null
      )
    : null;

  const plannedDates = park
    ? Object.values(park.days)
        .filter((d) => d.entries.length > 0)
        .map((d) => d.date)
    : [];

  /**
   * Delete removes the selected block.
   *
   * A grid you can select an item in and not delete it from is a grid that owes
   * you a mouse trip to a button — and the action row's own button stays, for
   * the phone, where there is no Delete key.
   *
   * Bound to the DOCUMENT rather than to the block, because a block is not
   * focused after a pointer selection: the grip takes focus during a drag and a
   * plain click on the body focuses nothing at all. Guarded on the three places
   * a Delete belongs to something else — a text field, a number field, anything
   * `contenteditable` — since the panel carries a search box and a free block's
   * label is an `<input>` sitting inside the very row this deletes.
   *
   * It lives on the COLUMN, with the selection it acts on. Panel-level it would
   * have to name a park and a date, and with two columns open there are two of
   * each — the effect is inert in a column with nothing selected, so exactly one
   * of them ever has a listener bound.
   */
  useEffect(() => {
    if (!selectedId || !parkSlug || !date) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')
      )
        return;
      event.preventDefault();
      removeRide(parkSlug, date, selectedId);
      setSelectedId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedId, parkSlug, date, removeRide]);

  const parks = useMemo(() => Object.values(state.parks), [state.parks]);

  /**
   * Ticking a ride off, from either view.
   *
   * ONE handler, because there are two of them — the grid's docked action row
   * and the flat list's row button — and both take `(entryId, done)`. The
   * measured figure is looked up HERE rather than passed by the caller: the
   * flat list had no way to pass it, and it is the view every visitor gets on a
   * day with no axis, so every tick from there stored `done: true` with no
   * number. Only on the way IN — un-ticking drops the figure, because a measured
   * number must not stay attached to an entry that is a plan again.
   */
  const toggleDone = (entryId: string, done: boolean) => {
    if (!parkSlug || !date) return;
    const slug = entries.find((entry: PlannerEntry) => entry.id === entryId)?.attractionSlug;
    const actual = done && slug ? liveWaits?.get(slug) : undefined;
    setDone(parkSlug, date, entryId, done, actual ?? undefined);
  };

  return (
    <div
      data-planner-column={parkSlug && date ? `${parkSlug}:${date}` : ''}
      data-planner-column-primary={primary ? '' : undefined}
      className="flex min-w-0 flex-1 flex-col"
    >
      {/* Only once the plan holds a park. With none, the head would be a
          chooser over an empty list under the words "kein Park" — a control
          asking a question the visitor has no way to answer — and it would sit
          above the empty state, which is the one screen that has to say what
          this thing is for and already carries the button that starts it. */}
      {parks.length > 0 && (
        <PlannerColumnHead
          parks={parks}
          parkSlug={parkSlug}
          date={date}
          onPickPark={onPickPark}
          onPickDate={onPickDate}
          onNewPark={onNewPark}
          onClose={onClose}
          plannedDates={plannedDates}
          timezone={timezone}
          facts={dayFacts.byDate}
          maxDate={dayFacts.lastDate ?? undefined}
        />
      )}

      {/* Only where a day has been CHOSEN. `dayState` ends in a fall-through
          `empty`, and with no park or date the query is disabled — so the band
          cannot tell "nobody ever asked" from a real 404 and would print "keine
          Prognose" over an empty planner. The guard sits on the wrapper because
          it carries the `border-b`. */}
      {park && date && (
        <div className="border-border/60 shrink-0 border-b">
          <PlannerContextBand
            day={day ?? null}
            state={dayState}
            trailing={
              <PlannerPartyChips
                prefs={prefs}
                onChange={(patch) => setDayPrefs(park.slug, date, patch)}
              />
            }
          />
        </div>
      )}

      {/* A FLOOR under the grid, and it is the difference between a planner and
          a search box — see the phone note in the flyout. */}
      <div className="relative flex min-h-0 flex-1 flex-col max-sm:min-h-[216px]">
        <div
          ref={scrollerRef}
          className={cn(
            'relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-1 py-2',
            flatDropActive && 'ring-primary/60 rounded-md ring-2 ring-inset'
          )}
          onDragOver={(event) => {
            if (grid || !park || !date) return;
            if (!event.dataTransfer.types.includes(PLANNER_RIDE_MIME)) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            setFlatDropActive(true);
          }}
          onDragLeave={() => setFlatDropActive(false)}
          onDrop={(event) => {
            // Prevented FIRST, before any refusal: a park card writes
            // `text/uri-list` beside our own payload, so an early return leaves
            // the browser holding a link it will follow.
            event.preventDefault();
            setFlatDropActive(false);
            if (grid || !park || !date) return;
            const dragged = parseRideDrag(event.dataTransfer.getData(PLANNER_RIDE_MIME));
            if (!dragged || dragged.parkSlug !== park.slug) return;
            addRide({
              parkSlug: park.slug,
              parkName: park.name,
              geo: park.geo,
              timezone: day?.timezone ?? park.timezone,
              date,
              attractionSlug: dragged.attractionSlug,
              attractionName: dragged.attractionName,
            });
          }}
        >
          {grid && (
            <PlannerShowBand
              lines={showLines}
              timezone={timezone}
              isToday={isToday}
              visible={showsVisible}
              onToggle={plannerShowsVisible.toggle}
            />
          )}
          {grid ? (
            <PlannerDayGrid
              entries={entries}
              day={day ?? null}
              grid={grid}
              timezone={timezone}
              isToday={isToday}
              liveWaits={liveWaits}
              /* `[]` rather than `null` while the switch is off: `null` is this
                 prop's "the day payload has not arrived". */
              showLines={showsVisible ? showLines : []}
              closedNow={closedNow}
              parkSlug={park?.slug}
              onDropRide={(attractionSlug, attractionName, startMinute) => {
                if (!park || !date) return;
                addRide({
                  parkSlug: park.slug,
                  parkName: park.name,
                  geo: park.geo,
                  timezone: day?.timezone ?? park.timezone,
                  date,
                  attractionSlug,
                  attractionName,
                  startMinute,
                });
              }}
              onResize={(entryId, durationMinutes) => {
                if (parkSlug && date) editCustom(parkSlug, date, entryId, { durationMinutes });
              }}
              loading={dayState === 'loading'}
              emptyAction={
                unplannedPagePark && onStartPagePark ? (
                  <PlannerPlanParkCta
                    parkName={unplannedPagePark.name}
                    onStart={onStartPagePark}
                    className="mt-3"
                  />
                ) : null
              }
              selectedId={selectedId}
              scrollerRef={scrollerRef}
              onSelect={setSelectedId}
              onMove={(entryId, startMinute) =>
                parkSlug && date && moveRide(parkSlug, date, entryId, startMinute)
              }
              onShiftFrom={(entryId, delta) =>
                parkSlug && date && shiftFrom(parkSlug, date, entryId, delta)
              }
            />
          ) : entries.length === 0 ? (
            <div className="flex flex-col gap-3 px-4 py-5">
              <div>
                <p className="text-sm font-medium">{t('empty.title')}</p>
                {unplannedPagePark && onStartPagePark ? (
                  <PlannerPlanParkCta
                    parkName={unplannedPagePark.name}
                    onStart={onStartPagePark}
                    className="mt-2"
                  />
                ) : (
                  onOpenWizard && (
                    <button
                      type="button"
                      onClick={onOpenWizard}
                      data-planner-start-wizard=""
                      className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors max-sm:min-h-11"
                    >
                      <CalendarPlus className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{t('wizard.open')}</span>
                    </button>
                  )
                )}
              </div>
              <PlannerHelpSteps layout="list" />
            </div>
          ) : (
            /* No opening hours means no honest axis — not a 24-hour one, which
               would assert a park that never closes, and not an invented 9-to-6. */
            <PlannerTimeline
              entries={entries}
              day={day ?? null}
              onToggleDone={toggleDone}
              onRemove={(entryId) => parkSlug && date && removeRide(parkSlug, date, entryId)}
            />
          )}
        </div>
        {grid && selectedId && (
          <PlannerGridActions
            entry={entries.find((e: PlannerEntry) => e.id === selectedId) ?? null}
            day={day ?? null}
            onToggleDone={toggleDone}
            onRemove={(entryId) => {
              if (parkSlug && date) removeRide(parkSlug, date, entryId);
              setSelectedId(null);
            }}
            onClose={() => setSelectedId(null)}
            onEditCustom={(entryId, patch) => {
              if (parkSlug && date) editCustom(parkSlug, date, entryId, patch);
            }}
          />
        )}
      </div>
    </div>
  );
}
