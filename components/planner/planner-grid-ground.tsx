'use client';

import { cn } from '@/lib/utils';
import { heightFor, yFor, type DayGrid } from '@/lib/planner/day-grid';

interface PlannerGridGroundProps {
  grid: DayGrid;
  /** Median share of each hour's peak, keyed by park-local hour. Shape, never a level. */
  rushByHour?: Map<number, number>;
  /** Show half-hour hairlines. A container query decides; the parent passes the answer. */
  dense?: boolean;
  loading?: boolean;
}

/**
 * The ground the day grid stands on.
 *
 * Five layers, `aria-hidden`, no pointer events, and not one `dark:` utility:
 * every colour is a token, and the token is what flips. The crowd palette is not
 * symmetric between the themes, which is why `park-calendar-day` carries no
 * `dark:` on its tinted tile either.
 *
 * The whole canvas starts as "the park is shut" and the operating band is
 * painted back over it. That way the closed hours are a positive statement
 * rather than the absence of one, and a reader can see at a glance how much of
 * the axis is a place they can be.
 */
export function PlannerGridGround({
  grid,
  rushByHour,
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

      {/* L2 — the truncation feather. The API formats hours as "HH", so a park
          closing at 20:30 reports 20 — about one operating day in seven closes
          off the hour. The last hour of the band is therefore drawn as uncertain
          rather than asserted, which is the same grammar the bar's soft edge
          already speaks. When the backend sends a real minute this height goes
          to zero and the border hardens. */}
      {grid.closeIsTruncated && !loading && (
        <div
          className="absolute inset-x-0 opacity-25"
          style={{
            top: yFor(grid, grid.closeMin - 60),
            height: heightFor(grid, 60),
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

      {/* L4 — the rush strip: a 4 px column whose opacity is how busy each hour
          typically is, relative to the day's own peak. It is a SHAPE and never a
          level — no figure anywhere, and deliberately not the crowd palette,
          whose colours carry level semantics this must not borrow. It is the one
          element that helps a visitor CHOOSE an hour rather than judging the one
          they already chose. */}
      {!loading && rushByHour && rushByHour.size > 0 && (
        <div className="absolute inset-y-0 left-0 w-1">
          {hours.slice(0, -1).map((hour) => (
            <div
              key={`rush-${hour}`}
              className="bg-primary absolute inset-x-0"
              style={{
                top: yFor(grid, hour * 60),
                height: heightFor(grid, 60),
                opacity: 0.06 + 0.3 * (rushByHour.get(hour) ?? 0),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
