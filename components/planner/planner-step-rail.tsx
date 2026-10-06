'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * How far a connector stops short of a circle's centre, in pixels: the `size-6` mark's 12 px radius
 * plus air. `top-[23px]` on the lines is the same measurement vertically: 12 px of padding plus
 * that radius, less half the line.
 */
const RAIL_DOT_CLEARANCE = 18;

/**
 * Which way a stepped dialog's step slides in from, keyed by `String(forward)`: literal class
 * strings, since Tailwind's scanner never sees a templated one.
 */
export const STEP_MOTION: Record<string, string> = {
  true: 'motion-safe:slide-in-from-right-4 motion-safe:fade-in-0 motion-safe:duration-200',
  false: 'motion-safe:slide-in-from-left-4 motion-safe:fade-in-0 motion-safe:duration-200',
};

/**
 * Where a stepped dialog is, in circles: one rail for the wizard and the fit assistant, so the
 * geometry is written once. Steps are `{ key, label }` pairs named by each caller. A walked step is
 * a button back to it; the one ahead is not, so no gate has to be re-derived.
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
      {/* Equal columns, with the connectors measured off them, so the circles do not sit wherever
          their labels' widths push them. */}
      <ol
        className="relative grid"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
        aria-label={label}
      >
        {/* One line per gap rather than a track behind the circles, which would show through the
            translucent circle states. */}
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
