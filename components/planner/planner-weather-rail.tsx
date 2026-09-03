'use client';

import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Precip } from '@/components/common/unit-display';
import { getWeatherConfig } from '@/lib/utils/weather-utils';
import { isWet, type WeatherRailGroup, type WeatherRailSegment } from '@/lib/planner/weather-rail';

interface PlannerWeatherRailProps {
  segments: readonly WeatherRailSegment[];
}

/**
 * The band down the edge of the day and its handful of labels.
 *
 * It lives in the HOUR GUTTER, not on the canvas, and that is the whole reason
 * it can exist at all: the canvas is where the blocks are, its three lanes are
 * already documented down to 112 px on a phone, and a rail in flow beside them
 * would come out of the ride names. The gutter is 44 px (40 on a phone) and
 * carries one `text-[11px]` label per hour AT the hour line — so its left edge
 * and everything between two hour lines is empty space that costs nothing.
 *
 * A label is drawn only where the weather TURNS, which is what the band is for:
 * a figure at every hour is a table, and a table down the side of a plan is
 * read by nobody. Two shapes, never both, because 30 px does not hold an icon
 * and a number side by side — a wet hour prints its millimetres with the icon
 * stacked over them, a dry one prints the icon alone.
 *
 * The colours are `getWeatherConfig`'s, one layer coarser: that map returns a
 * TEXT colour per code and the band needs a fill, and a 6 px column cannot carry
 * fifteen distinguishable hues anyway. The labels keep the full vocabulary.
 */
export function PlannerWeatherRail({ segments }: PlannerWeatherRailProps) {
  const t = useTranslations('parks.weather');
  const locale = useLocale();

  if (segments.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0" data-planner-weather-rail="">
      {/* The band. Continuous by construction — every hour on the axis the
          forecast covers gets a slice, whether or not anything changed. */}
      <div className="absolute inset-y-0 left-0 w-1.5">
        {segments.map((segment) => (
          <div
            key={`band-${segment.hour}`}
            className={cn('absolute inset-x-0', GROUP_FILL[segment.group])}
            style={{ top: segment.y, height: segment.height, opacity: fillOpacity(segment) }}
          />
        ))}
      </div>

      {/* The labels, at the hour's MIDPOINT rather than on its line: the hour
          number is on the line, and the show chips and the now pill are at their
          own exact minute. The midpoint is the one place in this column nothing
          else claims. */}
      {segments
        .filter((segment) => segment.changes)
        .map((segment) => {
          const config = getWeatherConfig(segment.code ?? 0, segment.temperatureC !== null);
          const Icon = config.icon;
          const wet = isWet(segment);
          return (
            <div
              key={`label-${segment.hour}`}
              className="absolute right-0.5 flex -translate-y-1/2 flex-col items-end gap-px"
              style={{ top: segment.y + segment.height / 2 }}
              title={labelTitle(t(config.label), segment, locale)}
            >
              <Icon className={cn('size-2.5 shrink-0', config.color)} aria-hidden="true" />
              {wet && (
                <span className="text-muted-foreground text-[9px] leading-none tabular-nums">
                  <Precip mm={segment.mm ?? 0} />
                </span>
              )}
              <span className="sr-only">{labelTitle(t(config.label), segment, locale)}</span>
            </div>
          );
        })}
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
 * The sentence behind the glyph.
 *
 * A 10 px icon in a gutter is not a label, so the readable version lives in a
 * `title` for a pointer and in an `sr-only` span for a screen reader. The
 * millimetres go in as plain text rather than through `Precip`: this string is
 * not markup, so the `.u-metric`/`.u-imperial` pair has nothing to switch, and
 * the visible figure beside it already answers for the reader's unit. It is
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
