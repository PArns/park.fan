'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, ExternalLink, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCount, formatShare, type TrafficDelta } from '@/lib/admin/site-analytics';
import { formatPeriodAxis, formatPeriodLong } from '@/lib/admin/traffic-range';
import { formatPlotted, type MetricUnit } from '@/lib/admin/traffic-series';
import type { SeriesInterval } from '@/lib/api/admin-site-analytics';
import { Chip, StartTruncated, type ChipTone } from './primitives';
import { Segmented } from './controls';

/**
 * Charts for the traffic dashboards, drawn as SVG and HTML without a charting library: a daily
 * line chart with a hover readout and a table view, sparklines, bar lists, a stacked share bar
 * and a shaded matrix. One series is the brand colour; several take {@link CATEGORICAL} in this
 * order and keep their colour whatever is switched off beside them.
 */

/**
 * The categorical colours in their fixed order, stepped for the admin's dark surface. The order is
 * what keeps neighbours apart for readers with a colour-vision deficiency, so a chart never
 * re-sorts or cycles them. Eleven, so each search field has a colour of its own; a slot is added
 * only after the dataviz validator passes the extended list on the dark surface.
 */
export const CATEGORICAL = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
  '#00a3c4',
  '#a8692e',
  '#b35fd0',
] as const;

const COMPACT = new Intl.NumberFormat('de-DE', { notation: 'compact', maximumFractionDigits: 1 });

/** The tone and arrow of each kind of change. */
const DELTA_VIEW: Record<TrafficDelta['direction'], { tone: ChipTone; icon: typeof Minus }> = {
  up: { tone: 'success', icon: ArrowUpRight },
  down: { tone: 'danger', icon: ArrowDownRight },
  flat: { tone: 'muted', icon: Minus },
  new: { tone: 'primary', icon: ArrowUpRight },
};

const SWAPPED_TONE: Record<ChipTone, ChipTone> = {
  success: 'danger',
  danger: 'success',
  primary: 'primary',
  warning: 'warning',
  muted: 'muted',
};

/**
 * A small pill with the arrow and percentage of a change; `title` names what it is measured
 * against. `neutral` keeps the arrow and drops the green and red, for a figure where more is not
 * better (a search that found nothing, a favorite removed).
 */
export function DeltaChip({
  delta,
  title,
  neutral = false,
  lowerIsBetter = false,
  label,
}: {
  delta: TrafficDelta;
  title?: string;
  neutral?: boolean;
  /** For a figure where a fall is the good news, such as a bounce rate: green and red swap. */
  lowerIsBetter?: boolean;
  /** Replaces the percentage, for a change told in the figure's own unit (places, percent points). */
  label?: string;
}) {
  const { tone: judged, icon: Icon } = DELTA_VIEW[delta.direction];
  const swapped = lowerIsBetter ? SWAPPED_TONE[judged] : judged;
  const tone = neutral ? 'muted' : swapped;
  const text =
    label ??
    (delta.direction === 'new'
      ? 'neu'
      : delta.direction === 'flat'
        ? 'gleich'
        : `${delta.direction === 'up' ? '+' : '−'}${delta.percent} %`);
  return (
    <Chip tone={tone} className="tabular-nums">
      <span title={title} className="inline-flex items-center gap-1">
        <Icon className="h-3 w-3" aria-hidden="true" />
        {text}
      </span>
    </Chip>
  );
}

/** A line with a faint area under it and no axes, the trend of a row or a tile. Decorative. */
export function Sparkline({
  values,
  className,
  color = 'var(--color-primary)',
}: {
  values: readonly number[];
  className?: string;
  color?: string;
}) {
  const width = 96;
  const height = 24;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => [
    index * step,
    height - 2 - (value / max) * (height - 4),
  ]);
  const line = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn('h-6 w-24 shrink-0', className)}
    >
      {points.length > 1 && (
        <path d={`${line} L${width},${height} L0,${height} Z`} fill={color} fillOpacity="0.1" />
      )}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** The width of an element, kept current with a `ResizeObserver`, so SVG text is drawn at its size. */
export function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // The observer reports once when it starts watching, so no measuring is needed here.
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/**
 * The top of the y axis and the step of the gridlines: a round figure at or above `value`, about
 * four steps up, never finer than `minStep`, since a count axis counts people and pages.
 */
export function niceScale(value: number, minStep: number): { max: number; step: number } {
  if (value <= 0) return { max: minStep * 4, step: minStep };
  const rough = value / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const candidate = [1, 2, 2.5, 5, 10].map((m) => m * power).find((c) => c >= rough) ?? rough;
  const step = Math.max(minStep, candidate);
  return { max: step * Math.ceil(value / step - 1e-9), step };
}

/** The finest gridline step of a unit: whole people, half a page, whole percents, seconds and places. */
const MIN_STEP: Record<MetricUnit, number> = {
  count: 1,
  ratio: 0.5,
  percent: 1,
  seconds: 1,
  position: 1,
};

/** One line of {@link SeriesChart}. A `null` is a period with no figure: the line breaks there. */
interface ChartSeries {
  key: string;
  label: string;
  color: string;
  values: readonly (number | null)[];
}

/**
 * Values over time as lines on one shared y axis. The first visible series carries a faint area.
 * Hovering or touching reads one period's values from a crosshair; with two or more series a
 * legend names them and, with `toggleable`, switches them on and off; a table view lists every
 * period for anybody who would rather read than point. A period the window cut off (`partial`) is
 * shaded and says so in the tooltip, since its figure is not comparable with a whole one.
 *
 * One chart is one unit: counts, a ratio, a share and a duration cannot honestly share an axis, so
 * a page that shows several makes several charts and takes the legend and the table view off
 * the ones it draws the chrome of itself (`chrome={false}`).
 */
export function SeriesChart({
  days,
  series,
  height = 220,
  toggleable = false,
  label,
  className,
  interval = 'day',
  unit = 'count',
  partial,
  chrome = true,
  gutter,
}: {
  /** The start of each period: `YYYY-MM-DD`, or an ISO timestamp for an hour. */
  days: readonly string[];
  series: readonly ChartSeries[];
  height?: number;
  /** Lets the legend hide a series, for charts of more than a few lines. */
  toggleable?: boolean;
  /** What the chart shows, for the screen reader. */
  label: string;
  className?: string;
  /** What a point stands for, which decides how its period reads. */
  interval?: SeriesInterval;
  /** What the values are counted in; for the axis step and how a value prints. */
  unit?: MetricUnit;
  /** Which periods are cut by the window. */
  partial?: readonly boolean[];
  /** Whether the chart brings its own legend and table view. */
  chrome?: boolean;
  /** The width left of the plot for the axis labels; charts stacked in one column share it. */
  gutter?: number;
}) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [hover, setHover] = useState<number | null>(null);
  const [ref, width] = useWidth<HTMLDivElement>();
  const titleId = useId();

  const visible = series.filter((line) => !hidden.has(line.key));
  const peak = Math.max(0, ...visible.flatMap((line) => line.values.map((value) => value ?? 0)));
  const { max, step } = niceScale(peak, MIN_STEP[unit]);
  const left = gutter ?? (unit === 'count' ? 44 : 60);
  const right = 10;
  const top = 10;
  const bottom = 22;
  const innerWidth = Math.max(0, width - left - right);
  const innerHeight = height - top - bottom;
  const count = days.length;
  const x = (index: number) =>
    left + (count > 1 ? (index / (count - 1)) * innerWidth : innerWidth / 2);
  const y = (value: number) => top + innerHeight - (value / max) * innerHeight;
  const halfStep = count > 1 ? innerWidth / (count - 1) / 2 : innerWidth / 2;

  const ticks = useMemo(() => {
    const list: number[] = [];
    for (let value = 0; value <= max + step / 2; value += step) list.push(value);
    return list;
  }, [max, step]);

  // About six labels along the axis, never so many that they touch.
  const labelEvery = Math.max(1, Math.ceil(count / Math.max(2, Math.floor(innerWidth / 72))));

  /** A line with a gap where a period has no figure. */
  const path = (values: readonly (number | null)[]) => {
    let pen = false;
    return values
      .map((value, index) => {
        if (value === null) {
          pen = false;
          return '';
        }
        const command = pen ? 'L' : 'M';
        pen = true;
        return `${command}${x(index).toFixed(1)},${y(value).toFixed(1)}`;
      })
      .join(' ');
  };

  const onMove = (event: React.PointerEvent<SVGRectElement>) => {
    if (count === 0) return;
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / Math.max(1, box.width);
    setHover(Math.max(0, Math.min(count - 1, Math.round(ratio * (count - 1)))));
  };

  const toggle = (key: string) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else if (series.length - next.size > 1) next.add(key);
      return next;
    });

  const printed = (value: number | null | undefined) =>
    unit === 'count'
      ? value == null
        ? '–'
        : formatCount(value)
      : formatPlotted(unit, value ?? null);
  const axisText = (tick: number) =>
    unit === 'count' ? COMPACT.format(tick) : formatPlotted(unit, tick);

  const hoverX = hover === null ? 0 : x(hover);
  const tooltipOnLeft = hover !== null && hoverX > width * 0.6;

  return (
    <div className={className}>
      {chrome && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          {series.length > 1 ? (
            <ul className="flex flex-wrap gap-x-3 gap-y-1.5" aria-label="Legende">
              {series.map((line) => {
                const off = hidden.has(line.key);
                const content = (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-0.5 w-4 shrink-0 rounded-full"
                      style={{ background: line.color, opacity: off ? 0.3 : 1 }}
                    />
                    <span className={cn(off && 'line-through opacity-60')}>{line.label}</span>
                  </>
                );
                return (
                  <li key={line.key}>
                    {toggleable ? (
                      <button
                        type="button"
                        aria-pressed={!off}
                        onClick={() => toggle(line.key)}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors max-sm:min-h-9"
                      >
                        {content}
                      </button>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        {content}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <span />
          )}
          <Segmented
            label="Darstellung"
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: 'Diagramm' },
              { value: 'table', label: 'Tabelle' },
            ]}
          />
        </div>
      )}

      {chrome && view === 'table' ? (
        <div className="border-border/50 max-h-80 overflow-auto rounded-lg border">
          <table className="w-full text-sm tabular-nums">
            <thead className="bg-card text-muted-foreground sticky top-0 text-[11px] tracking-wide uppercase">
              <tr>
                <th className="py-1.5 pl-3 text-left font-medium">Zeitraum</th>
                {series.map((line) => (
                  <th key={line.key} className="px-3 py-1.5 text-right font-medium">
                    {line.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-border/40 divide-y">
              {days.map((day, index) => (
                <tr key={day}>
                  <td className="text-muted-foreground py-1.5 pl-3">
                    {formatPeriodLong(day, interval)}
                    {partial?.[index] && (
                      <span className="ml-1.5 text-[11px]">(unvollständig)</span>
                    )}
                  </td>
                  {series.map((line) => (
                    <td key={line.key} className="px-3 py-1.5 text-right">
                      {printed(line.values[index])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={ref} className="relative" style={{ height }}>
          {width > 0 && (
            <svg
              width={width}
              height={height}
              role="img"
              aria-labelledby={titleId}
              className="block touch-pan-y select-none"
            >
              <title id={titleId}>{label}</title>
              {partial?.map(
                (cut, index) =>
                  cut && (
                    <rect
                      key={`partial-${days[index]}`}
                      x={Math.max(left, x(index) - halfStep)}
                      y={top}
                      width={
                        Math.min(width - right, x(index) + halfStep) -
                        Math.max(left, x(index) - halfStep)
                      }
                      height={innerHeight}
                      className="fill-muted-foreground/15"
                    />
                  )
              )}
              {ticks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={left}
                    x2={width - right}
                    y1={y(tick)}
                    y2={y(tick)}
                    className="stroke-border/50"
                    strokeWidth="1"
                  />
                  <text
                    x={left - 8}
                    y={y(tick)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-[10px] tabular-nums"
                  >
                    {axisText(tick)}
                  </text>
                </g>
              ))}
              {days.map(
                (day, index) =>
                  ((index % labelEvery === 0 && count - 1 - index >= labelEvery / 2) ||
                    index === count - 1) && (
                    <text
                      key={day}
                      x={x(index)}
                      y={height - 6}
                      textAnchor={index === 0 ? 'start' : index === count - 1 ? 'end' : 'middle'}
                      className="fill-muted-foreground text-[10px] tabular-nums"
                    >
                      {formatPeriodAxis(day, interval)}
                    </text>
                  )
              )}
              {visible.map((line, lineIndex) => (
                <g key={line.key}>
                  {lineIndex === 0 && count > 1 && !line.values.includes(null) && (
                    <path
                      d={`${path(line.values)} L${x(count - 1)},${y(0)} L${x(0)},${y(0)} Z`}
                      fill={line.color}
                      fillOpacity="0.1"
                    />
                  )}
                  <path
                    d={path(line.values)}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {line.values.map((value, index) =>
                    value !== null &&
                    (count === 1 ||
                      ((line.values[index - 1] ?? null) === null &&
                        (line.values[index + 1] ?? null) === null)) ? (
                      <circle key={index} cx={x(index)} cy={y(value)} r="3.5" fill={line.color} />
                    ) : null
                  )}
                </g>
              ))}
              {hover !== null && (
                <g pointerEvents="none">
                  <line
                    x1={hoverX}
                    x2={hoverX}
                    y1={top}
                    y2={top + innerHeight}
                    className="stroke-muted-foreground/60"
                    strokeWidth="1"
                  />
                  {visible.map((line) => {
                    const value = line.values[hover] ?? null;
                    return (
                      value !== null && (
                        <circle
                          key={line.key}
                          cx={hoverX}
                          cy={y(value)}
                          r="4"
                          fill={line.color}
                          className="stroke-card"
                          strokeWidth="2"
                        />
                      )
                    );
                  })}
                </g>
              )}
              <rect
                x={left}
                y={top}
                width={innerWidth}
                height={innerHeight}
                fill="transparent"
                onPointerMove={onMove}
                onPointerDown={onMove}
                onPointerLeave={() => setHover(null)}
              />
            </svg>
          )}
          {hover !== null && (
            <div
              role="status"
              className="border-border/70 bg-popover text-popover-foreground pointer-events-none absolute z-10 min-w-36 rounded-lg border px-2.5 py-2 text-xs shadow-lg"
              style={{
                top: top,
                ...(tooltipOnLeft
                  ? { right: width - hoverX + 12 }
                  : { left: Math.min(hoverX + 12, Math.max(0, width - 160)) }),
              }}
            >
              <p className="text-muted-foreground mb-1 font-medium">
                {formatPeriodLong(days[hover], interval)}
              </p>
              {partial?.[hover] && (
                <p className="text-muted-foreground mb-1">Zeitraum nicht vollständig im Fenster</p>
              )}
              {visible.map((line) => (
                <p key={line.key} className="flex items-center justify-between gap-4 tabular-nums">
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: line.color }}
                    />
                    {line.label}
                  </span>
                  <span className="font-semibold">{printed(line.values[hover])}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** A row of {@link BarList}. */
export interface BarRow {
  key: string;
  label: ReactNode;
  value: number;
  /** 0..1 share shown beside the value; omitted, none is shown. */
  share?: number;
  /** A second line under the label, in muted type. */
  detail?: ReactNode;
  /** Where the label goes: an internal route. */
  href?: string;
  /** Where the label goes when it leaves the admin: opened in a new tab. */
  externalHref?: string;
  /** Cuts a label that is too long at its start, so the end of a path stays readable. */
  startTruncate?: boolean;
  /** The row is the filter that is set: its label reads in the brand colour and bold. */
  active?: boolean;
  /** Makes the label a button, for a row that filters the page. */
  onSelect?: () => void;
  /** Small links beside the value: the editor, the public page. */
  actions?: ReactNode;
  /** The row dropped out of a live list and fades at its last place: hidden from reading and pressing. */
  leaving?: boolean;
}

/**
 * Rows of a label, a thin bar scaled to the biggest row, the count and, where the API gives
 * one, the share. The first `limit` show; the rest wait behind a button, so a list of fifty
 * does not push the page around.
 */
export function BarList({
  rows,
  limit = 8,
  unit,
  className,
}: {
  rows: readonly BarRow[];
  limit?: number;
  /** What the count counts, for the column's accessible name. */
  unit?: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rows : rows.slice(0, limit);
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className={className}>
      <ul className="space-y-2.5">
        {shown.map((row) => {
          const text = row.startTruncate ? <StartTruncated>{row.label}</StartTruncated> : row.label;
          const label = row.href ? (
            <Link href={row.href} className="hover:text-primary truncate transition-colors">
              {text}
            </Link>
          ) : row.externalHref ? (
            <a
              href={row.externalHref}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-primary inline-flex min-w-0 items-center gap-1 transition-colors"
            >
              <span className="min-w-0 flex-1 truncate">{text}</span>
              <ExternalLink className="text-muted-foreground h-3 w-3 shrink-0" aria-hidden="true" />
            </a>
          ) : row.onSelect ? (
            <button
              type="button"
              onClick={row.onSelect}
              aria-pressed={row.active}
              title="Nach diesem Wert filtern"
              className={cn(
                'hover:text-primary truncate text-left transition-colors',
                row.active && 'text-primary font-semibold'
              )}
            >
              {text}
            </button>
          ) : (
            <span className="truncate">{text}</span>
          );
          return (
            <li
              key={row.key}
              data-bar-row={row.key}
              data-leaving={row.leaving ? '' : undefined}
              aria-hidden={row.leaving || undefined}
              inert={row.leaving}
            >
              <div className="flex items-baseline gap-3 text-sm">
                <span className="flex min-w-0 flex-1 flex-col">{label}</span>
                {row.actions && (
                  <span className="flex shrink-0 items-center gap-1.5">{row.actions}</span>
                )}
                <span
                  data-bar-value
                  className="shrink-0 text-right font-medium tabular-nums"
                  title={unit ? `${formatCount(row.value)} ${unit}` : undefined}
                >
                  {formatCount(row.value)}
                </span>
                {row.share !== undefined && (
                  <span className="text-muted-foreground w-11 shrink-0 text-right text-xs tabular-nums">
                    {formatShare(row.share)}
                  </span>
                )}
              </div>
              {row.detail && (
                <div className="text-muted-foreground mt-0.5 text-xs">{row.detail}</div>
              )}
              <div className="bg-muted-foreground/10 mt-1 h-1 overflow-hidden rounded-full">
                <div
                  data-bar-fill
                  className={cn('h-full rounded-full', row.active ? 'bg-primary' : 'bg-primary/70')}
                  style={{
                    width: `${Math.max(row.value > 0 ? 1.5 : 0, (row.value / max) * 100)}%`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {rows.length > limit && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="text-primary mt-3 inline-flex items-center gap-1 text-xs hover:underline max-sm:min-h-9"
        >
          {expanded ? (
            'weniger zeigen'
          ) : (
            <>
              <Plus className="h-3 w-3" aria-hidden="true" />
              {rows.length - limit} weitere zeigen
            </>
          )}
        </button>
      )}
    </div>
  );
}

/** One part of a {@link ShareBar}. */
export interface SharePart {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * One horizontal bar split into parts, two pixels of surface between them, and a legend with each
 * part's count and share underneath. For a whole that splits three ways, such as phone, tablet and
 * computer.
 */
export function ShareBar({ parts }: { parts: readonly SharePart[] }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  return (
    <div>
      <div
        className="flex h-2.5 gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={parts.map((part) => `${part.label}: ${formatCount(part.value)}`).join(', ')}
      >
        {total === 0 ? (
          <div className="bg-muted-foreground/15 h-full flex-1" />
        ) : (
          parts
            .filter((part) => part.value > 0)
            .map((part) => (
              <div
                key={part.key}
                className="h-full"
                style={{ flexGrow: part.value, background: part.color, minWidth: 3 }}
              />
            ))
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {parts.map((part) => (
          <li
            key={part.key}
            className="text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums"
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: part.color }}
            />
            {part.label}
            <span className="text-foreground font-medium">{formatCount(part.value)}</span>
            <span>{total > 0 ? formatShare(part.value / total) : '–'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A row of {@link HeatMatrix}. */
interface MatrixRow {
  key: string;
  label: ReactNode;
  cells: readonly number[];
  total: number;
}

/**
 * A table whose cells are shaded by their count, one hue from nothing to the biggest cell, so the
 * eye finds where the openings are before it reads a number. In `share` mode each cell is its
 * share of the row, which compares columns within a row rather than rows with each other.
 */
export function HeatMatrix({
  columns,
  rows,
  max,
  mode = 'count',
  totalLabel = 'Summe',
  columnTotals,
  rowHeader,
}: {
  columns: readonly { key: string; label: ReactNode }[];
  rows: readonly MatrixRow[];
  max: number;
  mode?: 'count' | 'share';
  totalLabel?: string;
  /** Sums under the columns; omitted, the footer is not drawn. */
  columnTotals?: readonly number[];
  /** The corner cell above the row labels. */
  rowHeader?: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-separate border-spacing-0.5 text-sm tabular-nums">
        <thead className="text-muted-foreground text-[11px] tracking-wide uppercase">
          <tr>
            <th className="py-1.5 pr-3 text-left font-medium">{rowHeader}</th>
            {columns.map((column) => (
              <th key={column.key} className="px-1.5 py-1.5 text-right font-medium">
                {column.label}
              </th>
            ))}
            <th className="py-1.5 pl-3 text-right font-medium">{totalLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th
                scope="row"
                className="py-1.5 pr-3 text-left text-sm font-medium whitespace-nowrap"
              >
                {row.label}
              </th>
              {row.cells.map((cell, index) => {
                const scale =
                  mode === 'share'
                    ? row.total > 0
                      ? cell / row.total
                      : 0
                    : max > 0
                      ? cell / max
                      : 0;
                return (
                  <td
                    key={columns[index].key}
                    className="rounded px-1.5 py-1.5 text-right"
                    style={{
                      background:
                        cell > 0
                          ? `color-mix(in oklab, var(--color-primary) ${Math.round(8 + scale * 62)}%, transparent)`
                          : undefined,
                    }}
                    title={`${formatCount(cell)}${row.total > 0 ? ` (${formatShare(cell / row.total)} der Zeile)` : ''}`}
                  >
                    {cell === 0 ? (
                      <span className="text-muted-foreground/60">–</span>
                    ) : mode === 'share' ? (
                      formatShare(cell / row.total)
                    ) : (
                      formatCount(cell)
                    )}
                  </td>
                );
              })}
              <td className="py-1.5 pl-3 text-right font-semibold">{formatCount(row.total)}</td>
            </tr>
          ))}
        </tbody>
        {columnTotals && (
          <tfoot className="text-muted-foreground">
            <tr>
              <th
                scope="row"
                className="py-1.5 pr-3 text-left text-[11px] font-medium tracking-wide uppercase"
              >
                {totalLabel}
              </th>
              {columnTotals.map((total, index) => (
                <td key={columns[index].key} className="px-1.5 py-1.5 text-right font-medium">
                  {formatCount(total)}
                </td>
              ))}
              <td className="text-foreground py-1.5 pl-3 text-right font-semibold">
                {formatCount(columnTotals.reduce((sum, total) => sum + total, 0))}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
