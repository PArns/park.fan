'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Trash2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TripDeleteFrom } from '@/lib/analytics/site-analytics';
import { formatDateRange } from '@/lib/trip-regions/hub-data';
import { hubTripOf, type HubTripDates } from '@/lib/trip-regions/hub-trip';
import { trackTripEvent } from '@/lib/trip-regions/plan-analytics';
import { clearTrip, type ClearedTrip } from '@/lib/trip-regions/trip-clear';

/** How long „Rückgängig“ stays after a delete; then the copy in memory goes. */
const UNDO_MS = 8000;

/** The delete waiting out its undo: one at a time, on this page only. */
interface Deleted {
  region: string;
  dates: HubTripDates | null;
  trip: ClearedTrip;
  timer: ReturnType<typeof setTimeout>;
}

let deleted: Deleted | null = null;
/** The undo button had the focus when the status went, so the status keeps it. */
let keepFocus = false;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const deletedNow = () => deleted;
const noneOnServer = () => null;

/** Put the trip back (`undo`) or let its copy go, and end the status line. */
function settle(undo: boolean): void {
  if (!deleted) return;
  clearTimeout(deleted.timer);
  if (undo) deleted.trip.restore();
  else deleted.trip.drop();
  const focused = document.activeElement;
  keepFocus =
    focused instanceof HTMLElement && focused.closest('[data-plan-delete-status]') !== null;
  deleted = null;
  listeners.forEach((listener) => listener());
}

/** Delete a region's trip on this device (`clearTrip`), counted, with a few seconds to undo it. */
function deleteTrip(region: string, from: TripDeleteFrom): void {
  settle(false);
  const dates = hubTripOf(window.location.search);
  const trip = clearTrip(region);
  trackTripEvent(region, 'trip_deleted', { from });
  deleted = { region, dates, trip, timer: setTimeout(() => settle(false), UNDO_MS) };
  listeners.forEach((listener) => listener());
}

/** Whether a delete of this region's trip is waiting out its undo. */
export function useTripDeleted(region: string): boolean {
  return useSyncExternalStore(subscribe, deletedNow, noneOnServer)?.region === region;
}

/**
 * „Reise löschen“, where a visitor manages the trip: the hub's head (after the line that says the
 * plan is saved, `children`) and the result, under the keep actions. A press asks inline, in place
 * of the line („Diese Reise löschen? …“, „Löschen“, „Behalten“; Escape keeps it); „Löschen“
 * clears every store of the region's trip (`clearTrip`) and counts `trip_deleted` with `from`.
 * The hub then shows its landing page, and {@link PlanDeleteStatus} offers the undo.
 */
export function PlanDelete({
  region,
  from,
  children,
  className,
}: {
  region: string;
  from: TripDeleteFrom;
  /** The line the action stands at the end of, which the question replaces while it is asked. */
  children?: ReactNode;
  className?: string;
}) {
  const t = useTranslations('tripPlanner.delete');
  const [asking, setAsking] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  // Back on the action after „Behalten“, not after the first render.
  const returning = useRef(false);
  const question = useId();

  useEffect(() => {
    if (asking) keep.current?.focus();
    else if (returning.current) {
      returning.current = false;
      opener.current?.focus();
    }
  }, [asking]);

  const close = () => {
    returning.current = true;
    setAsking(false);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    close();
  };

  if (asking) {
    return (
      <div
        role="group"
        aria-labelledby={question}
        onKeyDown={onKeyDown}
        className={cn('flex flex-col gap-2 transition-opacity starting:opacity-0', className)}
        data-plan-delete="asking"
      >
        <p id={question} className="text-foreground">
          {t('confirm')}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" size="sm" onClick={() => deleteTrip(region, from)}>
            <Trash2 aria-hidden="true" />
            {t('yes')}
          </Button>
          <Button ref={keep} variant="outline" size="sm" onClick={close}>
            {t('no')}
          </Button>
        </div>
      </div>
    );
  }
  return (
    <p className={className} data-plan-delete="">
      {children}
      {children ? ' ' : null}
      <button
        ref={opener}
        type="button"
        onClick={() => setAsking(true)}
        className="text-destructive focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
      >
        <Trash2 aria-hidden="true" className="size-3.5 shrink-0" />
        {t('action')}
      </button>
    </p>
  );
}

/**
 * The line after „Löschen“: „Deine Reise vom 3.–9. Dez. ist gelöscht.“ and „Rückgängig“, for a
 * few seconds (`UNDO_MS`), then the trip's copy goes and nothing of it is kept. Always mounted, so
 * the live region exists before it speaks; the focus moves to „Rückgängig“ (the button pressed is
 * gone with the plan), and stays on the line once it ends. The hub's head draws it in the cell of
 * its note, so the note's height holds it and its end moves nothing.
 */
export function PlanDeleteStatus({ region, className }: { region: string; className?: string }) {
  const t = useTranslations('tripPlanner');
  const locale = useLocale();
  const now = useSyncExternalStore(subscribe, deletedNow, noneOnServer);
  const shown = now?.region === region ? now : null;
  const root = useRef<HTMLDivElement>(null);
  const undo = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (shown) undo.current?.focus();
    else if (keepFocus) {
      keepFocus = false;
      root.current?.focus({ preventScroll: true });
    }
  }, [shown]);

  return (
    <div
      ref={root}
      role="status"
      tabIndex={-1}
      // Laid over the note it shares a cell with: only its line takes a press.
      className={cn('pointer-events-none outline-none', className)}
      data-plan-delete-status=""
    >
      {shown && (
        <p className="pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-1 transition-opacity starting:opacity-0">
          <span>
            {shown.dates
              ? t('delete.done', {
                  range: formatDateRange(shown.dates.from, shown.dates.to, locale),
                })
              : null}
          </span>
          <button
            ref={undo}
            type="button"
            onClick={() => settle(true)}
            className="text-primary-ink focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            <Undo2 aria-hidden="true" className="size-3.5 shrink-0" />
            {t('edit.undo')}
          </button>
        </p>
      )}
    </div>
  );
}
