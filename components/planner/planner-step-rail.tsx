'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * How far a connector stops short of a circle's centre, in pixels.
 *
 * The mark is `size-6`, so 12 is its radius and the rest is air. `top-[23px]`
 * on the lines is the same measurement vertically: 12 px of the row's own
 * padding plus that radius, less half the line.
 */
const RAIL_DOT_CLEARANCE = 18;

/**
 * Where a stepped dialog is, in circles.
 *
 * One component for both of the planner's assistants — the wizard that opens a
 * day and the fit assistant that rescues one — because the alternative was the
 * second one carrying a copy of geometry the first had already got wrong once.
 * A step is a `{ key, label }` pair rather than a translation key, so the two
 * callers name their own steps in their own part of the namespace and this file
 * knows nothing about either.
 *
 * A step already walked is a button back to it; the one in front is not, which
 * is the whole rule — a rail that lets somebody jump forward past the question
 * that gates the next screen is a rail that has to re-derive every gate.
 */
export function PlannerStepRail({
  steps,
  current,
  label,
  onJump,
}: {
  steps: readonly { key: string; label: string }[];
  current: number;
  /** What the rail as a whole is, for a screen reader. */
  label: string;
  onJump: (index: number) => void;
}) {
  const count = steps.length;

  return (
    <div className="border-border/60 shrink-0 border-b px-5 pt-3 pb-2.5 sm:px-6">
      {/* EQUAL columns, and the connectors measured off them. The first version
          was a flex row where each step's connector took the space its own
          label did not, so three circles whose labels are "Park", "Tag" and
          "Wer kommt mit" came out at 15 %, 72 % and 92 % of the row with one
          connector eleven times the length of the other — a progress bar that
          reported the width of its own captions. */}
      <ol
        className="relative grid"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
        aria-label={label}
      >
        {/* One line per GAP rather than one track behind the circles: two of the
            three circle states are a translucent tint, and a line under those
            shows through the middle of the mark. `RAIL_DOT_CLEARANCE` is the
            circle's radius plus a little air. */}
        {steps.slice(0, -1).map((step, gap) => (
          <span
            key={`gap-${step.key}`}
            aria-hidden="true"
            className={cn(
              'absolute top-[23px] h-px',
              gap < current ? 'bg-primary/60' : 'bg-border'
            )}
            style={{
              left: `calc(${(((gap + 0.5) / count) * 100).toFixed(4)}% + ${RAIL_DOT_CLEARANCE}px)`,
              right: `calc(${((1 - (gap + 1.5) / count) * 100).toFixed(4)}% + ${RAIL_DOT_CLEARANCE}px)`,
            }}
          />
        ))}

        {steps.map((step, i) => {
          const done = i < current;
          const now = i === current;

          return (
            <li key={step.key} className="flex min-w-0 justify-center">
              <button
                type="button"
                onClick={() => onJump(i)}
                disabled={!done}
                aria-current={now ? 'step' : undefined}
                className={cn(
                  'flex max-w-full min-w-0 flex-col items-center gap-1 rounded-lg px-1.5 py-0.5 transition-colors',
                  done ? 'hover:bg-accent cursor-pointer' : 'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium tabular-nums transition-colors',
                    done && 'bg-primary/15 border-primary/40 text-primary',
                    now && 'bg-primary text-primary-foreground border-primary',
                    !done && !now && 'border-border text-muted-foreground/70'
                  )}
                >
                  {done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                </span>
                <span
                  className={cn(
                    'max-w-full truncate text-[10px] leading-tight sm:text-[11px]',
                    now ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
