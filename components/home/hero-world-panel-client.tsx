'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { GlassCard } from '@/components/common/glass-card';
import { useGeoLiveStats, findOpenParkCount } from '@/lib/hooks/use-geo-live-stats';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { cn } from '@/lib/utils';
import {
  WORLD_MAP_CONTINENTS,
  WORLD_MAP_VIEWBOX,
  type WorldMapContinentSlug,
} from '@/lib/geo/world-map-data';
import type { WorldPanelContinent } from './hero-world-panel';

/**
 * Bubble anchor per continent in world-map viewBox units (0 0 2000 857) — placed over the
 * visual center of each landmass, not the mathematical centroid (Canada/Greenland would pull
 * North America's far north, Siberia would pull Asia's).
 */
const BUBBLE_ANCHORS: Record<WorldMapContinentSlug, { x: number; y: number }> = {
  europe: { x: 1010, y: 178 },
  'north-america': { x: 470, y: 262 },
  'south-america': { x: 640, y: 600 },
  asia: { x: 1430, y: 262 },
  oceania: { x: 1780, y: 640 },
  africa: { x: 1090, y: 470 },
};

/**
 * The hero's right-hand panel: a clickable world map with live open-park counts. Tapping
 * another continent switches the panel in place; tapping the selected one (its bubble or
 * its landmass) navigates to its geo route, and the country chips link to theirs.
 */
export function HeroWorldPanelClient({ continents }: { continents: WorldPanelContinent[] }) {
  const tGeo = useTranslations('geo');
  const tHome = useTranslations('home');
  const router = useRouter();
  const { data: liveGeo } = useGeoLiveStats();

  const [selectedSlug, setSelectedSlug] = useState('europe');
  const chipsRef = useRef<HTMLDivElement>(null);
  /**
   * True only for the panel's own arrival. The bubbles pop in when the map first appears, but
   * NOT when a continent is switched: the selected bubble is a link and the others are buttons,
   * so switching remounts two of them, and a pop there would fire on exactly the two elements
   * the visitor is looking at while the chip row below is already animating.
   */
  const [entering, setEntering] = useState(true);
  useEffect(() => {
    const done = setTimeout(() => setEntering(false), 900);
    return () => clearTimeout(done);
  }, []);
  const selected = continents.find((c) => c.slug === selectedSlug) ?? continents[0];

  const continentBySlug = new Map(continents.map((c) => [c.slug, c]));
  const openCount = (continent: WorldPanelContinent) =>
    findOpenParkCount(liveGeo, continent.slug) ?? continent.initialOpenCount;

  const selectedName = translateGeoSlug(tGeo, 'continents', selected.slug, selected.name);
  const selectedOpen = openCount(selected);

  // GSAP choreographs the continent switch: the chip row is replaced wholesale, and letting
  // the new set flick in staggered reads as the panel answering the click rather than the
  // content teleporting. This is an INTERACTION, so its chunk can load while the visitor is
  // already looking at the map — unlike the hero entrance, which has to own the first frame
  // and is therefore plain CSS.
  useEffect(() => {
    const row = chipsRef.current;
    if (!row) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    import('gsap')
      .then(({ gsap }) => {
        if (cancelled || !chipsRef.current) return;
        ctx = gsap.context(() => {
          gsap.from(gsap.utils.toArray<HTMLElement>('[data-country-chip]'), {
            opacity: 0,
            y: 6,
            scale: 0.96,
            duration: 0.32,
            ease: 'power2.out',
            stagger: 0.025,
            clearProps: 'all',
          });
        }, chipsRef);
      })
      .catch(() => {
        // No animation is a fine outcome — the chips are already in the DOM either way.
      });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [selectedSlug]);

  const handleContinentClick = (slug: string) => {
    if (slug === selected.slug) {
      router.push(`/parks/${slug}` as '/parks/europe');
    } else if (continentBySlug.has(slug)) {
      setSelectedSlug(slug);
    }
  };

  return (
    <GlassCard
      variant="heavy"
      className="border-border/50 overflow-hidden rounded-2xl p-0 shadow-2xl"
    >
      {/* Header: "Parks in Europe" + live open / total.
          aria-live: switching continents replaces this heading, the open/total figure and the
          whole chip row below. Without it a screen-reader user presses a bubble and hears
          nothing about the panel they just changed. */}
      <div
        className="border-border/40 flex items-start justify-between gap-4 border-b px-5 py-4"
        aria-live="polite"
      >
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">
            {tHome('worldPanel.title', { continent: selectedName })}
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {tHome('worldPanel.subtitle', { count: selected.countryCount })}
          </p>
        </div>
        <p className="shrink-0 text-right leading-none">
          <span className="text-status-operating text-3xl font-extrabold tabular-nums">
            {selectedOpen ?? '–'}
          </span>
          <span className="text-muted-foreground ml-1.5 text-sm">
            / {selected.parkCount} {tHome('worldPanel.openWord')}
          </span>
        </p>
      </div>

      {/* World map with one bubble per continent */}
      <div className="bg-muted/20 relative">
        <svg
          viewBox={WORLD_MAP_VIEWBOX}
          className="block h-auto w-full"
          role="presentation"
          aria-hidden="true"
        >
          {WORLD_MAP_CONTINENTS.map((continent) => {
            // The map draws six continents; the API returns only those that have parks. A
            // landmass with no data was still styled as clickable and did nothing at all —
            // it is inert now, and looks it.
            const isInteractive = continentBySlug.has(continent.slug);
            return (
              <path
                key={continent.slug}
                d={continent.d}
                onClick={isInteractive ? () => handleContinentClick(continent.slug) : undefined}
                className={cn(
                  'transition-colors duration-300',
                  isInteractive ? 'cursor-pointer' : 'pointer-events-none',
                  continent.slug === selected.slug ? 'fill-primary/35' : 'fill-foreground/12',
                  isInteractive && continent.slug !== selected.slug && 'hover:fill-foreground/20'
                )}
              />
            );
          })}
        </svg>

        {/* One control per continent — the keyboard and screen-reader path to everything the
            landmasses offer, which is why the <svg> itself stays aria-hidden.

            The SELECTED one is a link, the others are buttons, because that is what they
            actually do: pressing the selected bubble navigates to its parks, pressing another
            switches the panel. It was one `aria-pressed` button for both, which announced a
            toggle that never un-toggles and then navigated away instead. */}
        {continents.map((continent, index) => {
          const anchor = BUBBLE_ANCHORS[continent.slug as WorldMapContinentSlug];
          if (!anchor) return null;
          const isSelected = continent.slug === selected.slug;
          const open = openCount(continent);
          const name = translateGeoSlug(tGeo, 'continents', continent.slug, continent.name);
          const position = {
            left: `${(anchor.x / 2000) * 100}%`,
            top: `${(anchor.y / 857) * 100}%`,
            ...(entering ? { animationDelay: `${index * 0.06}s` } : {}),
          };
          const bubbleClass = cn(
            'absolute inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shadow-sm transition-colors',
            entering && 'hero-bubble-in',
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border/60 bg-background/85 hover:border-primary/50'
          );
          const inner = (
            <>
              <span
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full',
                  isSelected
                    ? 'bg-primary-foreground'
                    : open
                      ? 'bg-status-operating'
                      : 'bg-status-closed/60'
                )}
                aria-hidden="true"
              />
              {name}
              {open != null && <span className="tabular-nums opacity-90">{open}</span>}
            </>
          );

          return isSelected ? (
            <Link
              key={continent.slug}
              href={`/parks/${continent.slug}` as '/parks/europe'}
              prefetch={false}
              style={position}
              className={bubbleClass}
              aria-current="true"
            >
              {inner}
            </Link>
          ) : (
            <button
              key={continent.slug}
              type="button"
              onClick={() => handleContinentClick(continent.slug)}
              style={position}
              className={bubbleClass}
            >
              {inner}
            </button>
          );
        })}
      </div>

      {/* Country chips of the selected continent */}
      <div ref={chipsRef} className="flex flex-wrap gap-2 px-5 pt-4 pb-2">
        {selected.countries.map((country) => {
          const open =
            findOpenParkCount(liveGeo, selected.slug, country.slug) ?? country.initialOpenCount;
          return (
            <Link
              key={country.slug}
              data-country-chip
              href={`/parks/${selected.slug}/${country.slug}` as '/parks/europe'}
              prefetch={false}
              className="border-border/60 bg-background/70 hover:border-primary/50 hover:bg-background inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm shadow-sm transition-colors"
            >
              <span className="font-medium">
                {translateGeoSlug(tGeo, 'countries', country.slug, country.name)}
              </span>
              {open != null &&
                (open > 0 ? (
                  <span className="text-status-operating text-xs font-semibold tabular-nums">
                    {tHome('worldPanel.countryOpen', { count: open })}
                  </span>
                ) : (
                  // "7 geschlossen", not a bare "zu": the chip's job is to say how much is
                  // behind it, and a country with 7 shut parks is a different prospect from one
                  // with a single shut park.
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {tHome('worldPanel.countryClosed', { count: country.parkCount })}
                  </span>
                ))}
            </Link>
          );
        })}
      </div>

      {/* All parks of the continent */}
      <div className="px-5 pt-1 pb-4">
        <Link
          href={`/parks/${selected.slug}` as '/parks/europe'}
          prefetch={false}
          className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
        >
          {tHome('worldPanel.viewAll', { continent: selectedName })}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </GlassCard>
  );
}
