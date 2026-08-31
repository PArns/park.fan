import { cn } from '@/lib/utils';
import {
  axisHours as axisHoursOf,
  bandPath as buildBandPath,
  linePath as buildLinePath,
  makeScales,
  niceMax,
  peakOf,
  PAD_L,
  PAD_R,
  PAD_T,
  PAD_B,
  VIEW_H,
  VIEW_W,
} from '@/lib/utils/ride-day-curve-geometry';

/** Last index matching the predicate, without needing the ES2023 lib. */
function findLastIndex<T>(items: T[], predicate: (item: T) => boolean): number {
  for (let i = items.length - 1; i >= 0; i--) if (predicate(items[i])) return i;
  return -1;
}

export interface DayCurveWindow {
  /** Label above the window, e.g. "Guter Start". */
  label: string;
  /** The time range, formatted by the caller. */
  range: string;
  /** The wait to expect across it, formatted by the caller. */
  wait: string;
  /** Window bounds as park-local hours (may be fractional: 10.5 = 10:30). */
  fromHour: number;
  toHour: number;
  /**
   * Which end of the day this is.
   *
   * The two windows answer different questions — "when is a good time to start"
   * and "what does the end of the day look like" — so they are not drawn as one
   * repeated mark in one colour.
   *
   * Opening takes `--crowd-very-low`, the teal the crowd scale already uses for a
   * quiet queue. Closing takes `--primary`, which is stable in both themes and
   * claims no crowd level.
   *
   * NOT `--chart-2`/`--chart-3`, which was the first attempt: those two are
   * shadcn defaults whose light and dark values are unrelated hues, and
   * `--chart-3` flips from deep blue to AMBER in the dark theme — the colour this
   * app's crowd scale spends on a busy queue. A quiet evening marked in amber
   * says the opposite of what it means.
   */
  which: 'opening' | 'closing';
}

export interface RideDayCurveProps {
  /** Ride name, shown as the card's title. */
  title: string;
  /** Line under the title — what the curve is measured against. */
  subtitle?: string;
  /**
   * Park-local hours the curve has points for, ascending. Comes straight from
   * `/stats/hourly`, so a park that opens at 11 starts at 11: nothing here
   * assumes a nine-to-eight day.
   */
  hours: number[];
  /** Median wait per hour. Positional against {@link hours}; `null` is a gap, not a zero. */
  p50: Array<number | null>;
  /** Busy-hour wait per hour, same alignment. Draws the upper edge of the band. */
  p90: Array<number | null>;
  /**
   * Lower edge of the spread band (P25), aligned with {@link hours}.
   *
   * Optional, and the fallback is the point: `/stats/hourly` grew this row in
   * schema v4, so an API still answering v3 sends none. Rather than draw a band
   * with an invented floor, the fill then runs median-to-busy and the legend
   * says which of the two it is — a P50–P90 band labelled "P25–P90" would be a
   * claim about the quiet quarter of days that nothing measured.
   */
  p25?: Array<number | null> | null;
  /**
   * What the ride has actually shown today, positional against {@link hours}.
   * `null` for an hour not yet reached, or one it reported nothing in.
   */
  today?: Array<number | null> | null;
  /**
   * What the model expects for the hours still to come, same alignment.
   *
   * Never overlaps {@link today}: the endpoint nulls a forecast hour once it has
   * been measured, so the two draw one continuous line — solid where it happened,
   * dashed where it has not.
   */
  forecast?: Array<number | null> | null;
  /**
   * The ride's own mean absolute error, in minutes. Draws the forecast tunnel as
   * `forecast ± forecastError`.
   *
   * Constant width on purpose. It is a measured, published figure; fanning it out
   * with the horizon would look more like a forecast cone and would be an
   * uncertainty model nothing here has measured.
   */
  forecastError?: number | null;
  /** Highlighted windows — rope drop, the last hour. */
  windows?: DayCurveWindow[];
  labels: {
    today: string;
    median: string;
    /** Shown when {@link p25} is present: the full P25–P90 spread. */
    band: string;
    /** Shown when it is not: the median-to-busy half. */
    bandUpperOnly: string;
    /** Legend for the forecast line. */
    forecast: string;
    /** Legend for the forecast tunnel, e.g. "Prognose ±7 Min." */
    forecastBand: string;
    minutes: string;
    /** Screen-reader only: "busiest around" — prefixes the peak in the summary. */
    peakAt: string;
  };
  className?: string;
}

/**
 * A ride's day: today against what the ride normally does, with the spread it
 * normally does it in.
 *
 * The chart answers a positional question ("when do I walk over there"), so the
 * two good windows are drawn ON the plot rather than listed beside it — a reader
 * comparing a time to a curve should not have to hold a range in their head.
 *
 * Server-compatible: pure SVG, no hooks, no measurement. It takes its data as
 * props rather than fetching, so a ride page that already holds the attraction
 * payload can pass `today` and a marketing surface can render the median alone
 * without buying a 53 KB attraction response for one line.
 *
 * Geometry notes that are load-bearing:
 * - The box is given the viewBox's own ratio (`aspect-[720/200]`) rather than a
 *   fixed height. `preserveAspectRatio` then has nothing to correct: with a
 *   fixed `h-[200px]` the 720×260 viewBox letterboxed to 107 px of drawing
 *   inside a 200 px box on a 360 px phone, and `preserveAspectRatio="none"` is
 *   not the fix either — the curve is read for shape, and a non-uniform scale
 *   makes the same day look flat at one width and dramatic at another. An
 *   aspect ratio is also still deterministic from the width, so it costs no CLS.
 * - Both axes are HTML positioned at the SVG's own coordinates, not `<text>` and
 *   not `justify-between`. In-SVG text scales with the viewBox and rendered at
 *   ~4.5 px on a phone; `justify-between` spaces labels evenly while `x()` places
 *   hours linearly, so every intermediate tick pointed at the wrong column
 *   whenever the tick hours were not equally spaced (a 09–20 day ticks
 *   09/12/15/18/20 — the last gap is two hours, the others three).
 * - Gaps (`null`) break the path instead of interpolating across them. A ride
 *   that reported nothing between 13:00 and 15:00 has no median there, and a
 *   straight line over the hole is an invented measurement.
 */
export function RideDayCurve({
  title,
  subtitle,
  hours,
  p50,
  p90,
  p25,
  today,
  forecast,
  forecastError,
  windows = [],
  labels,
  className,
}: RideDayCurveProps) {
  if (hours.length < 2) return null;

  const hasLowerEdge = Array.isArray(p25) && p25.some((v) => v != null);
  const err = forecastError != null && forecastError > 0 ? forecastError : 0;
  const values = [
    ...p50,
    ...p90,
    ...(p25 ?? []),
    ...(today ?? []),
    // The tunnel's top has to fit, or the band is clipped by the plot edge.
    ...(forecast ?? []).map((v) => (v == null ? null : v + err)),
  ].filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return null;
  const yMax = niceMax(Math.max(...values));
  const { x, y } = makeScales(hours, yMax);

  const todayLine = today ? buildLinePath(hours, today, x, y) : '';
  const forecastLine = forecast ? buildLinePath(hours, forecast, x, y) : '';

  /**
   * The last measured hour, and the first forecast hour.
   *
   * The two series meet but do not overlap, so without a joining segment the
   * chart shows a one-hour hole exactly at "now" — the most-looked-at point on
   * it. The stub is drawn as part of the forecast, dashed, because the half of
   * it that is a claim about the future is the forecast's.
   */
  const lastMeasured = today ? findLastIndex(today, (v) => v != null) : -1;
  const firstForecast = forecast ? forecast.findIndex((v) => v != null) : -1;
  const joinPath =
    lastMeasured >= 0 && firstForecast > lastMeasured && today && forecast
      ? `M${x(hours[lastMeasured]).toFixed(1)},${y(today[lastMeasured] as number).toFixed(1)}L${x(hours[firstForecast]).toFixed(1)},${y(forecast[firstForecast] as number).toFixed(1)}`
      : '';

  /** The forecast tunnel: the forecast line thickened by the ride's measured error. */
  const tunnelPath =
    forecast && err > 0
      ? buildBandPath(
          hours,
          forecast.map((v) => (v == null ? null : Math.max(0, v - err))),
          forecast.map((v) => (v == null ? null : v + err)),
          x,
          y
        )
      : '';

  /** Where the measured day currently ends — the marker a reader reads as "now". */
  const nowPoint =
    lastMeasured >= 0 && today
      ? { x: x(hours[lastMeasured]), y: y(today[lastMeasured] as number) }
      : null;

  /**
   * What the chart says, for somebody who cannot see it.
   *
   * `role="img"` hides the whole subtree, so without this the figure is a blank
   * to a screen reader — and the old label was the title plus a possibly-absent
   * subtitle, which described the card rather than the curve. The peak and the
   * marked windows are the two things a sighted reader takes away, so they are
   * what the label says.
   */
  const peak = peakOf(hours, p50);
  const ariaLabel = [
    title,
    subtitle,
    peak &&
      `${labels.peakAt} ${String(peak.hour).padStart(2, '0')}:00, ${peak.value} ${labels.minutes}`,
    ...windows.map((w) => `${w.label}: ${w.range}, ${w.wait}`),
  ]
    .filter(Boolean)
    .join('. ');

  const gridValues = [yMax, yMax / 2];
  const ticks = axisHoursOf(hours);

  return (
    <figure className={cn('border-border bg-card/55 m-0 rounded-2xl border p-4 sm:p-5', className)}>
      <figcaption className="mb-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-lg font-bold">{title}</h3>
          {subtitle && <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>}
        </div>
        <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
          {todayLine && (
            <li className="flex items-center gap-2">
              <span className="bg-status-operating h-0.5 w-4 shrink-0 rounded-full" />
              {labels.today}
            </li>
          )}
          {forecastLine && (
            <li className="flex items-center gap-2">
              <span className="border-status-operating/70 w-4 shrink-0 border-t-2 border-dashed" />
              {tunnelPath ? labels.forecastBand : labels.forecast}
            </li>
          )}
          <li className="flex items-center gap-2">
            <span className="border-primary w-4 shrink-0 border-t-2 border-dashed" />
            {labels.median}
          </li>
          <li className="flex items-center gap-2">
            <span className="bg-primary/25 h-2.5 w-4 shrink-0 rounded-[2px]" />
            {hasLowerEdge ? labels.band : labels.bandUpperOnly}
          </li>
        </ul>
      </figcaption>

      <div className="relative">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="aspect-[720/200] w-full"
          role="img"
          aria-label={ariaLabel}
        >
          {/* Gridlines, drawn under everything. */}
          {gridValues.map((v) => (
            <g key={v}>
              <line
                x1={PAD_L}
                x2={VIEW_W - PAD_R}
                y1={y(v)}
                y2={y(v)}
                stroke="currentColor"
                className="text-border"
                strokeDasharray="4 5"
                strokeWidth={1}
              />
            </g>
          ))}

          {/* The good windows, behind the curves so the lines stay readable over them. */}
          {windows.map((w) => (
            <rect
              key={w.which}
              x={x(w.fromHour)}
              y={PAD_T}
              width={Math.max(2, x(w.toHour) - x(w.fromHour))}
              height={VIEW_H - PAD_T - PAD_B}
              rx={10}
              // A soft field, not a dashed cage: these mark WHERE to look, and
              // the two heavy dashed boxes in the first version competed with
              // the curve they were meant to point at.
              fill={
                w.which === 'opening'
                  ? 'color-mix(in oklab, var(--color-crowd-very-low) 14%, transparent)'
                  : 'color-mix(in oklab, var(--color-primary) 10%, transparent)'
              }
            />
          ))}

          <path
            d={buildBandPath(hours, hasLowerEdge ? (p25 as Array<number | null>) : p50, p90, x, y)}
            className="fill-primary/20"
          />
          <path
            d={buildLinePath(hours, p50, x, y)}
            fill="none"
            className="stroke-primary"
            strokeWidth={2.5}
            strokeDasharray="7 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* The tunnel sits under both lines — it is context, not the answer. */}
          {tunnelPath && <path d={tunnelPath} className="fill-status-operating/15" />}

          {(forecastLine || joinPath) && (
            <path
              d={`${joinPath} ${forecastLine}`.trim()}
              fill="none"
              className="stroke-status-operating/80"
              strokeWidth={2.5}
              strokeDasharray="6 5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {todayLine && (
            <path
              d={todayLine}
              fill="none"
              className="stroke-status-operating"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {nowPoint && (
            <circle cx={nowPoint.x} cy={nowPoint.y} r={4.5} className="fill-status-operating" />
          )}
        </svg>

        {/* Y labels, over the SVG at the gridlines' own y. HTML rather than
            `<text>`, so 11 px stays 11 px at every width. */}
        {gridValues.map((v) => (
          <span
            key={v}
            aria-hidden="true"
            className="text-muted-foreground absolute text-[11px] tabular-nums"
            style={{
              left: `${((PAD_L + 2) / VIEW_W) * 100}%`,
              top: `${(y(v) / VIEW_H) * 100}%`,
              transform: 'translateY(-100%)',
            }}
          >
            {Math.round(v)} {labels.minutes}
          </span>
        ))}

        {/* Hour axis, each label centred on the x the curve actually uses. */}
        <div className="relative mt-1 h-4" aria-hidden="true">
          {ticks.map((h) => {
            const pct = (x(h) / VIEW_W) * 100;
            // The end labels are pinned rather than centred: a centred label at
            // 1 % or 99 % hangs outside the card and is clipped by its padding.
            const edge = pct < 6 ? 'start' : pct > 94 ? 'end' : 'mid';
            return (
              <span
                key={h}
                className="text-muted-foreground absolute text-[11px] tabular-nums"
                style={
                  edge === 'start'
                    ? { left: 0 }
                    : edge === 'end'
                      ? { right: 0 }
                      : { left: `${pct}%`, transform: 'translateX(-50%)' }
                }
              >
                {String(h).padStart(2, '0')}:00
              </span>
            );
          })}
        </div>
      </div>

      {windows.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {windows.map((w) => (
            <div
              key={w.which}
              className="border-border bg-card/40 rounded-xl border border-l-3 px-4 py-3"
              style={{
                borderLeftColor:
                  w.which === 'opening' ? 'var(--color-crowd-very-low)' : 'var(--color-primary)',
              }}
            >
              <div className="text-muted-foreground text-[11px] font-bold tracking-[0.1em] uppercase">
                {w.label}
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold tabular-nums">{w.range}</span>
                <span className="text-muted-foreground text-sm">{w.wait}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </figure>
  );
}
