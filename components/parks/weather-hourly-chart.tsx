'use client';

import { useEffect, useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Clock, CloudHail, CloudLightning, Droplets, Umbrella, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Temp, Precip } from '@/components/common/unit-display';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import type { ScheduleItem, WeatherHourlyPoint, WeatherNowcast } from '@/lib/api/types';

interface WeatherHourlyChartProps {
  /** Today's hourly points (naive park-local times, ascending). */
  points: WeatherHourlyPoint[];
  /** Park timezone — point times are naive park-local, so "now" is compared in that zone. */
  timezone: string;
  /** Park schedule — today's opening hours are marked as a band on the chart. */
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

// Chart geometry in viewBox units (0–100 on both axes, preserveAspectRatio="none").
// TEMP_TOP leaves headroom for the max-temp label so it doesn't touch the box edge.
const TEMP_TOP = 22; // y of the warmest hour
const TEMP_BOTTOM = 62; // y of the coldest hour
// Bottom share of the chart reserved for the rain bars.
const RAIN_AREA_PCT = 30;
// mm/h that fills the rain area ("moderate" rain); heavier slots scale the chart up.
const RAIN_SCALE_TOP_MM = 2.5;

/** Format an instant (ms) as a naive park-local ISO ("YYYY-MM-DDTHH:MM"). */
function toLocalIso(ms: number, timezone: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
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

/** Catmull-Rom spline through the points, emitted as cubic beziers. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  const r = (n: number) => Math.round(n * 100) / 100;
  let d = `M ${r(pts[0].x)} ${r(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${r(c1x)} ${r(c1y)}, ${r(c2x)} ${r(c2y)}, ${r(p2.x)} ${r(p2.y)}`;
  }
  return d;
}

/**
 * Detailed day view for today: hourly temperature curve with rain bars
 * underneath, a "now" marker, and per-hour tooltips — the classic weather-app
 * hourly chart. Renders nothing once the data no longer belongs to today
 * (e.g. right after midnight, until the next refetch rolls it over).
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
  const gradientId = useId();

  // Re-render every minute so the "now" marker tracks the actual time.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const n = points.length;
  if (n < 2) return null;

  const nowLocal = toLocalIso(nowMs, timezone);
  // Only a *today* view makes sense; hide the chart when the data is for another day.
  if (points[0].time.slice(0, 10) !== nowLocal.slice(0, 10)) return null;

  const temps = points.map((p) => p.temperatureC);
  const valid = temps.filter((v): v is number => v != null);
  if (valid.length < 2) return null;
  const minTemp = Math.min(...valid);
  const maxTemp = Math.max(...valid);
  // Keep a flat curve from collapsing to a line glued to the top of the band.
  const span = Math.max(maxTemp - minTemp, 2);

  const xFor = (i: number) => ((i + 0.5) / n) * 100;
  const yFor = (tempC: number) =>
    TEMP_BOTTOM - ((tempC - minTemp) / span) * (TEMP_BOTTOM - TEMP_TOP);

  const linePts = points
    .map((p, i) => (p.temperatureC != null ? { x: xFor(i), y: yFor(p.temperatureC) } : null))
    .filter((p): p is { x: number; y: number } => p !== null);
  const lineD = smoothPath(linePts);
  const areaD = `${lineD} L ${linePts[linePts.length - 1].x.toFixed(2)} 100 L ${linePts[0].x.toFixed(2)} 100 Z`;

  // Rain bars: scale against a fixed "moderate rain fills the area" top, but
  // stretch the scale when an heavier peak would clip.
  const peakMm = Math.max(...points.map((p) => p.precipitationMm ?? 0));
  const rainScale = Math.max(RAIN_SCALE_TOP_MM, peakMm);

  // Map a park-local time of day onto the x-axis. Hour values (temp points, axis
  // labels) sit at the CENTER of their hour column, so clock times must use the
  // same half-slot offset — a plain minutes/1440 mapping lands ~30 min too far left.
  const xForMinutes = (min: number) => Math.min(Math.max(((min / 60 + 0.5) / n) * 100, 0), 100);

  // "Now" position, in park-local time.
  const nowMinutes =
    parseInt(nowLocal.slice(11, 13), 10) * 60 + parseInt(nowLocal.slice(14, 16), 10);
  const nowPct = xForMinutes(nowMinutes);

  // Temperature at "now", interpolated between the neighbouring hour points.
  const u = nowMinutes / 60 - 0.5;
  const i0 = Math.min(Math.max(Math.floor(u), 0), n - 2);
  const frac = Math.min(Math.max(u - i0, 0), 1);
  const t0 = points[i0].temperatureC;
  const t1 = points[i0 + 1].temperatureC;
  const nowTempY = t0 != null && t1 != null ? yFor(t0 + (t1 - t0) * frac) : null;

  // Min/max label anchors (clamped so the labels stay inside the card).
  const maxIdx = temps.indexOf(maxTemp);
  const minIdx = temps.indexOf(minTemp);
  const clampX = (x: number) => Math.min(Math.max(x, 7), 93);
  // The max label and the "now" marker both live near the top — when the day's
  // peak is around the current hour they collide, so drop the "Now" text then.
  const showNowLabel = Math.abs(clampX(xFor(maxIdx)) - nowPct) > 10;

  // Park opening hours — today's OPERATING window mapped onto the day axis.
  const localMinutes = (iso: string) =>
    parseInt(iso.slice(11, 13), 10) * 60 + parseInt(iso.slice(14, 16), 10);
  const todaySchedule =
    schedule?.find(
      (s) =>
        s.date === nowLocal.slice(0, 10) &&
        s.scheduleType === 'OPERATING' &&
        s.openingTime &&
        s.closingTime
    ) ?? null;
  let openPct: number | null = null;
  let closePct: number | null = null;
  if (todaySchedule) {
    const open = toLocalIso(Date.parse(todaySchedule.openingTime!), timezone);
    const close = toLocalIso(Date.parse(todaySchedule.closingTime!), timezone);
    if (open.slice(0, 10) === nowLocal.slice(0, 10)) {
      openPct = xForMinutes(localMinutes(open));
      // Parks closing after midnight run to the edge of the chart.
      closePct =
        close.slice(0, 10) > nowLocal.slice(0, 10) ? 100 : xForMinutes(localMinutes(close));
      if (closePct <= openPct) closePct = 100;
    }
  }

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
    const today = nowLocal.slice(0, 10);
    for (const [kind, startsAt, endsAt] of events) {
      if (!startsAt) continue;
      const startLocal = toLocalIso(Date.parse(startsAt), timezone);
      const endLocal = endsAt ? toLocalIso(Date.parse(endsAt), timezone) : null;
      if (startLocal.slice(0, 10) > today) continue; // starts on a later day
      if (endLocal && endLocal.slice(0, 10) < today) continue; // ended on an earlier day
      const fromPct = startLocal.slice(0, 10) < today ? 0 : xForMinutes(localMinutes(startLocal));
      // Unknown or after-midnight end → run to the edge of the chart.
      const toPct =
        endLocal && endLocal.slice(0, 10) === today ? xForMinutes(localMinutes(endLocal)) : 100;
      if (toPct <= fromPct) continue;
      warnings.push({ kind, fromPct, toPct, startLocal, endLocal });
    }
  }

  const fmtTime = (localIso: string) =>
    new Date(`${localIso}Z`).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  const fmtHour = (localIso: string) =>
    new Date(`${localIso}Z`).toLocaleTimeString(locale, {
      hour: 'numeric',
      timeZone: 'UTC',
    });

  return (
    <div className={cn('min-w-0', className)}>
      <div className="relative h-28">
        {/* Park opening hours band */}
        {openPct != null && closePct != null && (
          <div
            className="border-primary/30 bg-primary/[0.07] pointer-events-none absolute inset-y-0 border-x border-dashed"
            style={{ left: `${openPct}%`, width: `${closePct - openPct}%` }}
            aria-hidden="true"
          />
        )}

        {/* Severe-weather windows (storm / hail / thunderstorm) */}
        {warnings.map(({ kind, fromPct, toPct, startLocal, endLocal }, i) => {
          const { icon: WarnIcon, band, iconColor } = WARNING_STYLES[kind];
          const range = `${fmtTime(startLocal)}${endLocal ? ` – ${fmtTime(endLocal)}` : ''}`;
          return (
            <div
              key={kind}
              className={cn('pointer-events-none absolute inset-y-0 border-x', band)}
              style={{ left: `${fromPct}%`, width: `${toPct - fromPct}%` }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* Stacked per warning so overlapping windows don't bury each
                      other's icon. */}
                  <span
                    className="pointer-events-auto absolute left-1/2 z-10 -translate-x-1/2"
                    style={{ top: `${4 + i * 18}px` }}
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
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
              <stop offset="80%" stopColor="currentColor" stopOpacity="0.02" />
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
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </svg>

        {/* Rain bars + per-hour tooltip hit areas */}
        <div className="absolute inset-0 flex">
          {points.map((p, i) => {
            const mm = p.precipitationMm ?? 0;
            const barPct =
              mm > 0 ? Math.min(RAIN_AREA_PCT, Math.max(8, (mm / rainScale) * RAIN_AREA_PCT)) : 0;
            const isPast = (i + 1) * 60 <= nowMinutes;
            const prob = p.precipitationProbability;
            const { icon: HourIcon, label, color } = getWeatherConfig(p.weatherCode ?? 0, p.isDay);
            const ariaLabel = `${fmtTime(p.time)} · ${
              p.temperatureC != null ? `${Math.round(p.temperatureC)}°C · ` : ''
            }${mm.toFixed(1)} mm${prob != null ? ` · ${prob}% ${tNowcast('precipProbability')}` : ''}`;
            return (
              <Tooltip key={p.time}>
                <TooltipTrigger asChild>
                  <div className="relative min-w-0 flex-1" aria-label={ariaLabel}>
                    {barPct > 0 && (
                      <div
                        className={cn(
                          'absolute inset-x-[15%] bottom-0 rounded-t-[2px] bg-sky-400/85',
                          isPast && 'opacity-40'
                        )}
                        style={{ height: `${barPct}%` }}
                      />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="flex flex-col gap-1 tabular-nums">
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3 shrink-0 opacity-70" aria-hidden="true" />
                      {fmtTime(p.time)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <HourIcon className={cn('size-3 shrink-0', color)} aria-hidden="true" />
                      {p.temperatureC != null && (
                        <>
                          <Temp celsius={p.temperatureC} />
                          {' · '}
                        </>
                      )}
                      {t(label)}
                    </span>
                    {mm > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Droplets className="size-3 shrink-0 opacity-70" aria-hidden="true" />
                        <Precip mm={mm} />
                      </span>
                    )}
                    {prob != null && prob > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Umbrella className="size-3 shrink-0 opacity-70" aria-hidden="true" />
                        {prob}% {tNowcast('precipProbability')}
                      </span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* "Now" marker */}
        <div
          className="border-foreground/30 pointer-events-none absolute inset-y-0 border-l border-dashed"
          style={{ left: `${nowPct}%` }}
          aria-hidden="true"
        />
        {nowTempY != null && (
          <div
            className="ring-background pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 ring-2"
            style={{ left: `${nowPct}%`, top: `${nowTempY}%` }}
            aria-hidden="true"
          />
        )}
        {/* "Now" label — anchored just above the dot on the curve (not glued to the
            chart's top edge); hidden when it would collide with the max-temp label. */}
        {showNowLabel && nowTempY != null && (
          <span
            className="text-foreground/60 pointer-events-none absolute -translate-x-1/2 -translate-y-full pb-2.5 text-[9px] leading-none font-medium"
            style={{ left: `${clampX(nowPct)}%`, top: `${nowTempY}%` }}
            aria-hidden="true"
          >
            {t('nowLabel')}
          </span>
        )}

        {/* Min/max temperature labels, anchored to their hours */}
        <span
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full pb-0.5 text-[10px] font-semibold tabular-nums"
          style={{ left: `${clampX(xFor(maxIdx))}%`, top: `${yFor(maxTemp)}%` }}
        >
          <Temp celsius={maxTemp} />
        </span>
        <span
          className="text-muted-foreground pointer-events-none absolute -translate-x-1/2 pt-0.5 text-[10px] font-medium tabular-nums"
          style={{ left: `${clampX(xFor(minIdx))}%`, top: `${yFor(minTemp)}%` }}
        >
          <Temp celsius={minTemp} />
        </span>
      </div>

      {/* Axis: weather icon + hour label every 3 hours, aligned with the columns */}
      <div className="mt-1 flex">
        {points.map((p, i) => {
          if (i % 3 !== 0) return <div key={p.time} className="min-w-0 flex-1" />;
          const { icon: HourIcon, color } = getWeatherConfig(p.weatherCode ?? 0, p.isDay);
          const isPast = (i + 1) * 60 <= nowMinutes;
          return (
            <div
              key={p.time}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5',
                isPast && 'opacity-50'
              )}
            >
              <HourIcon className={cn('h-3.5 w-3.5 shrink-0', color)} aria-hidden="true" />
              <span className="text-muted-foreground text-center text-[9px] leading-tight tabular-nums">
                {fmtHour(p.time)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
