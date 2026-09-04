'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Precip, Temp } from '@/components/common/unit-display';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { isWet, type WeatherRailGroup, type WeatherRailSegment } from '@/lib/planner/weather-rail';

interface PlannerWeatherRailProps {
  segments: readonly WeatherRailSegment[];
}

/**
 * The band down the edge of the day, and what it says when you point at it.
 *
 * It lives in the HOUR GUTTER, not on the canvas, and that is the whole reason
 * it can exist at all: the canvas is where the blocks are, its three lanes are
 * already documented down to 112 px on a phone, and a rail in flow beside them
 * would come out of the ride names. The gutter is 44 px (40 on a phone) and
 * carries one `text-[11px]` label per hour AT the hour line — so its left edge
 * and everything between two hour lines is empty space that costs nothing.
 *
 * **The band paints, it does not caption.** It used to stack a 10 px weather
 * glyph over a 9 px millimetre figure at every hour the weather turned, in a
 * gutter already holding an hour number — three type sizes and two vocabularies
 * in a 44 px column, and no reader could say what any of it meant. Nothing that
 * small is a label. So the column is the colour and the strength of the colour,
 * which is the "when" a plan is actually read for, and the words arrive on
 * demand: point at an hour and the hint names it in full — hour, condition,
 * temperature and millimetres, at a size a sentence can be read at.
 *
 * The hit area is `w-6` over a `w-1.5` band, the same split the block's drag
 * grip uses: a 6 px target is a target nobody hits, and widening the paint to
 * meet the pointer would put the weather back over the hour numbers.
 *
 * The colours are `getWeatherConfig`'s, one layer coarser: that map returns a
 * TEXT colour per code and the band needs a fill, and a 6 px column cannot carry
 * fifteen distinguishable hues anyway. The hint keeps the full vocabulary.
 */
export function PlannerWeatherRail({ segments }: PlannerWeatherRailProps) {
  const t = useTranslations('parks.weather');
  const locale = useLocale();
  const [hovered, setHovered] = useState<number | null>(null);

  if (segments.length === 0) return null;

  const active = hovered === null ? null : (segments.find((s) => s.hour === hovered) ?? null);

  return (
    /* NO `z-index` on this root, and that is load-bearing rather than tidy: a
       positioned element with one becomes a stacking context, and the hint
       below is then trapped inside it however high its own `z-40` is — it
       rendered UNDER the blocks, which is the one place a tooltip may not be.
       The band's slices carry the `z-0` instead; they are what has to stay
       behind everything. */
    <div className="absolute inset-0" data-planner-weather-rail="">
      {/* The band. Continuous by construction — every hour on the axis the
          forecast covers gets a slice, whether or not anything changed. */}
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

      {/* One target per hour, over the band and wider than it. `w-6` and not
          the gutter's full width: the hour numbers sit to the right of this and
          a hint that opens when the pointer is merely near a number is a hint
          nobody asked for. */}
      <div className="absolute inset-y-0 left-0 w-6" onPointerLeave={() => setHovered(null)}>
        {segments.map((segment) => (
          <button
            key={`hit-${segment.hour}`}
            type="button"
            tabIndex={-1}
            aria-label={labelTitle(
              t(getWeatherConfig(segment.code ?? 0, true).label),
              segment,
              locale
            )}
            className="absolute inset-x-0 cursor-help"
            style={{ top: segment.y, height: segment.height }}
            onPointerEnter={() => setHovered(segment.hour)}
            onFocus={() => setHovered(segment.hour)}
          />
        ))}
      </div>

      {/* The hint. Anchored to the hovered hour and drawn to the RIGHT of the
          band, over the canvas — the gutter has no room for a sentence, which
          is what the labels this replaced were trying to prove otherwise. */}
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

      {/* The whole band as prose, for a reader who cannot point at it. One entry
          per hour the weather TURNS, which is the same sparseness the drawn
          labels had and the reason they existed. */}
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

/**
 * The band's fill per group.
 *
 * Full class strings, never `bg-${group}` — Tailwind's scanner has to see them,
 * the same rule `crowd-level-styles.ts` states for the crowd palette.
 */
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
 * How strongly an hour is painted.
 *
 * A dry hour recedes and a wet one comes forward, so the band reads as "when",
 * not merely as "what" — which is the question somebody planning a day actually
 * has. The ramp is the amount, not the condition: two hours of `rain` at 0.2 and
 * 2.4 mm are a drizzle and a soaking, and one flat alpha would draw them the
 * same. A thunderstorm is painted at full strength whatever it drops, because
 * the ride closures follow the lightning rather than the rain gauge.
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
 * The sentence behind the colour.
 *
 * The millimetres go in as plain text rather than through `Precip`: this string
 * is not markup, so the `.u-metric`/`.u-imperial` pair has nothing to switch,
 * and the hint's own figure beside it answers for the reader's unit. It is
 * still formatted for the LOCALE — `toFixed` writes "0.4 mm", which is a
 * different number to every reader of a German sentence.
 */
function labelTitle(condition: string, segment: WeatherRailSegment, locale: string): string {
  const hour = `${String(segment.hour).padStart(2, '0')}:00`;
  if (!isWet(segment)) return `${hour} · ${condition}`;
  const mm = (segment.mm ?? 0).toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${hour} · ${condition} · ${mm} mm`;
}
