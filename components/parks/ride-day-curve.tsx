import { cn } from '@/lib/utils';

export interface DayCurveWindow {
  /** Label above the window, e.g. "Rope Drop". */
  label: string;
  /** Human-readable time range plus expected wait, already formatted by the caller. */
  detail: string;
  /** Window bounds as park-local hours (may be fractional: 10.5 = 10:30). */
  fromHour: number;
  toHour: number;
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
  /** Today's measured series, if the caller already holds it. */
  today?: Array<{ hour: number; waitTime: number }> | null;
  /** Highlighted windows — rope drop, the last hour. */
  windows?: DayCurveWindow[];
  labels: {
    today: string;
    median: string;
    /** Shown when {@link p25} is present: the full P25–P90 spread. */
    band: string;
    /** Shown when it is not: the median-to-busy half. */
    bandUpperOnly: string;
    minutes: string;
  };
  className?: string;
}

const VIEW_W = 720;
const VIEW_H = 260;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 8;

/** Round a max up to a friendly gridline so the axis labels are readable numbers. */
function niceMax(value: number): number {
  if (value <= 20) return 20;
  if (value <= 50) return 50;
  if (value <= 100) return 100;
  return Math.ceil(value / 50) * 50;
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
 * - `preserveAspectRatio="none"` is deliberately NOT used. The curve is read for
 *   shape, and a non-uniform scale makes the same day look flat at one width and
 *   dramatic at another.
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
  windows = [],
  labels,
  className,
}: RideDayCurveProps) {
  if (hours.length < 2) return null;

  const firstHour = hours[0];
  const lastHour = hours[hours.length - 1];
  const span = lastHour - firstHour || 1;

  const hasLowerEdge = Array.isArray(p25) && p25.some((v) => v != null);
  const values = [...p50, ...p90, ...(p25 ?? []), ...(today?.map((d) => d.waitTime) ?? [])].filter(
    (v): v is number => typeof v === 'number'
  );
  if (values.length === 0) return null;
  const yMax = niceMax(Math.max(...values));

  const x = (hour: number) => PAD_L + ((hour - firstHour) / span) * (VIEW_W - PAD_L - PAD_R);
  const y = (value: number) => PAD_T + (1 - value / yMax) * (VIEW_H - PAD_T - PAD_B);

  /** Path for one positional series, broken at every gap. */
  const linePath = (series: Array<number | null>) => {
    let d = '';
    let open = false;
    series.forEach((value, i) => {
      if (value == null || hours[i] == null) {
        open = false;
        return;
      }
      d += `${open ? 'L' : 'M'}${x(hours[i]).toFixed(1)},${y(value).toFixed(1)} `;
      open = true;
    });
    return d.trim();
  };

  /**
   * The filled band. Built per contiguous run so a gap opens a hole rather than
   * closing the polygon across it.
   */
  const bandPath = () => {
    const lower = hasLowerEdge ? (p25 as Array<number | null>) : p50;
    let d = '';
    let run: number[] = [];
    const flush = () => {
      if (run.length < 2) {
        run = [];
        return;
      }
      const top = run.map((i) => `${x(hours[i]).toFixed(1)},${y(p90[i] as number).toFixed(1)}`);
      const bottom = [...run]
        .reverse()
        .map((i) => `${x(hours[i]).toFixed(1)},${y(lower[i] as number).toFixed(1)}`);
      d += `M${top.join('L')}L${bottom.join('L')}Z `;
      run = [];
    };
    hours.forEach((_, i) => {
      if (p90[i] == null || lower[i] == null) flush();
      else run.push(i);
    });
    flush();
    return d.trim();
  };

  const todayPath = () => {
    const points = (today ?? [])
      .filter((d) => d.hour >= firstHour && d.hour <= lastHour)
      .sort((a, b) => a.hour - b.hour);
    if (points.length < 2)
      return { d: '', last: null as null | { hour: number; waitTime: number } };
    const d = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.hour).toFixed(1)},${y(p.waitTime).toFixed(1)}`)
      .join('');
    return { d, last: points[points.length - 1] };
  };
  const todayLine = todayPath();

  const gridValues = [yMax, yMax / 2];
  const axisHours = [
    firstHour,
    ...hours.filter((h) => h !== firstHour && h !== lastHour && (h - firstHour) % 3 === 0),
    lastHour,
  ];

  return (
    <figure className={cn('border-border bg-card/55 m-0 rounded-2xl border p-4 sm:p-5', className)}>
      <figcaption className="mb-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-lg font-bold">{title}</h3>
          {subtitle && <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>}
        </div>
        <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
          {todayLine.d && (
            <li className="flex items-center gap-2">
              <span className="bg-status-operating h-0.5 w-4 shrink-0 rounded-full" />
              {labels.today}
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
          className="h-[200px] w-full sm:h-[260px]"
          role="img"
          aria-label={`${title}. ${subtitle ?? ''}`}
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
              <text
                x={PAD_L + 2}
                y={y(v) - 4}
                className="fill-muted-foreground text-[11px]"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {Math.round(v)} {labels.minutes}
              </text>
            </g>
          ))}

          {/* The good windows, behind the curves so the lines stay readable over them. */}
          {windows.map((w) => (
            <rect
              key={w.label}
              x={x(w.fromHour)}
              y={PAD_T}
              width={Math.max(2, x(w.toHour) - x(w.fromHour))}
              height={VIEW_H - PAD_T - PAD_B}
              rx={10}
              className="fill-crowd-very-low/10 stroke-crowd-very-low/40"
              strokeDasharray="5 4"
              strokeWidth={1}
            />
          ))}

          <path d={bandPath()} className="fill-primary/20" />
          <path
            d={linePath(p50)}
            fill="none"
            className="stroke-primary"
            strokeWidth={2.5}
            strokeDasharray="7 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {todayLine.d && (
            <>
              <path
                d={todayLine.d}
                fill="none"
                className="stroke-status-operating"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {todayLine.last && (
                <circle
                  cx={x(todayLine.last.hour)}
                  cy={y(todayLine.last.waitTime)}
                  r={4.5}
                  className="fill-status-operating"
                />
              )}
            </>
          )}
        </svg>

        {/* Hour axis. Out of the SVG so the labels never scale with the viewBox. */}
        <div
          className="text-muted-foreground mt-1 flex justify-between text-[11px] tabular-nums"
          aria-hidden="true"
        >
          {axisHours.map((h) => (
            <span key={h}>{String(h).padStart(2, '0')}:00</span>
          ))}
        </div>
      </div>

      {windows.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {windows.map((w) => (
            <div
              key={w.label}
              className="border-crowd-very-low/35 bg-crowd-very-low/8 rounded-xl border px-4 py-3"
            >
              <div className="text-crowd-very-low text-[11px] font-bold tracking-[0.1em] uppercase">
                {w.label}
              </div>
              <div className="mt-1 font-semibold">{w.detail}</div>
            </div>
          ))}
        </div>
      )}
    </figure>
  );
}
