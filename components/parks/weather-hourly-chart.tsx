'use client';

import { useEffect, useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Clock, CloudHail, CloudLightning, Droplets, Umbrella, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Temp, Precip } from '@/components/common/unit-display';
import { HeatWarningBadge, isHeatWarning } from './heat-warning-badge';
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

// Temperature palette (concrete colours; the normal 10–30 band is amber-400, the
// same as the SVG's `currentColor`). Drives the now-dot, mirroring the line gradient.
const TEMP_PALETTE: [number, string][] = [
  [30, '#ef4444'], // hot
  [26, '#fbbf24'], // amber-400 (= currentColor)
  [10, '#fbbf24'],
  [5, '#38bdf8'], // cool
  [0, '#2563eb'], // cold
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
  const s = TEMP_PALETTE;
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
  const tempLineGradientId = useId();

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

  const liveTemp = nowcast?.currentTemperatureC ?? null;

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

  const xFor = (i: number) => ((i + 0.5) / n) * 100;
  const yFor = (tempC: number) =>
    TEMP_BOTTOM - ((tempC - minTemp) / span) * (TEMP_BOTTOM - TEMP_TOP);
  // Map a park-local time of day onto the x-axis (centre-of-hour offset, like xFor).
  const xForMinutes = (min: number) => Math.min(Math.max(((min / 60 + 0.5) / n) * 100, 0), 100);

  // "Now" position + temperature. Prefer the LIVE nowcast value so the dot, peak
  // and header agree (and "now" tracks live); else interpolate the hourly curve.
  const nowMinutes =
    parseInt(nowLocal.slice(11, 13), 10) * 60 + parseInt(nowLocal.slice(14, 16), 10);
  const nowPct = xForMinutes(nowMinutes);
  const u = nowMinutes / 60;
  const i0 = Math.min(Math.max(Math.floor(u), 0), n - 2);
  const frac = Math.min(Math.max(u - i0, 0), 1);
  const t0 = points[i0].temperatureC;
  const t1 = points[i0 + 1].temperatureC;
  const interpNow = t0 != null && t1 != null ? t0 + (t1 - t0) * frac : null;
  const nowTemp = liveTemp ?? interpNow;
  const nowTempY = nowTemp != null ? yFor(nowTemp) : null;
  const nowTempColor = nowTemp != null ? tempColorAt(nowTemp) : undefined;

  // Line: the hourly curve with the live "now" point spliced in (by time) so the
  // curve passes through it and the dot sits on the line.
  const hourlyPts = points
    .map((p, i) => (p.temperatureC != null ? { x: xFor(i), y: yFor(p.temperatureC) } : null))
    .filter((p): p is { x: number; y: number } => p !== null);
  const linePts =
    liveTemp != null && nowTempY != null
      ? [
          ...hourlyPts.filter((p) => Math.abs(p.x - nowPct) > 100 / n / 3),
          { x: nowPct, y: nowTempY },
        ].sort((a, b) => a.x - b.x)
      : hourlyPts;
  const lineD = smoothPath(linePts);

  // Temperature-tinted line: a vertical gradient whose stops sit at the y of each
  // threshold temp. Since the y-axis IS temperature, only the part of the curve
  // in a band takes that colour, with a smooth transition between. `currentColor`
  // (the SVG's amber) is the normal 10–30 °C band, so it looks unchanged there;
  // only > 30 °C (hot/red) and < 10 °C (cool → cold/blue) diverge.
  const TEMP_COLORS: [number, string][] = [
    [30, '#ef4444'], // hot
    [26, 'currentColor'], // back to the normal colour just below 30
    [10, 'currentColor'], // normal band (10–26 °C)
    [5, '#38bdf8'], // cool
    [0, '#2563eb'], // cold (and below, via clamp)
  ];
  let runOff = 0;
  const tempLineStops = TEMP_COLORS.map(([temp, color]) => {
    runOff = Math.max(runOff, Math.min(1, Math.max(0, yFor(temp) / 100)));
    return { offset: runOff, color };
  });
  // Same colours under the curve, faded top→bottom — a subtle temperature wash.
  const tempFillStops = tempLineStops.map((s) => ({
    ...s,
    opacity: Math.max(0.03, 0.24 - 0.2 * s.offset),
  }));
  const areaD = `${lineD} L ${linePts[linePts.length - 1].x.toFixed(2)} 100 L ${linePts[0].x.toFixed(2)} 100 Z`;

  // Rain bars: scale against a fixed "moderate rain fills the area" top, but
  // stretch the scale when an heavier peak would clip.
  const peakMm = Math.max(...points.map((p) => p.precipitationMm ?? 0));
  const rainScale = Math.max(RAIN_SCALE_TOP_MM, peakMm);

  // Min/max label anchors. The live temp sits at "now" when it's the day's extreme.
  const clampX = (x: number) => Math.min(Math.max(x, 7), 93);
  const hourlyMax = Math.max(...valid);
  const hourlyMin = Math.min(...valid);
  const maxAtNow = liveTemp != null && liveTemp >= hourlyMax;
  const maxX = maxAtNow ? nowPct : xFor(temps.indexOf(maxTemp));
  const minX = liveTemp != null && liveTemp <= hourlyMin ? nowPct : xFor(temps.indexOf(minTemp));
  // The max label and the "now" marker both live near the top — when the day's
  // peak is around the current hour they collide, so drop the "Now" text then.
  const showNowLabel = Math.abs(clampX(maxX) - nowPct) > 10;

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
            className="ring-background pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
            style={{ left: `${nowPct}%`, top: `${nowTempY}%`, backgroundColor: nowTempColor }}
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
          className={cn(
            'pointer-events-none absolute inline-flex -translate-x-1/2 -translate-y-full items-center gap-0.5 text-[10px] font-semibold tabular-nums',
            // A touch of clearance when the peak label sits right above the "now" dot.
            maxAtNow ? 'pb-1.5' : 'pb-0.5'
          )}
          style={{ left: `${clampX(maxX)}%`, top: `${yFor(maxTemp)}%` }}
        >
          <Temp celsius={maxTemp} />
          {isHeatWarning(maxTemp) && <HeatWarningBadge label={t('heatWarning')} size="1.3em" />}
        </span>
        <span
          className="text-muted-foreground pointer-events-none absolute -translate-x-1/2 pt-0.5 text-[10px] font-medium tabular-nums"
          style={{ left: `${clampX(minX)}%`, top: `${yFor(minTemp)}%` }}
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
