'use client';

import { cn } from '@/lib/utils';
import { dayStartMin, heightFor, yFor, type DayGrid } from '@/lib/planner/day-grid';

interface PlannerGridGroundProps {
  grid: DayGrid;
  /** Show half-hour hairlines. A container query decides; the parent passes the answer. */
  dense?: boolean;
  loading?: boolean;
}

/**
 * The ground the day grid stands on: four layers, `aria-hidden`, no pointer events, and no `dark:`
 * utility, since every colour is a token that flips with the theme. The whole canvas starts as "the
 * park is shut" and the operating band is painted back over it, so the closed hours are a positive
 * statement.
 */
export function PlannerGridGround({
  grid,
  dense = false,
  loading = false,
}: PlannerGridGroundProps) {
  const bandTop = yFor(grid, grid.openMin);
  const bandHeight = heightFor(grid, grid.closeMin - grid.openMin);

  const hours: number[] = [];
  for (let h = Math.ceil(dayStartMin(grid) / 60); h * 60 <= grid.closeMin; h++) hours.push(h);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* L0: the ground, shut until told otherwise. */}
      <div className="bg-muted/25 absolute inset-0" />

      {/* L1: the operating band, the weather chart's class string with its border rotated, at
          `/[0.06]`, where the crowd tints on top of it still separate. */}
      <div
        className={cn(
          'absolute inset-x-0 border-y border-dashed',
          loading ? 'bg-muted/20 border-border/40' : 'border-primary/40 bg-primary/[0.06]'
        )}
        style={{ top: bandTop, height: bandHeight }}
      />

      {/* L1b: the early-entry window above the band, open for the headliners only, so in the
          band's colour at half strength with its dashed top edge. Only on a day the visitor holds
          early entry. */}
      {grid.earlyEntryOpenMin !== null && !loading && (
        <div
          data-early-entry-band=""
          className="border-primary/40 bg-primary/[0.03] absolute inset-x-0 border-t border-dashed"
          style={{
            top: yFor(grid, grid.earlyEntryOpenMin),
            height: heightFor(grid, grid.openMin - grid.earlyEntryOpenMin),
          }}
        />
      )}

      {/* L2: the truncation feather, below the band, since the park may still be open up to an
          hour past `closeMin` (the API reports the hour the closing time falls in). Nothing is
          planned here; a drag may reach it. Gone once `closeSlackMin` is zero. See
          docs/rules/the-planners-day-ends-when-the-park-closes-and-a-headliner-is.md. */}
      {grid.closeSlackMin > 0 && !loading && (
        <div
          className="absolute inset-x-0 opacity-25"
          style={{
            top: yFor(grid, grid.closeMin),
            height: heightFor(grid, grid.closeSlackMin),
            backgroundImage:
              'repeating-linear-gradient(135deg, color-mix(in oklch, var(--muted-foreground) 22%, transparent) 0 2px, transparent 2px 7px)',
          }}
        />
      )}

      {/* L3: hour rules, inside the band only, so the ladder stopping says the region below is
          not plannable. */}
      {!loading &&
        hours.map((hour) => (
          <div
            key={hour}
            className="border-border/40 absolute inset-x-0 border-t"
            style={{ top: yFor(grid, hour * 60) }}
          />
        ))}
      {!loading &&
        dense &&
        hours
          .slice(0, -1)
          .map((hour) => (
            <div
              key={`half-${hour}`}
              className="border-border/15 absolute inset-x-0 border-t"
              style={{ top: yFor(grid, hour * 60 + 30) }}
            />
          ))}
    </div>
  );
}
