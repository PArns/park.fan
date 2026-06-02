'use client';

import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { WeatherNowcastStep } from '@/lib/api/types';

interface NowcastPrecipTimelineProps {
  steps: WeatherNowcastStep[];
  /** Forecast snapshot time (UTC ISO). Used as the stable reference for "now". */
  observedAt: string;
  /** Park timezone — step times are naive park-local, so we compare in that zone. */
  timezone: string;
  /** Tailwind text-color class for the bars (matches the banner kind). */
  colorClass: string;
  className?: string;
}

// Rain intensity buckets in mm per 15-min slot — same thresholds the API uses.
const LIGHT_MAX_MM = 0.625;
const HEAVY_MIN_MM = 1.9;
// mm mapped to a full-height bar; heavier slots cap at 100%. Sits just above the
// "heavy" threshold so a heavy slot nearly fills the chart.
const SCALE_TOP_MM = 2.25;

// Threshold lines as a share of the chart height (the "scale" overlaid on the bars).
const MODERATE_LINE_PCT = (LIGHT_MAX_MM / SCALE_TOP_MM) * 100;
const HEAVY_LINE_PCT = (HEAVY_MIN_MM / SCALE_TOP_MM) * 100;

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

/**
 * Compact bar chart of upcoming precipitation (mm per slot) for the nowcast
 * banner. Step times are naive park-local strings, so we filter/label them in
 * the park timezone and use `observedAt` (stable across SSR) as the reference
 * time. The window auto-sizes to the actual rain event. Renders nothing when no
 * rain is forecast in the remaining series.
 */
export function NowcastPrecipTimeline({
  steps,
  observedAt,
  timezone,
  colorClass,
  className,
}: NowcastPrecipTimelineProps) {
  const locale = useLocale();
  const t = useTranslations('parks.weatherNowcast');

  // Slot length derived from the series (the diff is timezone-independent).
  const slotMs =
    steps.length >= 2 ? Date.parse(steps[1].time) - Date.parse(steps[0].time) : 15 * 60_000;

  // Drop slots whose 15-min window has fully passed, compared in park-local time.
  const cutoff = toLocalIso(Date.parse(observedAt) - slotMs, timezone);
  const upcoming = steps.filter((s) => s.time.slice(0, 16) >= cutoff);

  // Auto-size to the rain event: up to the last wet slot, plus one dry slot for context.
  const lastWet = upcoming.reduce((idx, s, i) => ((s.precipitation ?? 0) > 0 ? i : idx), -1);
  if (lastWet < 0) return null;
  const visible = upcoming.slice(0, lastWet + 2);

  const peakMm = Math.max(...visible.map((s) => s.precipitation ?? 0));
  if (peakMm <= 0) return null;

  const fmtTime = (localIso: string) =>
    new Date(`${localIso}Z`).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });

  const until = fmtTime(visible[visible.length - 1].time);

  return (
    <div
      className={cn(className)}
      role="img"
      aria-label={t('precipTimeline', { until, max: peakMm.toFixed(1) })}
    >
      <div className="relative h-10">
        {/* Threshold reference lines — the scale: above the upper line is "heavy",
            between is "moderate", below is "light". */}
        <div
          className="border-foreground/25 pointer-events-none absolute inset-x-0 border-t border-dashed"
          style={{ bottom: `${HEAVY_LINE_PCT}%` }}
          title={t('intensity.heavy')}
        />
        <div
          className="border-foreground/15 pointer-events-none absolute inset-x-0 border-t border-dashed"
          style={{ bottom: `${MODERATE_LINE_PCT}%` }}
          title={t('intensity.moderate')}
        />
        <div className="flex h-full items-end gap-1">
          {visible.map((s) => {
            const mm = s.precipitation ?? 0;
            // Absolute height: mm against a fixed scale, so a bar's top relative to the
            // threshold lines tells you light / moderate / heavy. Floor keeps a trace visible.
            const heightPct =
              mm > 0 ? Math.min(100, Math.max(14, Math.round((mm / SCALE_TOP_MM) * 100))) : 0;
            const prob = s.precipitationProbability;
            const label = `${fmtTime(s.time)} · ${mm.toFixed(1)} mm${prob != null ? ` · ${prob}%` : ''}`;
            return (
              <div
                key={s.time}
                className="group relative flex h-full flex-1 items-end"
                aria-label={label}
              >
                <div
                  className={cn('w-full rounded-sm bg-current', colorClass)}
                  style={{ height: `${heightPct}%`, opacity: mm > 0 ? 0.85 : 0 }}
                />
                {/* Time + mm on hover (styled so it reads over any banner background). */}
                <div
                  role="tooltip"
                  className="bg-foreground text-background pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap tabular-nums opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums opacity-60">
        <span>{fmtTime(visible[0].time)}</span>
        <span>{until}</span>
      </div>
    </div>
  );
}
