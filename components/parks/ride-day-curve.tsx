'use client';

import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { roundWaitDeltaTo5 } from '@/lib/utils/wait-time';
import {
  axisHours as axisHoursOf,
  bandPath as buildBandPath,
  linePath as buildLinePath,
  makeScales,
  gridValues as gridValuesOf,
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

/** A highlighted window on the day curve, such as rope drop or the last hour. */
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
   * Which end of the day this is. The two windows answer different questions, so they get different
   * colours: opening takes `--crowd-very-low`, the crowd scale's quiet teal; closing takes
   * `--primary`, stable in both themes and claiming no crowd level. Not `--chart-3`, which turns
   * amber, the busy colour, in the dark theme.
   */
  which: 'opening' | 'closing';
}

/** Props of the ride day curve. */
export interface RideDayCurveProps {
  /** Ride name, shown as the card's title. */
  title: string;
  /** Line under the title — what the curve is measured against. */
  subtitle?: string;
  /**
   * Park-local hours the curve has points for, ascending, straight from the payload, so a park that
   * opens at 11 starts at 11.
   */
  hours: number[];
  /** Median wait per hour. Positional against {@link hours}; `null` is a gap, not a zero. */
  p50: Array<number | null>;
  /** Busy-hour wait per hour, same alignment. Draws the upper edge of the band. */
  p90: Array<number | null>;
  /**
   * Lower edge of the spread band (P25), aligned with {@link hours}. Optional: an older API sends
   * none, and the fill then runs median-to-busy with a legend that says so, rather than a band with
   * an invented floor.
   */
  p25?: Array<number | null> | null;
  /**
   * What the ride has actually shown today, positional against {@link hours}.
   * `null` for an hour not yet reached, or one it reported nothing in.
   */
  today?: Array<number | null> | null;
  /**
   * What the model said for each hour before it happened, aligned with {@link hours}. Drawn only
   * where {@link today} has a reading, the one place it adds something: prediction against outcome.
   * Past the last measurement the forecast line already carries the model's opinion.
   */
  predicted?: Array<number | null> | null;
  /** IANA zone of the park, for the clock in the header. */
  timezone?: string;
  /**
   * What the model expects for the hours still to come, same alignment.
   *
   * Never overlaps {@link today}: the endpoint nulls a forecast hour once it has
   * been measured, so the two draw one continuous line — solid where it happened,
   * dashed where it has not.
   */
  forecast?: Array<number | null> | null;
  /**
   * The ride's own mean absolute error, in minutes; the forecast tunnel is
   * `forecast ± forecastError`. Constant width on purpose: the horizon adds a roughly fixed amount
   * to every band, so a cone scaled from this figure would be wrong at both ends. See
   * `RideDayCurve.forecastError` in lib/api/types.ts.
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
    /** Legend for the line showing what the model said before the hour happened. */
    predicted?: string;
    /** Names what the numbers are, once, above the plot: "Wartezeit in Min." */
    axisLabel?: string;
    /** Marks the end of the measured line: "jetzt". */
    nowMarker?: string;
    /** Row in the readout: "gegenüber Median". */
    vsMedian?: string;
    /** Suffix after the park's local clock, e.g. "Ortszeit". */
    localTime?: string;
    /** The ride reported a wait time in the current hour. */
    stateLive?: string;
    /** Inside the usual operating hours, but nothing measured this hour. */
    stateQuiet?: string;
    /** The park's usual day has not started, or is over. */
    stateClosed?: string;
  };
  className?: string;
}

/**
 * A ride's day: today against what the ride normally does, with the spread it normally does it in.
 * The good windows are drawn on the plot, since the chart answers "when do I walk over there". Pure
 * SVG from props, no fetch, so it renders on the server and needs no attraction payload.
 *
 * Load-bearing geometry: the box takes the viewBox's own ratio (`aspect-[720/200]`), because a
 * fixed height letterboxes on a phone and a non-uniform scale distorts the shape. Both axes are
 * HTML placed at the SVG's own coordinates, since in-SVG text shrinks with the viewBox and
 * `justify-between` misplaces unevenly spaced ticks. Gaps (`null`) break the path; a line across
 * the hole would be an invented measurement.
 */
export function RideDayCurve({
  title,
  subtitle,
  hours,
  p50,
  p90,
  p25,
  today,
  predicted,
  timezone,
  forecast,
  forecastError,
  windows = [],
  labels,
  className,
}: RideDayCurveProps) {
  // Every hook sits above the two early returns below: a chart with fewer than
  // two hours, or with nothing to plot, still has to call them in the same order.
  /**
   * The park's own clock, and what the ride is doing on it, so a chart with no measured line reads
   * as a park asleep rather than a broken site. "Closed" is never inferred from a missing
   * measurement alone, only from the clock being outside the hours the park is ever open.
   */
  const clock = useMemo(() => {
    if (!timezone) return null;
    const parts = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    }).formatToParts(new Date());
    const hh = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const mm = parts.find((p) => p.type === 'minute')?.value ?? '00';
    const hour = Number(hh);
    const inDay = hours.length > 0 && hour >= hours[0] && hour <= hours[hours.length - 1];
    const idx = hours.indexOf(hour);
    const measuringNow = inDay && idx >= 0 && today?.[idx] != null;
    return {
      time: `${hh}:${mm}`,
      state: !inDay ? 'closed' : measuringNow ? 'live' : 'quiet',
    } as const;
  }, [timezone, hours, today]);

  /** Which hour the pointer is over, as an index into `hours`. */
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);

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
  // Only where today has an outcome to compare against — see the prop's docblock.
  const predictedOverMeasured =
    predicted && today ? predicted.map((v, i) => (today[i] == null ? null : v)) : null;
  const predictedLine = predictedOverMeasured
    ? buildLinePath(hours, predictedOverMeasured, x, y)
    : '';
  const forecastLine = forecast ? buildLinePath(hours, forecast, x, y) : '';

  /**
   * The last measured hour and the first forecast hour. The two series meet without overlapping, so
   * without a joining stub the chart has a one-hour hole at "now"; the stub is dashed, as part of
   * the forecast.
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
   * What the chart says, for somebody who cannot see it: `role="img"` hides the subtree, so the
   * label carries the peak and the marked windows, the two things a sighted reader takes away.
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

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = plotRef.current;
    if (!el || hours.length === 0) return;
    const rect = el.getBoundingClientRect();
    // The pointer is in CSS pixels, the scales are in viewBox units — convert
    // once here rather than teaching the geometry about the rendered width.
    const vx = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    let best = 0;
    let bestDist = Infinity;
    hours.forEach((h, i) => {
      const d = Math.abs(x(h) - vx);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setHoverIndex(best);
  };

  const hover =
    hoverIndex != null && hours[hoverIndex] != null
      ? {
          hour: hours[hoverIndex],
          hx: x(hours[hoverIndex]),
          rows: [
            { key: 'today', value: today?.[hoverIndex] ?? null, label: labels.today },
            { key: 'forecast', value: forecast?.[hoverIndex] ?? null, label: labels.forecast },
            {
              key: 'predicted',
              value: predictedOverMeasured?.[hoverIndex] ?? null,
              label: labels.predicted ?? '',
            },
            { key: 'median', value: p50[hoverIndex] ?? null, label: labels.median },
          ].filter((r) => r.value != null && r.label),
          // The number nobody can do in their head while reading a chart, and
          // the one the whole card is about. A DIFFERENCE, so it goes through
          // `roundWaitDeltaTo5` — `roundWaitTo5` floors everything under 2.5 to
          // zero, which would delete every small improvement.
          delta:
            today?.[hoverIndex] != null && p50[hoverIndex] != null && labels.vsMedian
              ? roundWaitDeltaTo5((today[hoverIndex] as number) - (p50[hoverIndex] as number))
              : null,
        }
      : null;

  const gridValues = gridValuesOf(yMax);
  const ticks = axisHoursOf(hours);

  return (
    <figure className={cn('border-border bg-card/55 m-0 rounded-2xl border p-4 sm:p-5', className)}>
      <figcaption className="mb-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-lg font-bold">{title}</h3>
          {subtitle && <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>}
          {clock && (
            <p className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="tabular-nums">
                {clock.time}
                {labels.localTime ? ` ${labels.localTime}` : ''}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-[7px] shrink-0 rounded-full',
                    clock.state === 'live'
                      ? 'bg-status-operating'
                      : clock.state === 'quiet'
                        ? 'bg-crowd-moderate'
                        : 'bg-muted-foreground/50'
                  )}
                />
                {clock.state === 'live'
                  ? labels.stateLive
                  : clock.state === 'quiet'
                    ? labels.stateQuiet
                    : labels.stateClosed}
              </span>
            </p>
          )}
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
          {predictedLine && labels.predicted && (
            <li className="flex items-center gap-2">
              <span className="border-status-operating/45 w-4 shrink-0 border-t-2 border-dotted" />
              {labels.predicted}
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

      {labels.axisLabel && (
        <p className="text-muted-foreground mb-1 ml-11 text-[11px]">{labels.axisLabel}</p>
      )}

      <div
        ref={plotRef}
        // `ml-11` opens a gutter for the Y labels, which inside the plot all landed on the curve or
        // a window. The pointer maths reads this element's own box, so the hover moves with the
        // plot.
        className="relative ml-11"
        onPointerMove={onPointer}
        onPointerLeave={() => setHoverIndex(null)}
      >
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
              // A soft field, not a dashed box: these mark where to look and must not compete with
              // the curve.
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

          {predictedLine && (
            // Dotted and faint, under the solid line: this is what was expected,
            // and the fact on top of it is what happened.
            <path
              d={predictedLine}
              fill="none"
              className="stroke-status-operating/45"
              strokeWidth={2}
              strokeDasharray="2 4"
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
          {nowPoint && labels.nowMarker && (
            // Without it the measured line just stops while the median runs on,
            // and that reads as missing data rather than as "this is how far
            // today has got". Flipped to the left once the dot is near the right
            // edge, where the text would otherwise be clipped by the viewBox.
            <text
              x={nowPoint.x + (nowPoint.x > VIEW_W * 0.8 ? -9 : 9)}
              y={nowPoint.y - 8}
              textAnchor={nowPoint.x > VIEW_W * 0.8 ? 'end' : 'start'}
              className="fill-status-operating text-[13px] font-semibold"
            >
              {labels.nowMarker}
            </text>
          )}

          {hover && (
            <line
              x1={hover.hx}
              x2={hover.hx}
              y1={PAD_T}
              y2={VIEW_H - PAD_B}
              className="stroke-foreground/25"
              strokeWidth={1}
            />
          )}
        </svg>

        {/* Readout. Positioned in percent so it tracks the guide at any width,
            and flipped to the left half once the guide passes the middle, or it
            hangs off the card on the last hours of the day. */}
        {hover && hover.rows.length > 0 && (
          <div
            aria-hidden="true"
            className="border-border bg-popover/95 pointer-events-none absolute top-0 z-10 rounded-lg border px-2.5 py-1.5 text-[11px] shadow-lg backdrop-blur-sm"
            style={
              (hover.hx / VIEW_W) * 100 > 55
                ? { right: `${100 - (hover.hx / VIEW_W) * 100}%`, marginRight: 8 }
                : { left: `${(hover.hx / VIEW_W) * 100}%`, marginLeft: 8 }
            }
          >
            <div className="font-semibold tabular-nums">
              {String(hover.hour).padStart(2, '0')}:00
            </div>
            {hover.rows.map((r) => (
              <div key={r.key} className="text-muted-foreground mt-0.5 flex items-center gap-2">
                <span className="truncate">{r.label}</span>
                <span className="text-foreground ml-auto font-semibold tabular-nums">
                  {r.value} {labels.minutes}
                </span>
              </div>
            ))}
            {hover.delta != null && labels.vsMedian && (
              <div className="border-border/60 text-muted-foreground mt-1.5 flex items-center gap-2 border-t pt-1.5">
                <span className="truncate">{labels.vsMedian}</span>
                <span
                  className={cn(
                    'ml-auto font-semibold tabular-nums',
                    hover.delta < 0 ? 'text-status-operating' : 'text-foreground'
                  )}
                >
                  {hover.delta > 0 ? '+' : ''}
                  {hover.delta} {labels.minutes}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Y labels, in the gutter to the left of the plot and centred on their
            own gridline. HTML rather than `<text>`, so 11 px stays 11 px at
            every width. No unit per label — `axisLabel` says it once above. */}
        {gridValues.map((v) => (
          <span
            key={v}
            aria-hidden="true"
            className="text-muted-foreground absolute mr-2 text-[11px] tabular-nums"
            style={{
              right: '100%',
              top: `${(y(v) / VIEW_H) * 100}%`,
              transform: 'translateY(-50%)',
            }}
          >
            {Math.round(v)}
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
