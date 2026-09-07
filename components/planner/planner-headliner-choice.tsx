'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Crown } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PlannerRideThumb } from './planner-ride-thumb';
import type { PlanDayRide } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface PlannerHeadlinerChoiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Every headliner the day does not have yet, in the order they are offered. */
  rides: readonly PlanDayRide[];
  /** How many of them the day has room for. */
  fits: number;
  /** The ones the optimiser gives up if nobody says otherwise. */
  wouldDrop: ReadonlySet<string>;
  /** The visitor's answer: the slugs to plan, in the order they are listed. */
  onConfirm: (slugs: string[]) => void;
}

/**
 * Which headliners matter, asked once, when the day cannot hold them all.
 *
 * Phantasialand has ten and a nine-hour Saturday: with a lunch break in it the
 * day holds nine of them, so one is going to be missing whatever anybody does.
 * The optimiser used to make that call silently and made it badly — the tie
 * fell through to queued minutes, which drops the longest queue, which is the
 * ride most people are there for. On 2026-09-12 it gave up **F.L.Y. and Taron**
 * and kept both Winja's, over a margin of five minutes.
 *
 * The engine no longer chooses that way (`Candidate.dropWeight`), and choosing
 * better is still choosing FOR somebody. So where it is tight this asks, and the
 * question is the short one: everything is ticked, the rides that will not make
 * it are marked, and untick whatever you would rather give up. Pressing on
 * without touching anything is the engine's own answer, which is what "default
 * all on" has to mean if the dialog is not to be a toll gate.
 *
 * **It only opens when it has to.** A day that holds every headliner never sees
 * it — that is the common case, and a dialog on the way to a button that would
 * have done the right thing is a dialog people learn to dismiss.
 *
 * The peak is shown per ride because it is the figure the decision turns on:
 * "Spitze 60 Min." is what a headliner costs the afternoon, and it is the same
 * number the engine ranks by when nobody says anything. It is a forecast for
 * this day, not a fact about the ride, which is why the row prints it beside the
 * name rather than as a badge that could pass for a live wait.
 */
export function PlannerHeadlinerChoice({
  open,
  onOpenChange,
  rides,
  fits,
  wouldDrop,
  onConfirm,
}: PlannerHeadlinerChoiceProps) {
  const t = useTranslations('planner');
  /**
   * Every ride ticked, which is what the question opens on.
   *
   * Initialised at MOUNT and never reset by an effect: the call site gives this
   * component a `key` that changes on every press, so each conflict is a fresh
   * mount with a fresh answer. An effect watching `open` would be the same
   * thing written as a cascading render, and would still have to guard against
   * inheriting the previous day's slugs.
   */
  const [chosen, setChosen] = useState<ReadonlySet<string>>(
    () => new Set(rides.map((ride) => ride.attractionSlug))
  );

  const count = useMemo(
    () => rides.filter((ride) => chosen.has(ride.attractionSlug)).length,
    [rides, chosen]
  );

  const toggle = (slug: string) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Crown}
      title={t('optimize.choiceTitle')}
      description={t('optimize.choiceBody', { fits, total: rides.length })}
      confirmLabel={t('optimize.choiceConfirm', { count })}
      cancelLabel={t('cancel')}
      confirmDisabled={count === 0}
      onConfirm={() =>
        onConfirm(rides.filter((ride) => chosen.has(ride.attractionSlug)).map((r) => r.attractionSlug))
      }
    >
      <ul data-planner-headliner-choice="" className="flex flex-col gap-0.5">
        {rides.map((ride) => {
          const ticked = chosen.has(ride.attractionSlug);
          return (
            <li key={ride.attractionSlug}>
              {/* A `<label>` around the whole row, so the name and the photo are
                  part of the hit area. Ten rides at 20 px of checkbox each is a
                  target list nobody wants on a phone. */}
              <label
                data-planner-headliner-row={ride.attractionSlug}
                className={cn(
                  'hover:bg-accent/60 flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 transition-colors max-sm:py-2.5',
                  !ticked && 'opacity-55'
                )}
              >
                <input
                  type="checkbox"
                  checked={ticked}
                  onChange={() => toggle(ride.attractionSlug)}
                  className="accent-primary size-4 shrink-0"
                />
                <PlannerRideThumb
                  src={ride.backgroundImage}
                  position={ride.backgroundPosition}
                  size={8}
                />
                <span className="min-w-0 flex-1 truncate text-sm">{ride.attractionName}</span>
                {/* Which ones will not make it, on the rides themselves. The
                    sentence above says how many fit; this says which, and that
                    is the difference between a number and a decision somebody
                    can act on. */}
                {wouldDrop.has(ride.attractionSlug) && (
                  <span className="bg-crowd-high/15 text-crowd-high shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                    {t('optimize.choiceDrops')}
                  </span>
                )}
                {typeof ride.dayPeak === 'number' && ride.dayPeak > 0 && (
                  <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                    {t('optimize.choicePeak', { minutes: ride.dayPeak })}
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </ConfirmDialog>
  );
}
