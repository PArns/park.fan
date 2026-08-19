'use client';

import { memo, useEffect, useId, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Clock,
  CloudHail,
  CloudLightning,
  DoorClosed,
  DoorOpen,
  Droplets,
  Umbrella,
  Wind,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveOnScreen } from '@/lib/hooks/use-active-on-screen';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Temp, Precip } from '@/components/common/unit-display';
import { HeatWarningBadge, isHeatWarning } from './heat-warning-badge';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import {
  buildAxisTicks,
  buildDayScale,
  findRainRuns,
  hoursOf,
  indexForMinute,
  makeXEdge,
  pickExtraTemperatureLabels,
  HOUR_LABEL_WEIGHT,
  TIME_LABEL_WEIGHT,
  type AxisEdgeTick,
  type AxisTick,
  type RainRun,
} from '@/lib/utils/weather-chart-axis';
import type { ScheduleItem, WeatherHourlyPoint, WeatherNowcast } from '@/lib/api/types';
import { formatTime, getDateTimeFormat } from '@/lib/utils/intl-format';

interface WeatherHourlyChartProps {
  /** Today's hourly points (naive park-local times, ascending). */
  points: WeatherHourlyPoint[];
  /** Park timezone — point times are naive park-local, so "now" is compared in that zone. */
  timezone: string;
  /** Park schedule — today's opening hours drive the band AND the axis (see below). */
  schedule?: ScheduleItem[];
  /** Live nowcast — severe-weather windows (storm/hail/thunderstorm) are drawn on the chart. */
  nowcast?: WeatherNowcast | null;
  className?: string;
}

// Severe-weather windows drawn as tinted vertical bands — same kinds, priority
// order, colors and icons as the WeatherNowcastBanner.
type WarningKind = 'storm' | 'hail' | 'thunderstorm';

const WARNING_STYLES: Record<WarningKind, { icon: typeof Wind; band: string; iconColor: string }> =
  {
    storm: {
      icon: Wind,
      band: 'bg-red-500/15 border-red-500/50',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    hail: {
      icon: CloudHail,
      band: 'bg-orange-500/15 border-orange-500/50',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    thunderstorm: {
      icon: CloudLightning,
      band: 'bg-yellow-500/15 border-yellow-500/50',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
  };

/** A 20-minute squall inside a compressed night hour would otherwise be a hairline. */
const MIN_BAND_WIDTH_PCT = 2.5;
/** More stacked icons than this and the pile reaches into the curve. */
const MAX_WARNING_BANDS = 3;

// Chart geometry in viewBox units (0–100 on both axes, preserveAspectRatio="none").
// TEMP_TOP leaves headroom for the max-temp label so it doesn't touch the box edge.
const TEMP_TOP = 22; // y of the warmest hour
const TEMP_BOTTOM = 62; // y of the coldest hour
// Bottom share of the chart reserved for the rain bars.
const RAIN_AREA_PCT = 30;
// mm/h that fills the rain area ("moderate" rain); heavier slots scale the chart up.
const RAIN_SCALE_TOP_MM = 2.5;

// Single temperature scale for both faces of the chart: `hex` drives the
// now-dot (needs a concrete colour), `gradient` the line/fill gradient —
// 'currentColor' is the SVG's amber-400 in the normal 10–26 °C band, so the
// two columns are the same colour there, just theme-resolved differently.
const TEMP_STOPS: [temp: number, hex: string, gradient: string][] = [
  [30, '#ef4444', '#ef4444'], // hot
  [26, '#fbbf24', 'currentColor'], // amber-400 (= currentColor)
  [10, '#fbbf24', 'currentColor'],
  [5, '#38bdf8', '#38bdf8'], // cool
  [0, '#2563eb', '#2563eb'], // cold (and below, via clamp)
];

function lerpColor(a: string, b: string, f: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * f);
  const g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * f);
  const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * f);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

/** Colour for a temperature, interpolated to match the line gradient. */
function tempColorAt(t: number): string {
  const s = TEMP_STOPS;
  if (t >= s[0][0]) return s[0][1];
  if (t <= s[s.length - 1][0]) return s[s.length - 1][1];
  for (let i = 0; i < s.length - 1; i++) {
    const [hi, c1] = s[i];
    const [lo, c2] = s[i + 1];
    if (t <= hi && t >= lo) return lerpColor(c1, c2, (hi - t) / (hi - lo || 1));
  }
  return s[0][1];
}

/** Format an instant (ms) as a naive park-local ISO ("YYYY-MM-DDTHH:MM"). */
function toLocalIso(ms: number, timezone: string): string {
  return getDateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(ms)
    .replace(' ', 'T');
}

/** Minutes since midnight of a naive park-local ISO. */
const localMinutes = (iso: string) =>
  parseInt(iso.slice(11, 13), 10) * 60 + parseInt(iso.slice(14, 16), 10);

/**
 * Catmull-Rom spline through the points, emitted as cubic beziers.
 *
 * The horizontal control offsets are clamped into the segment they belong to.
 * With evenly spaced points that clamp never binds (the tangent is a third of
 * the gap, the ends a sixth), so the curve is exactly the one this chart has
 * always drawn — but the axis is no longer evenly spaced, and at the opening
 * kink a 1.8 %-wide night hour meeting a 7.4 %-wide open one puts the first
 * control point past the segment's own end, which shows up as a cusp.
 */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  const r = (n: number) => Math.round(n * 100) / 100;
  let d = `M ${r(pts[0].x)} ${r(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const half = (p2.x - p1.x) / 2;
    const c1x = Math.min(Math.max(p1.x + (p2.x - p0.x) / 6, p1.x), p1.x + half);
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = Math.max(Math.min(p2.x - (p3.x - p1.x) / 6, p2.x), p2.x - half);
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${r(c1x)} ${r(c1y)}, ${r(c2x)} ${r(c2y)}, ${r(p2.x)} ${r(p2.y)}`;
  }
  return d;
}

interface DayWindow {
  /**
   * Opening / closing time on the axis, in the coordinate the hourly points are
   * drawn in: point `i` sits at `i + 0.5`, so a 09:00 opening is `9.5`. That is
   * where the band's dashed border has always been drawn, and it is where the
   * scale is told to change gear, so border, kink and "09" tick coincide.
   */
  sOpen: number;
  sClose: number;
  openLocal: string;
  closeLocal: string;
}

/**
 * Today's OPERATING window as continuous point indices, or `null` when the park
 * publishes no opening hours for today (roughly a quarter of the catalogue on
 * any given day — closed, unknown, or nothing but an INFO entry).
 */
function resolveDayWindow(
  points: WeatherHourlyPoint[],
  hours: number[],
  timezone: string,
  schedule: ScheduleItem[] | undefined
): DayWindow | null {
  // The DATA's day, not the clock's: the chart already refuses to render points
  // that are not today, and keeping the clock out of here lets the geometry be
  // memoized on the props alone rather than rebuilt every minute.
  const dayKey = points[0]?.time.slice(0, 10);
  const entry = schedule?.find(
    (s) => s.date === dayKey && s.scheduleType === 'OPERATING' && s.openingTime && s.closingTime
  );
  if (!entry) return null;

  const openLocal = toLocalIso(Date.parse(entry.openingTime!), timezone);
  const closeLocal = toLocalIso(Date.parse(entry.closingTime!), timezone);
  if (openLocal.slice(0, 10) !== dayKey) return null;

  const n = points.length;
  const onAxis = (minute: number) => Math.min(indexForMinute(hours, minute) + 0.5, n);
  const sOpen = onAxis(localMinutes(openLocal));
  // Parks closing after midnight run to the edge of the chart.
  let sClose = closeLocal.slice(0, 10) > dayKey ? n : onAxis(localMinutes(closeLocal));
  if (sClose <= sOpen) sClose = n;

  return { sOpen, sClose, openLocal, closeLocal };
}

interface HourColumn {
  time: string;
  timeLabel: string;
  left: number;
  width: number;
  barPct: number;
  hour: number;
  ariaLabel: string;
  weatherCode: number;
  isDay: boolean;
  temperatureC: number | null;
  precipitationMm: number;
  precipitationProbability: number | null;
}

/**
 * The 24 hour columns: a rain bar and a tooltip hit area each.
 *
 * Split out and memoized because it is the expensive half of the chart — 24
 * Radix subtrees — and the component around it re-renders every minute to move
 * the "now" marker. Nothing in here changes more often than the hour does.
 *
 * Every hour keeps its own column, however narrow the compression makes it: the
 * `aria-label` is the only channel that survives on a phone, where Radix never
 * opens a tooltip.
 */
const HourColumns = memo(function HourColumns({
  columns,
  nowHour,
}: {
  columns: HourColumn[];
  /** Park-local hour. Deliberately not the minute — see the note on the memo above. */
  nowHour: number;
}) {
  const t = useTranslations('parks.weather');
  const tNowcast = useTranslations('parks.weatherNowcast');

  return (
    <div className="absolute inset-0">
      {columns.map((c) => {
        const isPast = c.hour < nowHour;
        const { icon: HourIcon, label, color } = getWeatherConfig(c.weatherCode, c.isDay);
        return (
          <Tooltip key={c.time}>
            <TooltipTrigger asChild>
              <div
                className="absolute inset-y-0"
                style={{ left: `${c.left}%`, width: `${c.width}%` }}
                aria-label={c.ariaLabel}
              >
                {c.barPct > 0 && (
                  <div
                    className={cn(
                      'absolute inset-x-[15%] bottom-0 min-w-[2px] rounded-t-[2px] bg-sky-400/85',
                      isPast && 'opacity-40'
                    )}
                    style={{ height: `${c.barPct}%` }}
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="flex flex-col gap-1 tabular-nums">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3 shrink-0 opacity-70" aria-hidden="true" />
                  {c.timeLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <HourIcon className={cn('size-3 shrink-0', color)} aria-hidden="true" />
                  {c.temperatureC != null && (
                    <>
                      <Temp celsius={c.temperatureC} />
                      {' · '}
                    </>
                  )}
                  {t(label)}
                </span>
                {c.precipitationMm > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Droplets className="size-3 shrink-0 opacity-70" aria-hidden="true" />
                    <Precip mm={c.precipitationMm} />
                  </span>
                )}
                {c.precipitationProbability != null && c.precipitationProbability > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Umbrella className="size-3 shrink-0 opacity-70" aria-hidden="true" />
                    {c.precipitationProbability}% {tNowcast('precipProbability')}
                  </span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
});

interface RenderedTick extends AxisTick {
  hour: number;
  label: string;
  weatherCode: number;
  isDay: boolean;
  /** The hour falls inside a drawn rain run — the label is tinted instead. */
  rainy: boolean;
}

/**
 * The hour axis.
 *
 * Absolutely positioned, not a flex row of equal cells: the columns are no
 * longer equal, and the old cells were ~13 px wide on a phone, so the labels
 * ("14 Uhr" in German, not "14") wrapped to a second line and pushed the chart
 * 11.5 px past the box the weather card reserves for it. Every group is out of
 * flow and `whitespace-nowrap`, so the row's height cannot depend on how many
 * ticks there are, how wide they are, or which locale is rendering.
 */
const AxisTicks = memo(function AxisTicks({
  ticks,
  nowHour,
  openingHours,
}: {
  ticks: RenderedTick[];
  /** Park-local hour. Deliberately not the minute — see the note on the memo above. */
  nowHour: number;
  openingHours: string | null;
}) {
  const t = useTranslations('parks.weather');
  const tParks = useTranslations('parks');

  return (
    <div className="relative mt-1 h-[27px]">
      {ticks.map((tick) => {
        const { icon: HourIcon, color } = getWeatherConfig(tick.weatherCode, tick.isDay);
        const isEdge = tick.kind !== 'hour';
        const EdgeIcon = tick.kind === 'open' ? DoorOpen : DoorClosed;
        const group = (
          <div
            key={`${tick.kind}-${tick.index}`}
            className={cn(
              'absolute top-0 flex flex-col items-center gap-0.5 whitespace-nowrap',
              tick.tier === 1 && 'hidden @min-[440px]/weatherchart:flex',
              tick.hour < nowHour && 'opacity-50'
            )}
            style={{
              left: `${tick.x}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {isEdge ? (
              <EdgeIcon className="text-primary/80 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <HourIcon className={cn('h-3.5 w-3.5 shrink-0', color)} aria-hidden="true" />
            )}
            <span
              className={cn(
                'text-center text-[9px] leading-none tabular-nums',
                isEdge
                  ? 'text-primary/85 font-semibold'
                  : tick.rainy
                    ? 'font-medium text-sky-600 dark:text-sky-400'
                    : 'text-muted-foreground'
              )}
            >
              {tick.label}
            </span>
          </div>
        );

        if (!isEdge || !openingHours) return group;

        return (
          <Tooltip key={`${tick.kind}-${tick.index}`}>
            <TooltipTrigger asChild>{group}</TooltipTrigger>
            <TooltipContent side="top">
              <span className="flex flex-col gap-0.5">
                <span className="tabular-nums">
                  {tParks('openingHours')}: {openingHours}
                </span>
                <span className="opacity-70">{t('compressedAxisHint')}</span>
              </span>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
});

/**
 * Detailed day view for today: hourly temperature curve with rain bars
 * underneath, a "now" marker, and per-hour tooltips — the classic weather-app
 * hourly chart, but built around the park's own day rather than the calendar's.
 *
 * When the park publishes opening hours for today the time axis is compressed
 * outside them and stretched inside (`lib/utils/weather-chart-axis.ts`), which
 * is what makes room for hour-by-hour ticks and a few temperature readings
 * during the visit. Without those hours the axis stays linear and the chart is
 * the one it has always been.
 *
 * Renders nothing once the data no longer belongs to today (e.g. right after
 * midnight, until the next refetch rolls it over).
 */
export function WeatherHourlyChart({
  points,
  timezone,
  schedule,
  nowcast,
  className,
}: WeatherHourlyChartProps) {
  const locale = useLocale();
  const t = useTranslations('parks.weather');
  const tNowcast = useTranslations('parks.weatherNowcast');
  const tParks = useTranslations('parks');
  const gradientId = useId();
  const tempLineGradientId = useId();

  // Re-render every minute so the "now" marker tracks the actual time — but
  // only while the chart is on screen and the tab is visible: the marker, the
  // clip paths and the dimming rebuild per tick, which is pure waste while
  // scrolled away. The deferred first tick re-syncs the marker immediately
  // whenever the chart becomes watchable again. The columns and the axis are
  // memoized on the hour, so the 24 tooltip subtrees are NOT part of that.
  const { ref: rootRef, active } = useActiveOnScreen();
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const sync = setTimeout(() => setNowMs(Date.now()), 0);
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => {
      clearTimeout(sync);
      clearInterval(id);
    };
  }, [active]);

  const nowLocal = toLocalIso(nowMs, timezone);
  const todayKey = nowLocal.slice(0, 10);
  const nowMinutes = localMinutes(nowLocal);
  // The columns and the axis only ever change on the hour, so they are memoized on
  // this rather than on `nowMinutes` — the 24 Radix subtrees would otherwise be
  // rebuilt every minute for a marker that moves a couple of pixels.
  const nowHour = Math.floor(nowMinutes / 60);
  const liveTemp = nowcast?.currentTemperatureC ?? null;

  const fmtTime = (localIso: string) =>
    formatTime(new Date(`${localIso}Z`), locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });

  // Everything that does not move with the clock. It rolls over when the hourly
  // data does, so nothing here is rebuilt on the minute tick; the hooks sit above
  // the early returns below, so the helpers tolerate a degenerate day.
  const geometry = useMemo(() => {
    const n = points.length;
    const hours = hoursOf(points);
    const window = resolveDayWindow(points, hours, timezone, schedule);
    const scale = buildDayScale(n, window?.sOpen ?? null, window?.sClose ?? null);
    const xEdge = makeXEdge(n, scale);
    return {
      n,
      hours,
      window,
      scale,
      xEdge,
      xFor: (i: number) => xEdge(i + 0.5),
      xForMinutes: (minute: number) => xEdge(indexForMinute(hours, minute) + 0.5),
    };
  }, [points, timezone, schedule]);

  const { n, hours, window: dayWindow, scale, xEdge, xFor, xForMinutes } = geometry;

  const rainRuns = useMemo(
    () =>
      findRainRuns(
        points.map((p) => p.precipitationMm),
        points.map((p) => p.precipitationProbability)
      ),
    [points]
  );

  const columns = useMemo<HourColumn[]>(() => {
    const peakMm = Math.max(0, ...points.map((p) => p.precipitationMm ?? 0));
    const rainScale = Math.max(RAIN_SCALE_TOP_MM, peakMm);
    return points.map((p, i) => {
      const mm = p.precipitationMm ?? 0;
      const prob = p.precipitationProbability;
      const time = formatTime(new Date(`${p.time}Z`), locale, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });
      return {
        time: p.time,
        timeLabel: time,
        left: xEdge(i),
        width: xEdge(i + 1) - xEdge(i),
        barPct: mm > 0 ? Math.min(RAIN_AREA_PCT, Math.max(8, (mm / rainScale) * RAIN_AREA_PCT)) : 0,
        hour: hours[i],
        ariaLabel: `${time} · ${p.temperatureC != null ? `${Math.round(p.temperatureC)}°C · ` : ''}${mm.toFixed(1)} mm${
          prob != null ? ` · ${prob}% ${tNowcast('precipProbability')}` : ''
        }`,
        weatherCode: p.weatherCode ?? 0,
        isDay: p.isDay,
        temperatureC: p.temperatureC,
        precipitationMm: mm,
        precipitationProbability: prob,
      };
    });
  }, [points, hours, xEdge, locale, tNowcast]);

  const ticks = useMemo<RenderedTick[]>(() => {
    const fmtHour = (localIso: string) =>
      formatTime(new Date(`${localIso}Z`), locale, { hour: 'numeric', timeZone: 'UTC' });
    // The long form ("9:30 AM") only when the park does not open on the hour.
    const fmtEdge = (localIso: string) =>
      localIso.slice(14, 16) === '00'
        ? fmtHour(localIso)
        : formatTime(new Date(`${localIso}Z`), locale, {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'UTC',
          });

    const onAxisIndex = (s: number) => Math.min(Math.max(Math.floor(s - 0.5), 0), n - 1);
    const edges: AxisEdgeTick[] =
      scale && dayWindow
        ? [
            {
              kind: 'open',
              x: xEdge(dayWindow.sOpen),
              index: onAxisIndex(dayWindow.sOpen),
              weight:
                dayWindow.openLocal.slice(14, 16) === '00' ? HOUR_LABEL_WEIGHT : TIME_LABEL_WEIGHT,
            },
            {
              kind: 'close',
              x: xEdge(dayWindow.sClose),
              index: onAxisIndex(dayWindow.sClose),
              weight:
                dayWindow.closeLocal.slice(14, 16) === '00' ? HOUR_LABEL_WEIGHT : TIME_LABEL_WEIGHT,
            },
          ]
        : [];

    const rainy = new Set<number>();
    for (const run of rainRuns) for (let i = run.from; i < run.to; i++) rainy.add(i);

    const edgeLabel = (kind: AxisTick['kind']) =>
      dayWindow && kind === 'open'
        ? fmtEdge(dayWindow.openLocal)
        : dayWindow && kind === 'close'
          ? fmtEdge(dayWindow.closeLocal)
          : null;

    return buildAxisTicks({ hours, xForIndex: xFor, scale, edges }).map((tick) => ({
      ...tick,
      hour: hours[tick.index],
      label: edgeLabel(tick.kind) ?? fmtHour(points[tick.index].time),
      weatherCode: points[tick.index].weatherCode ?? 0,
      isDay: points[tick.index].isDay,
      rainy: rainy.has(tick.index),
    }));
  }, [points, hours, xFor, xEdge, scale, dayWindow, rainRuns, n, locale]);

  if (n < 2) return null;
  // Only a *today* view makes sense; hide the chart when the data is for another day.
  if (points[0].time.slice(0, 10) !== todayKey) return null;

  const temps = points.map((p) => p.temperatureC);
  const valid = temps.filter((v): v is number => v != null);
  if (valid.length < 2) return null;
  // Fold in the live nowcast temp so the curve, peak and the header (which shows
  // that live value) share one scale.
  const scaleTemps = liveTemp != null ? [...valid, liveTemp] : valid;
  const minTemp = Math.min(...scaleTemps);
  const maxTemp = Math.max(...scaleTemps);
  // Keep a flat curve from collapsing to a line glued to the top of the band.
  const span = Math.max(maxTemp - minTemp, 2);

  const yFor = (tempC: number) =>
    TEMP_BOTTOM - ((tempC - minTemp) / span) * (TEMP_BOTTOM - TEMP_TOP);

  // "Now" position + temperature. Prefer the LIVE nowcast value so the dot, peak
  // and header agree (and "now" tracks live); else interpolate the hourly curve.
  const nowS = indexForMinute(hours, nowMinutes);
  const nowPct = xEdge(nowS + 0.5);
  const i0 = Math.min(Math.max(Math.floor(nowS), 0), n - 2);
  const frac = Math.min(Math.max(nowS - i0, 0), 1);
  const t0 = points[i0].temperatureC;
  const t1 = points[i0 + 1].temperatureC;
  const interpNow = t0 != null && t1 != null ? t0 + (t1 - t0) * frac : null;
  const nowTemp = liveTemp ?? interpNow;
  const nowTempY = nowTemp != null ? yFor(nowTemp) : null;
  const nowTempColor = nowTemp != null ? tempColorAt(nowTemp) : undefined;

  // Line: the hourly curve with the live "now" point spliced in (by time) so the
  // curve passes through it and the dot sits on the line. The neighbour filter is
  // an INDEX test — a percentage one would delete both neighbours of a "now" that
  // falls in a compressed night column.
  const hourlyPts = points
    .map((p, i) =>
      p.temperatureC != null ? { s: i + 0.5, x: xFor(i), y: yFor(p.temperatureC) } : null
    )
    .filter((p): p is { s: number; x: number; y: number } => p !== null);
  const linePts =
    liveTemp != null && nowTempY != null
      ? [
          ...hourlyPts.filter((p) => Math.abs(p.s - (nowS + 0.5)) > 1 / 3),
          { s: nowS + 0.5, x: nowPct, y: nowTempY },
        ].sort((a, b) => a.x - b.x)
      : hourlyPts;
  const lineD = smoothPath(linePts);

  // Temperature-tinted line: a vertical gradient whose stops sit at the y of each
  // threshold temp. Since the y-axis IS temperature, only the part of the curve
  // in a band takes that colour, with a smooth transition between. `currentColor`
  // (the SVG's amber) is the normal 10–30 °C band, so it looks unchanged there;
  // only > 30 °C (hot/red) and < 10 °C (cool → cold/blue) diverge.
  const tempLineStops: { offset: number; color: string }[] = [];
  let runOff = 0;
  for (const [temp, , color] of TEMP_STOPS) {
    runOff = Math.max(runOff, Math.min(1, Math.max(0, yFor(temp) / 100)));
    tempLineStops.push({ offset: runOff, color });
  }
  // Same colours under the curve, faded top→bottom — a subtle temperature wash.
  const tempFillStops = tempLineStops.map((s) => ({
    ...s,
    opacity: Math.max(0.03, 0.24 - 0.2 * s.offset),
  }));
  const areaD = `${lineD} L ${linePts[linePts.length - 1].x.toFixed(2)} 100 L ${linePts[0].x.toFixed(2)} 100 Z`;

  // Min/max label anchors. The live temp sits at "now" when it's the day's extreme.
  const hourlyMax = Math.max(...valid);
  const hourlyMin = Math.min(...valid);
  const maxAtNow = liveTemp != null && liveTemp >= hourlyMax;
  const maxX = maxAtNow ? nowPct : xFor(temps.indexOf(maxTemp));
  const minX = liveTemp != null && liveTemp <= hourlyMin ? nowPct : xFor(temps.indexOf(minTemp));

  // Extra readings inside the visit — the point of stretching it in the first
  // place. Measured against the HOURLY extremes, not against `maxX`/`minX`,
  // which jump to "now" when the live value is the day's extreme: the label set
  // must not reshuffle on the minute tick.
  const extras =
    scale && dayWindow
      ? pickExtraTemperatureLabels({
          candidates: points
            .map((p, i) => (p.temperatureC != null ? i : -1))
            .filter((i) => i >= 0 && i + 0.5 >= dayWindow.sOpen && i + 0.5 <= dayWindow.sClose),
          temps,
          xs: points.map((_, i) => xFor(i)),
          placed: [
            { x: xFor(temps.indexOf(hourlyMax)), value: hourlyMax },
            { x: xFor(temps.indexOf(hourlyMin)), value: hourlyMin },
          ],
        })
      : [];

  // The "Now" text yields to every other label: the live temperature is already
  // set in 3xl two rows up in the card, so it is the cheapest thing to drop.
  const labelXs = [maxX, minX, ...extras.map((e) => xFor(e.index))];
  const showNowLabel = labelXs.every((x) => Math.abs(x - nowPct) > 10);

  const openPct = dayWindow ? xEdge(dayWindow.sOpen) : null;
  const closePct = dayWindow ? xEdge(dayWindow.sClose) : null;
  const openingHours = dayWindow
    ? `${fmtTime(dayWindow.openLocal)} – ${fmtTime(dayWindow.closeLocal)}`
    : null;

  // Severe-weather windows (UTC instants) mapped onto today's axis. All present
  // kinds are drawn, not just the banner's highest-priority one.
  const warnings: {
    kind: WarningKind;
    fromPct: number;
    toPct: number;
    startLocal: string;
    endLocal: string | null;
  }[] = [];
  if (nowcast) {
    const events: [WarningKind, string | null | undefined, string | null | undefined][] = [
      ['storm', nowcast.stormStartsAt, nowcast.stormEndsAt],
      ['hail', nowcast.hailStartsAt, nowcast.hailEndsAt],
      ['thunderstorm', nowcast.thunderstormStartsAt, nowcast.thunderstormEndsAt],
    ];
    for (const [kind, startsAt, endsAt] of events) {
      if (!startsAt) continue;
      const startLocal = toLocalIso(Date.parse(startsAt), timezone);
      const endLocal = endsAt ? toLocalIso(Date.parse(endsAt), timezone) : null;
      if (startLocal.slice(0, 10) > todayKey) continue; // starts on a later day
      if (endLocal && endLocal.slice(0, 10) < todayKey) continue; // ended on an earlier day
      const fromPct =
        startLocal.slice(0, 10) < todayKey ? 0 : xForMinutes(localMinutes(startLocal));
      // Unknown or after-midnight end → run to the edge of the chart.
      const toPct =
        endLocal && endLocal.slice(0, 10) === todayKey ? xForMinutes(localMinutes(endLocal)) : 100;
      if (toPct <= fromPct) continue;
      warnings.push({ kind, fromPct, toPct, startLocal, endLocal });
    }
  }

  return (
    <div ref={rootRef} className={cn('@container/weatherchart min-w-0', className)}>
      <div className="relative h-28">
        {/* Park opening hours — the band, and on a warped axis also the two
            places where the time scale changes gear. */}
        {openPct != null && closePct != null && (
          <div
            className="border-primary/40 bg-primary/[0.07] pointer-events-none absolute inset-y-0 border-x border-dashed"
            style={{ left: `${openPct}%`, width: `${closePct - openPct}%` }}
            role="img"
            aria-label={openingHours ? `${tParks('openingHours')}: ${openingHours}` : undefined}
          />
        )}

        {/* Severe-weather windows (storm / hail / thunderstorm) */}
        {warnings
          .slice(0, MAX_WARNING_BANDS)
          .map(({ kind, fromPct, toPct, startLocal, endLocal }, i) => {
            const { icon: WarnIcon, band, iconColor } = WARNING_STYLES[kind];
            const range = `${fmtTime(startLocal)}${endLocal ? ` – ${fmtTime(endLocal)}` : ''}`;
            return (
              <div
                key={kind}
                className={cn('pointer-events-none absolute inset-y-0 border-x', band)}
                style={{
                  left: `${fromPct}%`,
                  width: `${Math.max(toPct - fromPct, MIN_BAND_WIDTH_PCT)}%`,
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* Stacked per warning so overlapping windows don't bury each
                      other's icon. */}
                    <span
                      className="pointer-events-auto absolute left-1/2 z-10 -translate-x-1/2"
                      style={{ top: `${2 + i * 18}px` }}
                      aria-label={`${tNowcast(`${kind}.heading`)} ${range}`}
                    >
                      <WarnIcon className={cn('size-3.5', iconColor)} aria-hidden="true" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span className="flex items-center gap-1.5 tabular-nums">
                      <WarnIcon className={cn('size-3 shrink-0', iconColor)} aria-hidden="true" />
                      {tNowcast(`${kind}.heading`)} · {range}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}

        {/* Temperature curve — drawn twice via clip paths so the elapsed part of
            the day renders dimmed (an overlay wash would tint dark mode wrong). */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full text-amber-400"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="0"
              y2="100"
            >
              {tempFillStops.map((s, i) => (
                <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
              ))}
            </linearGradient>
            {/* Temperature-tinted line stroke — vertical (y = temperature). */}
            <linearGradient
              id={tempLineGradientId}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="0"
              y2="100"
            >
              {tempLineStops.map((s, i) => (
                <stop key={i} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
            <clipPath id={`${gradientId}-past`}>
              <rect x="0" y="0" width={nowPct} height="100" />
            </clipPath>
            <clipPath id={`${gradientId}-future`}>
              <rect x={nowPct} y="0" width={100 - nowPct} height="100" />
            </clipPath>
          </defs>
          {[
            { clip: 'past', opacity: 0.45 },
            { clip: 'future', opacity: 1 },
          ].map(({ clip, opacity }) => (
            <g key={clip} clipPath={`url(#${gradientId}-${clip})`} opacity={opacity}>
              <path d={areaD} fill={`url(#${gradientId})`} />
              <path
                d={lineD}
                fill="none"
                stroke={`url(#${tempLineGradientId})`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </svg>

        {/* Rain bars + per-hour tooltip hit areas */}
        <HourColumns columns={columns} nowHour={nowHour} />

        {/* Wet stretches, as one rule under the bars they belong to — five 5 px
            drizzle bars in a compressed night read as noise, this reads as a
            morning of rain, and it needs no hover to do it. */}
        {rainRuns.map((run: RainRun) => (
          <div
            key={run.from}
            className="pointer-events-none absolute bottom-0 h-[3px] rounded-full bg-sky-400/70"
            style={{
              left: `${xEdge(run.from)}%`,
              width: `${Math.max(xEdge(run.to) - xEdge(run.from), MIN_BAND_WIDTH_PCT)}%`,
            }}
            aria-hidden="true"
          />
        ))}

        {/* "Now" marker */}
        <div
          className="border-foreground/30 pointer-events-none absolute inset-y-0 border-l border-dashed"
          style={{ left: `${nowPct}%` }}
          aria-hidden="true"
        />
        {nowTempY != null && (
          <div
            className="ring-background pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
            style={{ left: `${nowPct}%`, top: `${nowTempY}%`, backgroundColor: nowTempColor }}
            aria-hidden="true"
          />
        )}
        {/* "Now" label — anchored just above the dot on the curve (not glued to the
            chart's top edge); hidden when it would collide with another label. */}
        {showNowLabel && nowTempY != null && (
          <span
            className="text-foreground/60 pointer-events-none absolute pb-2.5 text-[9px] leading-none font-medium whitespace-nowrap"
            style={{
              left: `${nowPct}%`,
              top: `${nowTempY}%`,
              transform: 'translateX(-50%) translateY(-100%)',
            }}
            aria-hidden="true"
          >
            {t('nowLabel')}
          </span>
        )}

        {/* Extra readings inside the opening hours. The last two only appear once
            the chart is wide enough to seat them without crowding. */}
        {extras.map((extra) => {
          const value = temps[extra.index] as number;
          const x = xFor(extra.index);
          const above =
            value >= (temps[extra.index - 1] ?? -Infinity) &&
            value >= (temps[extra.index + 1] ?? -Infinity);
          return (
            <span
              key={extra.index}
              className={cn(
                'text-foreground/70 pointer-events-none absolute text-[10px] font-medium whitespace-nowrap tabular-nums',
                above ? 'pb-0.5' : 'pt-0.5',
                extra.tier === 1 && 'hidden @min-[440px]/weatherchart:inline'
              )}
              style={{
                left: `${x}%`,
                top: `${yFor(value)}%`,
                transform: `translateX(-50%)${above ? ' translateY(-100%)' : ''}`,
              }}
            >
              <Temp celsius={value} />
            </span>
          );
        })}

        {/* Min/max temperature labels, anchored to their hours */}
        <span
          className={cn(
            'pointer-events-none absolute inline-flex items-center gap-0.5 text-[10px] font-semibold whitespace-nowrap tabular-nums',
            // A touch of clearance when the peak label sits right above the "now" dot.
            maxAtNow ? 'pb-1.5' : 'pb-0.5'
          )}
          style={{
            left: `${maxX}%`,
            top: `${yFor(maxTemp)}%`,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          <Temp celsius={maxTemp} />
          {isHeatWarning(maxTemp) && <HeatWarningBadge label={t('heatWarning')} size="1.3em" />}
        </span>
        <span
          className="text-muted-foreground pointer-events-none absolute pt-0.5 text-[10px] font-medium whitespace-nowrap tabular-nums"
          style={{
            left: `${minX}%`,
            top: `${yFor(minTemp)}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <Temp celsius={minTemp} />
        </span>
      </div>

      <AxisTicks ticks={ticks} nowHour={nowHour} openingHours={openingHours} />
    </div>
  );
}
