'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatCount } from '@/lib/admin/site-analytics';
import { formatLiveMinute, LIVE_MINUTES, type LiveMinutePoint } from '@/lib/admin/live-traffic';
import { CATEGORICAL, niceScale, useWidth } from '../../../_ui/charts';

const MINUTE_MS = 60_000;
const TWEEN_MS = 750;
/** A window that moved further than this (a tab woken after a while) jumps instead of racing past. */
const MAX_SLIDE_MINUTES = 3;
/** About the width of `14:05` or `jetzt` at the axis's 10 px, plus a gap. */
const LABEL_WIDTH = 44;

/** The three lines of the chart, in the Traffic page's colours for the same figures. */
const SERIES = {
  pageviews: { label: 'Aufrufe', color: CATEGORICAL[0] },
  events: { label: 'Ereignisse', color: CATEGORICAL[3] },
  visitors: { label: 'Besucher', color: CATEGORICAL[2] },
} as const;

type Values = Omit<LiveMinutePoint, 'at'>;

/** What one drawn frame of the chart holds: the window's first minute, the axis top, the values. */
interface Frame {
  start: number;
  max: number;
  values: ReadonlyMap<number, Values>;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ZERO: Values = { pageviews: 0, events: 0, visitors: 0 };

/** The frame between two others: a minute that is new grows from nothing, one that left keeps its values while it slides out. */
function between(from: Frame, to: Frame, t: number): Frame {
  const values = new Map<number, Values>();
  for (const at of new Set([...from.values.keys(), ...to.values.keys()])) {
    const a = from.values.get(at) ?? ZERO;
    const b = to.values.get(at) ?? a;
    values.set(at, {
      pageviews: lerp(a.pageviews, b.pageviews, t),
      events: lerp(a.events, b.events, t),
      visitors: lerp(a.visitors, b.visitors, t),
    });
  }
  return { start: lerp(from.start, to.start, t), max: lerp(from.max, to.max, t), values };
}

/**
 * The frame on screen, moving from the last one to `target` over three quarters of a second when
 * `animate`: the window slides left as a minute passes, bars and the line grow to their new values
 * and the axis eases to its new top. React draws each frame; it is a few dozen shapes.
 */
function useFrame(target: Frame, animate: boolean): Frame {
  const [frame, setFrame] = useState(target);
  const shown = useRef(target);

  useEffect(() => {
    if (!animate) {
      shown.current = target;
      return;
    }
    const from = shown.current;
    if (from === target) return;
    const slide = Math.abs(target.start - from.start) / MINUTE_MS;
    const begin = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = slide > MAX_SLIDE_MINUTES ? 1 : Math.min(1, (now - begin) / TWEEN_MS);
      const next = t >= 1 ? target : between(from, target, easeInOut(t));
      shown.current = next;
      setFrame(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, animate]);

  return animate ? frame : target;
}

/**
 * The last 30 minutes and the current one: a bar of page views per minute with a narrower bar of
 * events in front of it, and distinct visitors as a line. The window slides left as a minute passes;
 * the right-hand column is the minute still running, drawn lighter, and its piece of the line is
 * dashed. Hovering or touching a column reads its three figures.
 */
export function MinuteChart({
  minutes,
  animate,
  height = 210,
}: {
  minutes: readonly LiveMinutePoint[];
  animate: boolean;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const titleId = useId();
  const clipId = `live-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const target = useMemo<Frame>(() => {
    const peak = Math.max(
      0,
      ...minutes.map((minute) => Math.max(minute.pageviews, minute.events, minute.visitors))
    );
    return {
      start: minutes[0]?.at ?? 0,
      max: niceScale(peak, 1).max,
      values: new Map(minutes.map(({ at, ...values }) => [at, values])),
    };
  }, [minutes]);
  const frame = useFrame(target, animate);
  const { step } = niceScale(target.max, 1);

  const left = 34;
  const right = 6;
  const top = 10;
  const bottom = 22;
  const innerWidth = Math.max(0, width - left - right);
  const innerHeight = height - top - bottom;
  const slot = innerWidth / LIVE_MINUTES;
  const latest = minutes.at(-1)?.at ?? 0;
  const x = (at: number) => left + ((at - frame.start) / MINUTE_MS) * slot + slot / 2;
  const y = (value: number) => top + innerHeight - (value / Math.max(1, frame.max)) * innerHeight;

  const ticks: number[] = [];
  for (let value = 0; value <= target.max + step / 2; value += step) ticks.push(value);

  const drawn = [...frame.values.entries()].sort(([a], [b]) => a - b);
  const line = drawn.filter(([at]) => at !== latest);
  const solid = line
    .map(
      ([at, values], index) =>
        `${index === 0 ? 'M' : 'L'}${x(at).toFixed(1)},${y(values.visitors).toFixed(1)}`
    )
    .join(' ');
  const last = line.at(-1);
  const now = frame.values.get(latest);
  const running =
    last && now
      ? `M${x(last[0]).toFixed(1)},${y(last[1].visitors).toFixed(1)} L${x(latest).toFixed(1)},${y(now.visitors).toFixed(1)}`
      : '';

  const hovered = hover === null ? null : minutes[hover];
  const hoverX = hover === null ? 0 : left + hover * slot + slot / 2;

  const onMove = (event: React.PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.floor(((event.clientX - box.left) / Math.max(1, box.width)) * LIVE_MINUTES);
    setHover(Math.max(0, Math.min(minutes.length - 1, index)));
  };

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Legende">
        {(Object.keys(SERIES) as (keyof typeof SERIES)[]).map((key) => (
          <li key={key} className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span
              aria-hidden="true"
              className={key === 'visitors' ? 'h-0.5 w-4 rounded-full' : 'h-2.5 w-2 rounded-sm'}
              style={{ background: SERIES[key].color }}
            />
            {SERIES[key].label}
          </li>
        ))}
      </ul>
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-labelledby={titleId}
            className="block touch-pan-y select-none"
          >
            <title id={titleId}>
              {`Aufrufe, Ereignisse und Besucher pro Minute, die letzten 30 Minuten und die laufende. Zuletzt ${formatCount(minutes.at(-1)?.pageviews ?? 0)} Aufrufe in der laufenden Minute.`}
            </title>
            <defs>
              <clipPath id={clipId}>
                <rect x={left} y={0} width={innerWidth} height={height} />
              </clipPath>
            </defs>
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
                  {formatCount(tick)}
                </text>
              </g>
            ))}

            <g clipPath={`url(#${clipId})`}>
              {hovered && (
                <rect
                  x={hoverX - slot / 2}
                  y={top}
                  width={slot}
                  height={innerHeight}
                  className="fill-muted-foreground/10"
                />
              )}
              {drawn.map(([at, values]) => {
                const center = x(at);
                const current = at === latest;
                const wide = Math.max(2, slot * 0.66);
                const narrow = Math.max(1.5, slot * 0.26);
                return (
                  <g key={at} opacity={current ? 0.55 : 1}>
                    <rect
                      x={center - wide / 2}
                      y={y(values.pageviews)}
                      width={wide}
                      height={Math.max(0, top + innerHeight - y(values.pageviews))}
                      rx={Math.min(3, wide / 4)}
                      fill={SERIES.pageviews.color}
                      fillOpacity={0.75}
                    />
                    <rect
                      x={center - narrow / 2}
                      y={y(values.events)}
                      width={narrow}
                      height={Math.max(0, top + innerHeight - y(values.events))}
                      rx={Math.min(1.5, narrow / 3)}
                      fill={SERIES.events.color}
                      fillOpacity={0.85}
                    />
                  </g>
                );
              })}
              {/* A rim in the card's colour under the line, so it stays apart from the bars it crosses. */}
              <path
                d={solid}
                fill="none"
                className="stroke-card"
                strokeWidth="5.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path
                d={solid}
                fill="none"
                stroke={SERIES.visitors.color}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {running && (
                <path
                  d={running}
                  fill="none"
                  stroke={SERIES.visitors.color}
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                />
              )}
              {now && (
                <circle
                  cx={x(latest)}
                  cy={y(now.visitors)}
                  r="3.5"
                  fill={SERIES.visitors.color}
                  className="stroke-card"
                  strokeWidth="2"
                />
              )}
              {drawn.map(([at]) => {
                const isNow = at === latest;
                const onFive = new Date(at).getMinutes() % 5 === 0;
                // Five-minute marks, and "jetzt" under the running minute; a mark closer to it than a
                // label's width would print over it.
                if (!isNow && (!onFive || ((latest - at) / MINUTE_MS) * slot < LABEL_WIDTH))
                  return null;
                return (
                  <text
                    key={`label-${at}`}
                    x={x(at)}
                    y={height - 6}
                    textAnchor={isNow ? 'end' : 'middle'}
                    dx={isNow ? slot / 2 : 0}
                    className={
                      isNow
                        ? 'fill-foreground text-[10px] font-semibold'
                        : 'fill-muted-foreground text-[10px] tabular-nums'
                    }
                  >
                    {isNow ? 'jetzt' : formatLiveMinute(at)}
                  </text>
                );
              })}
            </g>

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
        {hovered && (
          <div
            role="status"
            className="border-border/70 bg-popover text-popover-foreground pointer-events-none absolute z-10 min-w-36 rounded-lg border px-2.5 py-2 text-xs shadow-lg"
            style={{
              top,
              ...(hoverX > width * 0.6
                ? { right: width - hoverX + slot }
                : { left: Math.min(hoverX + slot, Math.max(0, width - 160)) }),
            }}
          >
            <p className="text-muted-foreground mb-1 font-medium">
              {hovered.at === latest
                ? `${formatLiveMinute(hovered.at)}, läuft noch`
                : formatLiveMinute(hovered.at)}
            </p>
            {(Object.keys(SERIES) as (keyof typeof SERIES)[]).map((key) => (
              <p key={key} className="flex items-center justify-between gap-4 tabular-nums">
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: SERIES[key].color }}
                  />
                  {SERIES[key].label}
                </span>
                <span className="font-semibold">{formatCount(hovered[key])}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
