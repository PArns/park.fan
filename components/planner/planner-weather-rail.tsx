'use client';

import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getNumberFormat } from '@/lib/utils/intl-format';
import { Precip, Temp } from '@/components/common/unit-display';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { isWet, type WeatherRailGroup, type WeatherRailSegment } from '@/lib/planner/weather-rail';

interface PlannerWeatherRailProps {
  segments: readonly WeatherRailSegment[];
}

/**
 * The band down the edge of the day, and what it says when you point at it.
 *
 * It lives in the hour gutter, whose left edge is empty space, so it takes nothing from the blocks.
 * The band paints and does not caption: colour and strength say when, and pointing at an hour
 * opens a hint with hour, condition, temperature and millimetres in full. The hit area is `w-6`
 * over a `w-1.5` band, like the block's grip. Colours are `getWeatherConfig`'s, one layer coarser.
 */
export function PlannerWeatherRail({ segments }: PlannerWeatherRailProps) {
  const t = useTranslations('parks.weather');
  const locale = useLocale();
  const [hovered, setHovered] = useState<number | null>(null);
  /**
   * Which kind of pointer started the gesture that ends in a click. Read on `pointerdown`, since
   * `onClick`'s event is not guaranteed to carry `pointerType`.
   */
  const pressType = useRef<string>('mouse');

  if (segments.length === 0) return null;

  const active = hovered === null ? null : (segments.find((s) => s.hour === hovered) ?? null);

  return (
    /* No `z-index` on this root: it would make a stacking context and trap the hint's `z-40` under
       the blocks. The band's slices carry `z-0` instead. */
    <div className="absolute inset-0" data-planner-weather-rail="">
      {/* The band, continuous: every hour the forecast covers gets a slice. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1.5">
        {segments.map((segment) => (
          <div
            key={`band-${segment.hour}`}
            className={cn(
              'absolute inset-x-0 transition-opacity',
              GROUP_FILL[segment.group],
              hovered !== null && hovered !== segment.hour && 'opacity-40!'
            )}
            style={{ top: segment.y, height: segment.height, opacity: fillOpacity(segment) }}
          />
        ))}
      </div>

      {/* One target per hour, wider than the band but not the gutter's full width, so a hint does
          not open when the pointer is merely near an hour number. */}
      <div
        className="absolute inset-y-0 left-0 w-6"
        /* A finger's `pointerleave` arrives as it lifts, so a coarse pointer keeps what it opened
           and closes it with a second tap. */
        onPointerLeave={(event) => {
          if (event.pointerType !== 'touch') setHovered(null);
        }}
      >
        {segments.map((segment) => (
          <button
            key={`hit-${segment.hour}`}
            type="button"
            /* Out of the tab order; the `sr-only` list below carries the whole band as prose. */
            tabIndex={-1}
            aria-label={labelTitle(
              t(getWeatherConfig(segment.code ?? 0, true).label),
              segment,
              locale
            )}
            className="absolute inset-x-0 cursor-help"
            style={{ top: segment.y, height: segment.height }}
            onPointerDown={(event) => {
              pressType.current = event.pointerType;
            }}
            /* Fine pointers only: on touch `pointerenter` comes before `pointerdown`, and the click
               would close what the enter opened. */
            onPointerEnter={(event) => {
              if (event.pointerType !== 'touch') setHovered(segment.hour);
            }}
            /* No `onFocus`: the button is never keyboard-focused, and a tap focuses it, which would
               open the hint just before the toggle closes it. A tap toggles the hint here; a mouse
               is left to hover. */
            onClick={() => {
              if (pressType.current !== 'touch') return;
              setHovered((current) => (current === segment.hour ? null : segment.hour));
            }}
          />
        ))}
      </div>

      {/* The hint, anchored to the hovered hour and drawn to the right of the band over the canvas,
          since the gutter has no room for a sentence. */}
      {active && (
        <div
          role="tooltip"
          className="bg-popover text-popover-foreground ring-border/60 pointer-events-none absolute left-6 z-40 flex -translate-y-1/2 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] whitespace-nowrap shadow-lg ring-1"
          style={{ top: active.y + active.height / 2 }}
        >
          {(() => {
            const config = getWeatherConfig(active.code ?? 0, active.temperatureC !== null);
            const Icon = config.icon;
            return (
              <>
                <Icon className={cn('size-3.5 shrink-0', config.color)} aria-hidden="true" />
                <span className="font-mono tabular-nums">
                  {String(active.hour).padStart(2, '0')}:00
                </span>
                <span>{t(config.label)}</span>
                {active.temperatureC !== null && (
                  <span className="text-muted-foreground tabular-nums">
                    <Temp celsius={active.temperatureC} />
                  </span>
                )}
                {isWet(active) && (
                  <span className="text-muted-foreground tabular-nums">
                    <Precip mm={active.mm ?? 0} />
                  </span>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* The band as prose for a reader who cannot point: one entry per hour the weather turns. */}
      <ul className="sr-only">
        {segments
          .filter((segment) => segment.changes)
          .map((segment) => (
            <li key={`sr-${segment.hour}`}>
              {labelTitle(
                t(getWeatherConfig(segment.code ?? 0, segment.temperatureC !== null).label),
                segment,
                locale
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}

/** The band's fill per group, as full class strings so Tailwind's scanner sees them. */
const GROUP_FILL: Record<WeatherRailGroup, string> = {
  clear: 'bg-amber-400',
  cloud: 'bg-muted-foreground',
  fog: 'bg-slate-400',
  rain: 'bg-sky-400',
  snow: 'bg-blue-300',
  storm: 'bg-yellow-400',
};

/** The mm at which the band stops getting darker. The hourly chart's own top. */
const RAIN_SCALE_TOP_MM = 2.5;

/**
 * How strongly an hour is painted: by the amount of rain, so a drizzle and a soaking differ and the
 * band reads as "when". A thunderstorm is always full strength, since ride closures follow the
 * lightning, not the rain gauge.
 */
function fillOpacity(segment: WeatherRailSegment): number {
  if (segment.group === 'storm') return 0.9;
  if (segment.group === 'rain' || segment.group === 'snow') {
    const mm = segment.mm ?? 0;
    return 0.35 + Math.min(mm / RAIN_SCALE_TOP_MM, 1) * 0.5;
  }
  return 0.25;
}

/**
 * The sentence behind the colour. Millimetres as plain text, since this string is not markup and
 * the hint's own figure answers for the reader's unit, but formatted for the locale.
 */
function labelTitle(condition: string, segment: WeatherRailSegment, locale: string): string {
  const hour = `${String(segment.hour).padStart(2, '0')}:00`;
  if (!isWet(segment)) return `${hour} · ${condition}`;
  const mm = getNumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(segment.mm ?? 0);
  return `${hour} · ${condition} · ${mm} mm`;
}
