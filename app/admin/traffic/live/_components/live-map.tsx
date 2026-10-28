'use client';

import { useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { countryName, formatCount, formatShare } from '@/lib/admin/site-analytics';
import { liveDrillHref, pickRipples, risenKeys } from '@/lib/admin/live-traffic';
import { countryShadePercent } from '@/lib/admin/world-map';
import type { LiveTraffic } from '@/lib/api/admin-site-analytics';
import { LoadingState } from '../../../_ui/primitives';
import { useCountryPaths } from '../../_lib/country-paths';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

/** What the map remembers between answers: the last views per country and the rings in flight. */
interface RippleState {
  views: ReadonlyMap<string, number> | null;
  ripples: Ripple[];
  serial: number;
}

/** More rings than this in flight means a tab woke up to a backlog; the oldest go first. */
const MAX_RINGS_IN_FLIGHT = 12;

/**
 * The world map of the last five minutes, each country lit by its share of the views and rippling
 * when its count rose. A lit country also carries a point at its centre, so Luxembourg is not lost.
 * Without `animate` there are no ripples and the shades change at once. Pressing a country opens
 * today's Traffic filtered to it.
 */
export function LiveMap({
  countries,
  animate,
  locale,
}: {
  countries: LiveTraffic['countries'];
  animate: boolean;
  locale: Locale | null;
}) {
  const router = useRouter();
  const { data, error } = useCountryPaths();
  const glowId = `live-glow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [hover, setHover] = useState<string | null>(null);

  const views = useMemo(
    () => new Map(countries.map((item) => [item.country.toUpperCase(), item.views])),
    [countries]
  );
  const total = countries.reduce((sum, item) => sum + item.views, 0);
  const max = Math.max(1, ...countries.map((item) => item.views));

  // The previous answer is compared during render, the way React keeps a value from the last one:
  // an effect would paint the new shades a frame before their ripples.
  const [rings, setRings] = useState<RippleState>({ views: null, ripples: [], serial: 0 });
  if (data && rings.views !== views) {
    const risen = animate ? pickRipples(risenKeys(rings.views, views), data.anchors) : [];
    const fresh = risen.map((iso, index) => ({ id: rings.serial + index, ...data.anchors[iso] }));
    setRings({
      views,
      ripples: [...rings.ripples, ...fresh].slice(-MAX_RINGS_IN_FLIGHT),
      serial: rings.serial + fresh.length,
    });
  }

  if (error) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        Die Karte konnte nicht geladen werden.
      </p>
    );
  }
  if (!data) return <LoadingState label="Lade Karte…" />;

  const { width, height } = data.size;
  const hovered = hover ? { name: countryName(hover), count: views.get(hover) ?? 0 } : null;
  const lit = Object.keys(data.paths).filter((iso) => (views.get(iso) ?? 0) > 0);
  const transition = animate ? 'transition-[fill,opacity] duration-700 ease-out' : '';

  return (
    <div>
      <div className="relative bg-[radial-gradient(ellipse_at_50%_40%,color-mix(in_oklab,var(--color-primary)_9%,transparent),transparent_70%)]">
        <svg
          viewBox={data.viewBox}
          className="block h-auto w-full"
          aria-hidden="true"
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>
          {Object.entries(data.paths).map(([iso, d]) => {
            const strength = countryShadePercent(views.get(iso) ?? 0, max, 1);
            return (
              <path
                key={iso}
                d={d}
                onPointerEnter={() => setHover(iso)}
                onClick={() => router.push(liveDrillHref('country', iso.toLowerCase(), locale))}
                className={`stroke-background cursor-pointer ${transition}`}
                strokeWidth={0.6}
                strokeLinejoin="round"
                style={{
                  fill:
                    strength > 0
                      ? `color-mix(in oklab, var(--color-primary) ${strength}%, oklch(0.27 0.035 241))`
                      : 'color-mix(in oklab, var(--color-muted-foreground) 16%, transparent)',
                }}
              />
            );
          })}
          <g filter={`url(#${glowId})`} className="pointer-events-none mix-blend-screen">
            {lit.map((iso) => (
              <path
                key={iso}
                d={data.paths[iso]}
                className={`fill-primary ${transition} starting:opacity-0`}
                // Squared, so a country with a trace of views gets a trace of glow; a big one lit
                // as brightly as Germany would read as the busiest.
                style={{ opacity: 0.9 * ((views.get(iso) ?? 0) / max) }}
              />
            ))}
          </g>
        </svg>

        {/* A container, so a ripple is sized in percent of the map and stays small on a phone. */}
        <div
          aria-hidden="true"
          className="[container-type:inline-size] pointer-events-none absolute inset-0"
        >
          {lit.map((iso) => {
            const anchor = data.anchors[iso];
            if (!anchor) return null;
            const share = Math.sqrt((views.get(iso) ?? 0) / max);
            const size = 3 + share * 5;
            return (
              <span
                key={iso}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-100 ${
                  animate ? 'transition-[width,height,opacity] duration-700 starting:opacity-0' : ''
                }`}
                style={{
                  left: `${(anchor.x / width) * 100}%`,
                  top: `${(anchor.y / height) * 100}%`,
                  width: size,
                  height: size,
                  opacity: 0.55 + share * 0.45,
                  boxShadow: `0 0 ${4 + share * 10}px ${1 + share * 3}px color-mix(in oklab, var(--color-primary) 80%, transparent)`,
                }}
              />
            );
          })}
          {animate &&
            rings.ripples.map((ripple) => (
              <span
                key={ripple.id}
                className="absolute"
                style={{
                  left: `${(ripple.x / width) * 100}%`,
                  top: `${(ripple.y / height) * 100}%`,
                }}
                onAnimationEnd={(event) => {
                  if (!(event.target as HTMLElement).dataset.last) return;
                  setRings((current) => ({
                    ...current,
                    ripples: current.ripples.filter((item) => item.id !== ripple.id),
                  }));
                }}
              >
                <span className="live-ripple-ring" />
                <span className="live-ripple-ring" data-last="true" />
              </span>
            ))}
        </div>
      </div>
      <p aria-live="polite" className="text-muted-foreground mt-2 min-h-4 text-xs tabular-nums">
        {hovered ? (
          <>
            <span className="text-foreground font-medium">{hovered.name}</span>
            {': '}
            {formatCount(hovered.count)} Aufrufe (
            {formatShare(total > 0 ? hovered.count / total : 0)})
          </>
        ) : (
          'Land antippen: Traffic von heute, nach diesem Land gefiltert'
        )}
      </p>
    </div>
  );
}
