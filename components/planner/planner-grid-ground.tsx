'use client';

import { cn } from '@/lib/utils';
import { heightFor, yFor, type DayGrid } from '@/lib/planner/day-grid';

interface PlannerGridGroundProps {
  grid: DayGrid;
  /** Show half-hour hairlines. A container query decides; the parent passes the answer. */
  dense?: boolean;
  loading?: boolean;
}

/**
 * The ground the day grid stands on.
 *
 * Four layers, `aria-hidden`, no pointer events, and not one `dark:` utility:
 * every colour is a token, and the token is what flips. The crowd palette is not
 * symmetric between the themes, which is why `park-calendar-day` carries no
 * `dark:` on its tinted tile either.
 *
 * There were five. The fifth was a 4 px "rush strip" at the canvas's left edge
 * whose opacity was how busy each hour typically is — a shape, never a level.
 * It gave way to the WEATHER RAIL, which answers a question a plan cannot
 * otherwise answer at all: the rush was already legible from the blocks
 * themselves, since every one of them is drawn at the height of its own queue
 * and tinted by it, while nothing on this grid said it would be raining at two.
 *
 * The whole canvas starts as "the park is shut" and the operating band is
 * painted back over it. That way the closed hours are a positive statement
 * rather than the absence of one, and a reader can see at a glance how much of
 * the axis is a place they can be.
 */
export function PlannerGridGround({
  grid,
  dense = false,
  loading = false,
}: PlannerGridGroundProps) {
  const bandTop = yFor(grid, grid.openMin);
  const bandHeight = heightFor(grid, grid.closeMin - grid.openMin);

  const hours: number[] = [];
  for (let h = Math.ceil(grid.openMin / 60); h * 60 <= grid.closeMin; h++) hours.push(h);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* L0 — the ground: shut, until told otherwise. */}
      <div className="bg-muted/25 absolute inset-0" />

      {/* L1 — the operating band. The weather chart's own class string with its
          border rotated, so a reader who has met the weather card recognises the
          shape. `/[0.06]` rather than that chart's `/[0.07]`: a dozen crowd
          tints sit on top of this one and stopped separating from it at .07. */}
      <div
        className={cn(
          'absolute inset-x-0 border-y border-dashed',
          loading ? 'bg-muted/20 border-border/40' : 'border-primary/40 bg-primary/[0.06]'
        )}
        style={{ top: bandTop, height: bandHeight }}
      />

      {/* L2 — the truncation feather, and it sits BELOW the band rather than
          inside its last hour. The API reports the hour the closing time falls
          in, so `closeMin` is the park's own closing minute on the 86 % of
          operating days that end on the hour (3,046 of 3,540 measured across
          the catalogue) and the earliest it can close on the other 14 %, which
          close at half past or quarter to. The uncertainty therefore points
          DOWN — the park may still be open up to an hour past the band — where
          the feather used to hatch the last hour of the band, an hour that is
          certainly open. Nothing is planned in here (see `DayGrid.closeMin`); a
          drag may still reach it, because the person dragging knows their park.
          When the backend sends a real minute `closeSlackMin` goes to zero and
          this disappears. */}
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

      {/* L3 — hour rules, inside the band only. The ladder stopping at a labelled
          dashed line is one of the ways a reader is told that the region below
          it is not a place they can plan into. */}
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
