'use client';

import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { WeatherNowcastStep } from '@/lib/api/types';

interface NowcastPrecipTimelineProps {
  steps: WeatherNowcastStep[];
  /** Live clock (ms) so past slots drop off as time passes. */
  now: number;
  /** Tailwind text-color class for the bars (matches the banner kind). */
  colorClass: string;
  timezone?: string;
  className?: string;
}

/**
 * Compact bar chart of upcoming precipitation (mm per slot) for the nowcast
 * banner. The slot length and the window are both derived from the data — the
 * chart auto-sizes to the actual rain event instead of a fixed look-ahead.
 * Renders nothing when no rain is forecast in the remaining series.
 */
export function NowcastPrecipTimeline({
  steps,
  now,
  colorClass,
  timezone,
  className,
}: NowcastPrecipTimelineProps) {
  const locale = useLocale();
  const t = useTranslations('parks.weatherNowcast');

  // Derive the slot length from the series rather than assuming 15 min.
  const slotMs =
    steps.length >= 2 ? Date.parse(steps[1].time) - Date.parse(steps[0].time) : 0;

  const upcoming = steps.filter((s) => {
    const ts = Date.parse(s.time);
    return !Number.isNaN(ts) && ts + slotMs > now; // slot not fully in the past
  });

  // Auto-size to the rain event: everything up to the last wet slot, plus one
  // trailing dry slot for context. No magic window length.
  const lastWet = upcoming.reduce(
    (idx, s, i) => ((s.precipitation ?? 0) > 0 ? i : idx),
    -1
  );
  if (lastWet < 0) return null;
  const visible = upcoming.slice(0, lastWet + 2);

  const peakMm = Math.max(...visible.map((s) => s.precipitation ?? 0));
  if (peakMm <= 0) return null;

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      ...(timezone ? { timeZone: timezone } : {}),
    });

  const until = fmtTime(visible[visible.length - 1].time);

  return (
    <div
      className={cn('mt-3', className)}
      role="img"
      aria-label={t('precipTimeline', { until, max: peakMm.toFixed(1) })}
    >
      <div className="flex h-10 items-end gap-0.5">
        {visible.map((s) => {
          const mm = s.precipitation ?? 0;
          // Height encodes the share of the peak; a floor keeps a trace visible.
          const heightPct = mm > 0 ? Math.max(12, Math.round((mm / peakMm) * 100)) : 0;
          const prob = s.precipitationProbability;
          return (
            <div
              key={s.time}
              className="flex h-full flex-1 items-end"
              title={`${fmtTime(s.time)} · ${mm.toFixed(1)} mm${prob != null ? ` · ${prob}%` : ''}`}
            >
              <div
                className={cn('w-full rounded-sm bg-current', colorClass)}
                style={{ height: `${heightPct}%`, opacity: mm > 0 ? 0.85 : 0 }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] opacity-60">
        <span>{fmtTime(visible[0].time)}</span>
        <span>{until}</span>
      </div>
    </div>
  );
}
