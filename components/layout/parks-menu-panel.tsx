'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { CountryFlag } from '@/components/common/icons/flags';
import { translateContinent, translateCountry } from '@/lib/i18n/helpers';
import type { GeoMenuContinent } from '@/lib/navigation/geo-menu';
import type { FeaturedParkCard } from '@/lib/navigation/featured-parks-menu';
import { useRowReveal } from '@/lib/hooks/use-menu-reveal';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useMounted } from '@/lib/hooks/use-mounted';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { CROWD_TEXT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { formatDistance } from '@/lib/utils/distance-utils';
import type { NearbyParksData, ParkWithDistance } from '@/types/nearby';
import type { ParkStatus } from '@/lib/api/types';

/**
 * The parks menu, as a full-width band: continent columns and a photo rail over one detail row.
 *
 * ```
 * ┌──────────────────────────────────────────────────────────┬───────────────────┐
 * │ NORDAMERIKA 85  ASIEN 72     EUROPA 49    OZEANIEN 5     │ BELIEBTE PARKS    │
 * │ 🇺🇸 USA     81  🇨🇳 China 57 🇫🇷 Frankr. 10 🇦🇺 Austral. 5 │ ┌─────┐ ┌─────┐   │
 * │ 🇨🇦 Kanada   2  🇯🇵 Japan  5 🇩🇪 Deutschl. 9              │ │Europa│ │Phant│  │
 * │ 🇲🇽 Mexiko   2  …            …             SÜDAMERIKA 1  │ └─────┘ └─────┘   │
 * ├──────────────────────────────────────────────────────────┴───────────────────┤
 * │ 🇩🇪 DEUTSCHLAND · 9 Parks                          2 weitere Städte →         │
 * │ RUST            BOTTROP        BRÜHL        GÜNZBURG     HASSLOCH            │
 * │ Europa-Park     Movie Park     Phantasial.  LEGOLAND     Plopsaland          │
 * │ Rulantica                                                                     │
 * └───────────────────────────────────────────────────────────────────────────────┘
 *     all 28 links in the HTML          fixed set              fetched on hover
 * ```
 *
 * Going full width removed machinery rather than adding it. The narrow version had a continent
 * rail and swapped one country list in for another, so four of the five were `display:none` at any
 * moment and the panel needed an `activeContinent`. At the container's width all 28 links fit side
 * by side: nothing to switch, nothing hidden.
 *
 * Three kinds of content, and the difference matters:
 *
 * - **Continents and countries** are server-rendered into every page — 28 hub links worth
 *   concentrating sitewide weight on.
 * - **The photo rail** is a fixed four, resolved server-side. Not a thumbnail per park: the media
 *   database holds a picture for 14 of 212 parks, so a photo on every row would be nine pictures
 *   and two hundred empty boxes. See `lib/navigation/featured-parks-menu.ts`.
 * - **Cities and their parks** are fetched when a country opens. 144 cities and 212 parks in the
 *   header template would put 356 more targets into the link graph of ~35,000 pages, for pages the
 *   country hubs and the sitemap already reach.
 *
 * The detail row holds its height whether or not a country is open — it fills in under the pointer
 * as the fetch lands, and a band that resized while somebody was reading it would be worse.
 */

/** Cities in the detail row: one per column, five columns wide. */
const CITY_COLUMNS = 5;

/**
 * How long the pointer has to rest on a country before the detail row follows it.
 *
 * Long enough that crossing a row on the way down to the detail row never registers, short enough
 * that resting on one feels immediate. 140 ms sits above a deliberate pause and well below the
 * ~250 ms it takes to notice a delay.
 */
const COUNTRY_DWELL_MS = 140;

/** Parks in the nearby rail. Six rows is the height the 2×2 photo grid already occupied. */
const NEARBY_LIMIT = 6;

interface CityEntry {
  slug: string;
  name: string;
  parkCount: number;
  parks: { slug: string; name: string; image?: string | null; imagePosition?: string }[];
}

interface ParksMenuPanelProps {
  continents: GeoMenuContinent[];
  featured: FeaturedParkCard[];
}

export function ParksMenuPanel({ continents, featured }: ParksMenuPanelProps) {
  /*
   * Die Parks in Reichweite, im selben Streifen wie die kuratierten.
   *
   * Kostenlos: der Header ruft `useHomeNearbyParks()` ohnehin für die „In der Nähe"-Pille, das
   * Panel hängt sich an dieselbe Query. Und die Daten tragen bereits alles, was der Streifen
   * zeigen soll — Entfernung, Status, Ø-Wartezeit, offene Attraktionen und ein server-seitig
   * aufgelöstes `backgroundImage`; nichts davon muss nachgeholt werden.
   *
   * Wo nichts in der Nähe ist — kein Standort freigegeben, oder wirklich nichts in Reichweite —
   * bleibt es bei den kuratierten Parks. Ein leerer Streifen wäre schlechter als ein Vorschlag.
   */
  const tCommon = useTranslations('common');
  const minuteLabel = tCommon('minuteShort');
  const { data: nearbyData } = useHomeNearbyParks();
  const nearbyParks =
    nearbyData?.type === 'nearby_parks' ? (nearbyData.data as NearbyParksData).parks : [];
  /*
   * Erst nach dem Mount umschalten, und das ist kein Feinschliff.
   *
   * `useHomeNearbyParks` seedet seine Query aus `localStorage` (`placeholderData`/`initialData`,
   * siehe den Hook). Auf dem Server gibt es die nicht, im ERSTEN Client-Render schon — das Panel
   * hätte also serverseitig die kuratierten Parks gerendert und im ersten Client-Render die Parks
   * in Reichweite. Zwei verschiedene Bäume an derselben Stelle sind ein Hydration-Fehler, und
   * React wirft daraufhin den Teilbaum weg und rendert ihn neu. Weil dieses Panel im Header
   * steckt, hieße das: auf JEDER Seite, mitsamt der GSAP-Transforms, die der Header-Reveal auf
   * die Leiste gelegt hat — von außen sieht das aus wie „nach dem Scrollen fehlen Elemente".
   */
  const mounted = useMounted();
  const showNearby = mounted && nearbyParks.length > 0;
  const t = useTranslations('geo');
  const tNav = useTranslations('navigation');
  const locale = useLocale();
  const [activeCountry, setActiveCountry] = useState<{
    continent: string;
    country: string;
    code: string;
  } | null>(null);
  const [cities, setCities] = useState<Record<string, CityEntry[]>>({});
  /** Countries already requested. A ref, not the `cities` state: it has to be readable and
   *  writable inside the effect without making the effect depend on what it writes. */
  const requested = useRef<Set<string>>(new Set());

  const countryKey = activeCountry ? `${activeCountry.continent}/${activeCountry.country}` : null;

  useEffect(() => {
    if (!countryKey) return;
    // One request per country for the life of the tab — the key is marked before the fetch starts,
    // so a pointer wandering back and forth over the same row cannot queue a second one.
    if (requested.current.has(countryKey)) return;
    requested.current.add(countryKey);

    // NOT cancelled when the pointer moves on. The response is a cache write keyed by country, so
    // it is the right answer whatever is hovered by the time it lands — and discarding it while
    // leaving the key in `requested` is what made countries stop loading altogether: skim past one
    // and its result was thrown away, the guard above then refused to ask again, and the row sat
    // on its skeleton for the rest of the session. Every country you pass on the way down to the
    // detail row is one you skim past, so it happened constantly.
    fetch(`/api/nav/geo/${countryKey}`)
      .then((r) => (r.ok ? r.json() : { cities: [] }))
      .then((data: { cities?: CityEntry[] }) =>
        setCities((prev) => ({ ...prev, [countryKey]: data.cities ?? [] }))
      )
      .catch(() => {
        // Let the next hover try again rather than caching a failure for the session — the country
        // link above still works in the meantime.
        requested.current.delete(countryKey);
      });
  }, [countryKey]);

  /*
   * Hover has to be *rested* on, not merely crossed.
   *
   * The detail row sits under the country columns, so the way to it from any country leads over
   * the countries below it. Switching on `pointerenter` meant that trip rewrote the row two or
   * three times before the pointer arrived, and it landed on whichever country happened to be last
   * — the row was effectively unreachable for the country you actually wanted.
   *
   * So entering a row only *arms* the switch, and leaving before the dwell is up disarms it. Rest
   * on a country and it commits; cross it on the way somewhere else and it never fires. Focus is
   * exempt: a keyboard user lands on exactly the country they meant.
   */
  const dwellRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disarm = () => {
    if (dwellRef.current !== null) {
      clearTimeout(dwellRef.current);
      dwellRef.current = null;
    }
  };
  const arm = (next: { continent: string; country: string; code: string }) => {
    disarm();
    dwellRef.current = setTimeout(() => {
      dwellRef.current = null;
      setActiveCountry(next);
    }, COUNTRY_DWELL_MS);
  };
  const commit = (next: { continent: string; country: string; code: string }) => {
    disarm();
    setActiveCountry(next);
  };
  useEffect(() => disarm, []);

  const detail = countryKey ? cities[countryKey] : undefined;
  const rowRef = useRowReveal(countryKey && `${countryKey}:${detail ? 'ready' : 'pending'}`);
  const shown = detail?.slice(0, CITY_COLUMNS) ?? [];
  const hidden = detail ? detail.length - shown.length : 0;

  return (
    <div>
      <div className="flex flex-col gap-5 xl:flex-row xl:gap-6">
        {/* Level 1 + 2 — every continent and every country, all of it in the first HTML. */}
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-x-6 gap-y-5 lg:grid-cols-5">
          {continents.map((continent) => (
            <div key={continent.slug} data-menu-stagger>
              <SectionHeading
                label={translateContinent(t, continent.slug, locale, continent.name)}
                count={continent.parkCount}
                href={`/parks/${continent.slug}`}
              />
              <ul className="space-y-px">
                {continent.countries.map((country) => {
                  const isActive =
                    activeCountry?.continent === continent.slug &&
                    activeCountry.country === country.slug;
                  return (
                    <li key={country.slug}>
                      <Link
                        href={`/parks/${continent.slug}/${country.slug}`}
                        prefetch={false}
                        onPointerEnter={() => arm(target(continent.slug, country))}
                        onPointerLeave={disarm}
                        onFocus={() => commit(target(continent.slug, country))}
                        className={`-mx-2 flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors ${
                          isActive
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                        }`}
                      >
                        <CountryFlag code={country.code} />
                        <span className="min-w-0 flex-1 truncate">
                          {translateCountry(t, country.slug, locale, country.name)}
                        </span>
                        <span className="text-muted-foreground/70 text-xs tabular-nums">
                          {country.parkCount}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* The photo rail. Hidden below `xl`: the five country columns need the room first, and a
            2×2 photo grid stacked under them would push the detail row off the screen. */}
        {featured.length > 0 && (
          <div
            data-menu-stagger
            className="border-border/60 hidden w-80 shrink-0 border-l pl-6 xl:block"
          >
            <SectionHeading
              label={showNearby ? tNav('nearby') : tNav('popularParks')}
              href="/parks"
            />
            {showNearby ? (
              <ul className="flex flex-col gap-1.5">
                {nearbyParks.slice(0, NEARBY_LIMIT).map((park) => (
                  <NearbyRow key={park.id} park={park} minuteLabel={minuteLabel} />
                ))}
              </ul>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {featured.map((park) => (
                  <Link
                    key={park.slug}
                    href={park.href as '/'}
                    prefetch={false}
                    className="group focus-visible:ring-ring relative block aspect-[16/10] overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Image
                      src={park.image}
                      alt=""
                      fill
                      sizes="160px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* The scrim is what makes the name legible on a bright photo — the cards are
                      145 px wide and there is no room to put the label anywhere else. */}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <span className="absolute right-2.5 bottom-2 left-2.5 block">
                      <span className="block text-[13px] leading-tight font-semibold text-white">
                        {park.name}
                      </span>
                      <span className="mt-px block truncate text-[10.5px] text-white/70">
                        {park.city}
                        {park.city && park.countrySlug ? ' · ' : ''}
                        {park.countrySlug ? translateCountry(t, park.countrySlug, locale) : ''}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Level 3 — the open country's cities and parks. `rowRef` re-settles it whenever it fills
          with a different country; the key includes whether the data has landed, so the skeleton →
          cities swap animates too rather than snapping. */}
      <div
        ref={rowRef}
        data-menu-stagger
        className="border-border/60 mt-5 min-h-[7.5rem] border-t pt-4"
      >
        {activeCountry == null ? (
          <p className="text-muted-foreground/70 text-xs">{t('exploreByRegion')}</p>
        ) : (
          <>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className="translate-y-[1px]">
                  <CountryFlag code={activeCountry.code} />
                </span>
                <span className="text-foreground text-xs font-semibold tracking-wide uppercase">
                  {translateCountry(t, activeCountry.country, locale)}
                </span>
              </span>
              {/* Never a silent cut: the US has 50 cities and this row shows five. */}
              {hidden > 0 && (
                <Link
                  href={`/parks/${activeCountry.continent}/${activeCountry.country}`}
                  prefetch={false}
                  className="text-primary hover:text-primary/80 shrink-0 text-xs font-medium transition-colors"
                >
                  {tNav('moreCities', { count: hidden })}
                </Link>
              )}
            </div>
            {detail === undefined ? (
              <div className="grid grid-cols-3 gap-x-6 lg:grid-cols-5" aria-hidden="true">
                {Array.from({ length: CITY_COLUMNS }, (_, i) => (
                  <div key={i} data-row-stagger className="space-y-1.5">
                    <div className="bg-muted/60 h-2.5 w-16 animate-pulse rounded" />
                    <div className="bg-muted/60 h-3.5 w-full animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="grid grid-cols-3 items-start gap-x-6 gap-y-3 lg:grid-cols-5">
                {shown.map((city) => (
                  <li key={city.slug} data-row-stagger>
                    <Link
                      href={`/parks/${activeCountry.continent}/${activeCountry.country}/${city.slug}`}
                      prefetch={false}
                      className="text-muted-foreground/70 hover:text-foreground mb-0.5 block truncate text-[11px] tracking-wide uppercase transition-colors"
                    >
                      {city.name}
                    </Link>
                    <ul className="space-y-px">
                      {city.parks.map((park) => (
                        <li key={park.slug}>
                          <Link
                            href={`/parks/${activeCountry.continent}/${activeCountry.country}/${city.slug}/${park.slug}`}
                            prefetch={false}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted/60 group -mx-2 flex items-center gap-2 rounded-md px-2 py-0.5 text-sm transition-colors"
                          >
                            {/* Kein reservierter Kasten: die Mediendatenbank hat für 14 von 212
                                Parks ein Bild, ein Platzhalter je Zeile wäre in dieser Liste fast
                                überall eine leere Kachel. Wo eines ist, trägt es die Zeile. */}
                            {park.image && (
                              <span className="bg-muted relative block h-6 w-6 shrink-0 overflow-hidden rounded">
                                <Image
                                  src={park.image}
                                  alt=""
                                  fill
                                  sizes="24px"
                                  className="object-cover"
                                  style={{ objectPosition: park.imagePosition }}
                                />
                              </span>
                            )}
                            <span className="min-w-0 flex-1 truncate">{park.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** What a hovered country row hands to the detail row below it. */
function target(continent: string, country: { slug: string; code: string }) {
  return { continent, country: country.slug, code: country.code };
}

/** The rule above each column — a link where there is a hub to link to. */
function SectionHeading({ label, count, href }: { label: string; count?: number; href?: string }) {
  const inner = (
    <>
      <span className="truncate">{label}</span>
      {count != null && (
        <span className="text-muted-foreground/70 text-[11px] font-normal tabular-nums">
          {count}
        </span>
      )}
    </>
  );
  const className =
    'border-border/60 mb-2 flex items-baseline justify-between gap-2 border-b pb-1.5 text-xs font-semibold tracking-wide uppercase';

  if (!href) return <div className={`${className} text-foreground`}>{inner}</div>;
  return (
    <Link
      href={href as '/'}
      prefetch={false}
      className={`${className} text-foreground hover:text-primary transition-colors`}
    >
      {inner}
    </Link>
  );
}

/**
 * One nearby park in the rail: picture where there is one, and the four values somebody standing
 * somewhere actually wants — how far, whether it is open, how busy, how long the queues are.
 *
 * Ø and crowd only while the park is running: a closed one aggregates over an empty set and
 * reports the same thing a park with no wait-time source reports.
 */
function NearbyRow({ park, minuteLabel }: { park: ParkWithDistance; minuteLabel: string }) {
  const operating = park.status === 'OPERATING';
  const wait =
    operating && park.analytics?.avgWaitTime != null
      ? roundWaitTo5(park.analytics.avgWaitTime)
      : null;

  return (
    <li>
      <Link
        href={convertApiUrlToFrontendUrl(park.url) as '/'}
        prefetch={false}
        className="group hover:bg-muted/60 -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors"
      >
        <span className="bg-muted relative block h-9 w-9 shrink-0 overflow-hidden rounded-md">
          {park.backgroundImage && (
            <Image
              src={park.backgroundImage}
              alt=""
              fill
              sizes="36px"
              className="object-cover"
              style={{ objectPosition: park.backgroundPosition }}
            />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-foreground group-hover:text-primary block truncate text-[13px] font-semibold transition-colors">
            {park.name}
          </span>
          <span className="text-muted-foreground block truncate text-[11px]">
            {formatDistance(park.distance)}
            {park.operatingAttractions != null && operating
              ? ` · ${park.operatingAttractions}/${park.totalAttractions}`
              : ''}
          </span>
        </span>
        {wait !== null ? (
          <span className="shrink-0 text-right text-sm font-semibold tabular-nums">
            <span className={CROWD_TEXT_CLASS[waitTimeCrowdTier(wait)]}>{wait}</span>
            <span className="text-muted-foreground ml-0.5 text-[10px] font-normal">
              {minuteLabel}
            </span>
          </span>
        ) : (
          <ParkStatusBadge
            status={park.status as ParkStatus}
            className="shrink-0 px-1.5 py-0 text-[10px]"
          />
        )}
      </Link>
    </li>
  );
}
