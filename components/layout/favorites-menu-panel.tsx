'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { FavoritesHowTo } from '@/components/parks/favorites-how-to';
import { useFavorites } from '@/lib/hooks/use-favorites';
import { useFavoriteCounts } from '@/lib/hooks/use-favorite-counts';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useMounted } from '@/lib/hooks/use-mounted';
import { FavoriteStar } from '@/components/common/favorite-star';
import { formatDistance } from '@/lib/utils/distance-utils';
import type { NearbyParksData, ParkWithDistance } from '@/types/nearby';
import { CROWD_TEXT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { stripNewPrefix } from '@/lib/utils';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import {
  buildRestaurantUrl,
  buildShowUrl,
  convertApiUrlToFrontendUrl,
} from '@/lib/utils/url-utils';
import type {
  FavoriteAttraction,
  FavoritePark,
  FavoriteRestaurant,
  FavoriteShow,
} from '@/lib/api/favorites';
import type { AttractionStatus, CrowdLevel, ParkStatus } from '@/lib/api/types';

/**
 * The favorites menu's contents — cards in the full-width band, rows in the 300 px burger sheet.
 *
 * Three things it is built around:
 *
 * 1. **It does not fetch until it is opened.** The header renders on every one of ~35,000 pages;
 *    an ungated `useFavorites()` here would put a `/api/favorites` request on all of them for
 *    every visitor who has ever starred anything. `open` is the gate, and the query key is shared
 *    with the homepage band, so opening the menu there resolves from cache.
 * 2. **Two shapes, because the two hosts are 1100 px apart.** The band gets cards with the photo
 *    the favorites proxy already attaches (`enrichParksWithImages`) and the wait time set large —
 *    that is what somebody opens this for. The sheet gets rows: a card grid in a 300 px column is
 *    one card per screen.
 * 3. **The picture is optional and the layout is not.** The media database holds an image for 14
 *    of 212 parks, so most cards fall back to a tinted field carrying the park's own crowd colour.
 *    Its box is identical either way — a grid that reflows depending on which parks somebody
 *    happens to have starred reads as broken.
 *
 * Everything here reads `favorites`, `common`, `geo` and `parks.status`, all of which the layout
 * chrome already carries. `ParkCard`/`AttractionCard` would drag `parks` + `attractions` into the
 * chrome payload of every page, which is what the homepage band fetches a lazy chunk to avoid.
 */

/**
 * Cards per group before the rest collapses into a "+N" line.
 *
 * Two rows of four at the band's widest. The grid below fills as many columns as fit, so this is
 * a cap on how much of the menu one group may take, not a column count.
 */
const MAX_CARDS = 8;
/** Rows per group in the sheet, where they are cheaper. */
const MAX_ROWS = 5;

/** Parks offered for one-tap starring while the list is still empty. */
const SUGGESTION_LIMIT = 5;

/** The tint a card without a photo gets, from the park's own crowd level. Full class names. */
const CROWD_FIELD: Record<string, string> = {
  very_low: 'from-crowd-very-low/25',
  low: 'from-crowd-low/25',
  moderate: 'from-crowd-moderate/25',
  high: 'from-crowd-high/25',
  very_high: 'from-crowd-very-high/25',
  extreme: 'from-crowd-extreme/25',
};

function standbyWait(attraction: FavoriteAttraction): number | null {
  const standby = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  return standby?.waitTime ?? null;
}

/** The wait time as the card's headline figure — the reason somebody opened this menu. */
function WaitFigure({ minutes, unit }: { minutes: number; unit: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span
        className={`text-2xl leading-none font-bold tabular-nums ${CROWD_TEXT_CLASS[waitTimeCrowdTier(minutes)]}`}
      >
        {minutes}
      </span>
      <span className="text-muted-foreground text-[11px]">{unit}</span>
    </span>
  );
}

/**
 * One favorite as a card: picture on top, name and place under it, the figure in the footer.
 *
 * `aspect-[16/10]` rather than a fixed height: the band is fluid between 1024 and 1536 px, and a
 * fixed picture height turns into a different crop at every width instead of the same one scaled.
 */
function Card({
  href,
  title,
  subtitle,
  image,
  imagePosition,
  crowd,
  figure,
  badge,
}: {
  href: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  imagePosition?: string;
  crowd?: CrowdLevel | null;
  figure?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const tint = crowd && crowd !== 'unknown' ? CROWD_FIELD[crowd] : null;

  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        className="group border-border/60 bg-card/40 hover:border-primary/40 flex h-full flex-col overflow-hidden rounded-xl border transition-colors"
      >
        <span className="bg-muted relative block aspect-[16/10] overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="(min-width: 1280px) 220px, 180px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ objectPosition: imagePosition }}
            />
          ) : (
            <span
              className={`absolute inset-0 bg-gradient-to-br to-transparent ${tint ?? 'from-primary/15'}`}
              aria-hidden="true"
            />
          )}
          {badge && <span className="absolute top-2 right-2">{badge}</span>}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5 p-3">
          <span className="text-foreground group-hover:text-primary truncate text-sm font-semibold transition-colors">
            {title}
          </span>
          {subtitle && (
            <span className="text-muted-foreground truncate text-xs">{subtitle}</span>
          )}
          {figure && <span className="mt-1.5 block">{figure}</span>}
        </span>
      </Link>
    </li>
  );
}

/** The sheet's shape: thumbnail, two lines, the figure on the right. */
function Row({
  href,
  title,
  subtitle,
  image,
  imagePosition,
  trailing,
}: {
  href: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  imagePosition?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        className="hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors"
      >
        {/* The box is always drawn, picture or not: a row that indents depending on which park it
            is reads as a rendering fault. */}
        <span className="bg-muted relative block h-10 w-10 shrink-0 overflow-hidden rounded-lg">
          {image && (
            <Image
              src={image}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
              style={{ objectPosition: imagePosition }}
            />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-foreground block truncate text-sm font-medium">{title}</span>
          {subtitle && (
            <span className="text-muted-foreground block truncate text-xs">{subtitle}</span>
          )}
        </span>
        {trailing && <span className="shrink-0 text-right">{trailing}</span>}
      </Link>
    </li>
  );
}

function GroupHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="text-foreground border-border/60 mb-2.5 flex items-center justify-between gap-2 border-b pb-1.5 text-xs font-semibold tracking-wide uppercase">
      <span>{title}</span>
      <span className="text-muted-foreground/70 tabular-nums">{count}</span>
    </div>
  );
}

function CardSkeletons({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: Math.min(count, MAX_CARDS) }).map((_, i) => (
        <li key={i} className="border-border/60 overflow-hidden rounded-xl border">
          <Skeleton className="aspect-[16/10] rounded-none" />
          <div className="p-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-1.5 h-3 w-20" />
            <Skeleton className="mt-2 h-5 w-12" />
          </div>
        </li>
      ))}
    </>
  );
}

function RowSkeletons({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: Math.min(count, MAX_ROWS) }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-2 py-1.5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <span className="min-w-0 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-1 h-3 w-16" />
          </span>
        </li>
      ))}
    </>
  );
}

export function FavoritesMenuPanel({
  open,
  variant = 'band',
}: {
  open: boolean;
  /**
   * `band` is the full-width header panel, `sheet` the 300 px burger column.
   *
   * Not cosmetic: every `sm:`/`lg:` below is a VIEWPORT query, and the sheet is 300 px wide at
   * every viewport that shows it — including 640–1023 px, where the burger is still the whole
   * navigation.
   */
  variant?: 'band' | 'sheet';
}) {
  const t = useTranslations('favorites');
  const tCommon = useTranslations('common');
  const tGeo = useTranslations('geo');
  const tNav = useTranslations('navigation');
  const counts = useFavoriteCounts();
  // `poll: false` — the menu is on screen for seconds. The homepage band is the surface that
  // stays open long enough for a five-minute refresh to mean anything, and it keeps its own.
  const { data, isPending } = useFavorites({ enabled: open && counts.total > 0, poll: false });
  const minuteLabel = tCommon('minuteShort');
  const isSheet = variant === 'sheet';

  /*
   * Vorschläge für den leeren Zustand.
   *
   * Dieselbe Query, die der Header für die „In der Nähe"-Pille und das Parkmenü ohnehin stellt —
   * keine zusätzliche Anfrage. `useMounted` ist Pflicht und kein Feinschliff: der Hook seedet aus
   * `localStorage`, ohne das Gatter stünde serverseitig keine Zeile und im ersten Client-Render
   * eine, und React würde den Teilbaum wegwerfen (siehe #360).
   */
  const mounted = useMounted();
  const { data: nearbyData } = useHomeNearbyParks();
  const suggestions =
    mounted && nearbyData?.type === 'nearby_parks'
      ? (nearbyData.data as NearbyParksData).parks.slice(0, isSheet ? 3 : SUGGESTION_LIMIT)
      : [];
  const more = (hidden: number) => t('more', { count: hidden });

  if (counts.total === 0) {
    /*
     * In the sheet two lines, in the band the whole guide.
     *
     * The three steps stacked in a 300 px column are 358 px tall — 58 % of the entire burger menu
     * on a 390×844 phone, for a state with nothing to show. That menu is the whole navigation
     * there. The sentence that matters is the second step anyway: where the star is.
     */
    if (isSheet) {
      return (
        <div data-menu-stagger className="flex gap-3">
          <Star className="text-muted-foreground/60 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            <span className="text-foreground block text-sm font-semibold">{t('empty')}</span>
            <span className="text-muted-foreground block text-xs leading-relaxed">
              {t('howTo.starText')}
            </span>
          </span>
        </div>
      );
    }

    return (
      /* Der leere Zustand steht mittig, der gefüllte nicht: hier gibt es nichts zu vergleichen,
         nur eine Anleitung und ein paar Vorschläge, und ein linksbündiger Block in einem
         1400 px breiten Band hätte rechts eine leere Hälfte. Sobald Favoriten da sind, ordnen
         sich die Karten wieder an ihrer Kante — dann ist die Spalte die Struktur. */
      <div data-menu-stagger className="flex flex-col items-center text-center">
        <p className="text-foreground inline-flex items-center gap-2 text-sm font-semibold">
          <Star className="text-muted-foreground/60 h-4 w-4" aria-hidden="true" />
          {t('empty')}
        </p>
        {/* `max-w-3xl`: über die volle Bandbreite wäre jeder der drei Schritte 460 px breit für
            zwei Zeilen Text, und die Anleitung liefe quer durch den Bildschirm statt sich lesen
            zu lassen. */}
        <FavoritesHowTo className="mt-4 w-full max-w-3xl text-left" />
        {suggestions.length > 0 && (
          <div className="border-border/60 mt-5 w-full max-w-3xl border-t pt-4">
            <span className="text-muted-foreground mb-2.5 block text-[11px] font-semibold tracking-wide uppercase">
              {tNav('nearby')}
            </span>
            {/* Der Stern steht NEBEN dem Link, nicht darin: verschachtelt würde ein Klick darauf
                zur Parkseite navigieren, statt den Park zu markieren. Genau das ist hier aber der
                Sinn — ein Tippen, und das Panel füllt sich. */}
            <ul className="flex flex-wrap justify-center gap-2">
              {suggestions.map((park) => (
                <SuggestionChip key={park.id} park={park} />
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const loading = isPending || !data;
  const cap = isSheet ? MAX_ROWS : MAX_CARDS;
  /*
   * „Alle anzeigen" nur, wenn es etwas zu sehen gibt, das hier nicht steht.
   *
   * Der Link stand immer da, auch wenn drei Favoriten in ein Band mit Platz für sechzehn passen —
   * dann führt er auf eine Seite, die exakt dasselbe zeigt. Sichtbar wird er, wenn eine Gruppe
   * über ihre Obergrenze läuft oder wenn Shows und Restaurants dabei sind: die rendert dieses
   * Panel als eigene Gruppe, aber ohne Bild und Kennzahl, und die Startseite zeigt sie
   * vollständig.
   */
  const hiddenParks = Math.max(0, counts.parks - cap);
  const hiddenAttractions = Math.max(0, counts.attractions - cap);
  const hiddenVenues = Math.max(0, counts.shows + counts.restaurants - cap);
  const somethingHidden = hiddenParks + hiddenAttractions + hiddenVenues > 0;
  /*
   * Die Breite folgt der Anzahl, die Spaltenzahl der Breite.
   *
   * Vorher waren es zwei starre Hälften: wer nur Parks markiert hat, sah eine halbleere linke
   * Spalte neben einer leeren rechten, und wer zwei Parks und zwölf Bahnen hat, bekam für beide
   * gleich viel Platz. `flex-grow` nach Anzahl teilt das Band proportional auf — eine einzige
   * Gruppe bekommt damit automatisch die volle Breite —, und das Kartenraster darin füllt mit
   * `auto-fill` so viele Spalten, wie hineinpassen, und bricht sonst um. Beides zusammen ist das
   * „mehr Bahnen, mehr Platz, notfalls mehr Zeilen", ohne eine einzige Breakpoint-Regel.
   */
  const listClass = isSheet ? 'space-y-px' : 'grid gap-3';
  const gridStyle: React.CSSProperties | undefined = isSheet
    ? undefined
    : { gridTemplateColumns: 'repeat(auto-fill, minmax(10.5rem, 1fr))' };
  const groupStyle = (count: number): React.CSSProperties | undefined =>
    isSheet ? undefined : { flexGrow: count, flexBasis: 0 };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="text-foreground inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
          <Star className="text-primary h-4 w-4 fill-current" aria-hidden="true" />
          {t('title')}
        </span>
        {somethingHidden && (
          <Link
            href="/#favorites"
            prefetch={false}
            className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
          >
            {tCommon('viewAll')}
          </Link>
        )}

        {counts.shows + counts.restaurants > 0 && (
          <div
            data-menu-stagger
            className="min-w-0"
            style={groupStyle(counts.shows + counts.restaurants)}
          >
            <GroupHeading
              title={counts.shows > 0 ? t('shows') : t('restaurants')}
              count={counts.shows + counts.restaurants}
            />
            <ul className={isSheet ? 'space-y-px' : 'space-y-px'}>
              {loading ? (
                <RowSkeletons count={counts.shows + counts.restaurants} />
              ) : (
                <>
                  {venueRows(data.shows, data.restaurants)
                    .slice(0, cap)
                    .map((venue) => (
                      <Row
                        key={venue.id}
                        href={venue.href}
                        title={venue.title}
                        subtitle={venue.park}
                      />
                    ))}
                  <MoreLine hidden={hiddenVenues} label={more} />
                </>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className={isSheet ? 'space-y-5' : 'flex flex-col gap-6 lg:flex-row lg:gap-8'}>
        {counts.parks > 0 && (
          <div data-menu-stagger className="min-w-0" style={groupStyle(counts.parks)}>
            <GroupHeading title={t('parks')} count={counts.parks} />
            <ul className={listClass} style={gridStyle}>
              {loading ? (
                isSheet ? (
                  <RowSkeletons count={counts.parks} />
                ) : (
                  <CardSkeletons count={counts.parks} />
                )
              ) : (
                <>
                  {data.parks.slice(0, isSheet ? MAX_ROWS : MAX_CARDS).map((park) => (
                    <ParkEntry
                      key={park.id}
                      park={park}
                      isSheet={isSheet}
                      minuteLabel={minuteLabel}
                      country={translateGeoSlug(tGeo, 'countries', park.country, park.country)}
                    />
                  ))}
                  <MoreLine
                    hidden={counts.parks - Math.min(data.parks.length, isSheet ? MAX_ROWS : MAX_CARDS)}
                    label={more}
                  />
                </>
              )}
            </ul>
          </div>
        )}

        {counts.attractions > 0 && (
          <div data-menu-stagger className="min-w-0" style={groupStyle(counts.attractions)}>
            <GroupHeading title={t('attractions')} count={counts.attractions} />
            <ul className={listClass} style={gridStyle}>
              {loading ? (
                isSheet ? (
                  <RowSkeletons count={counts.attractions} />
                ) : (
                  <CardSkeletons count={counts.attractions} />
                )
              ) : (
                <>
                  {data.attractions
                    .slice(0, isSheet ? MAX_ROWS : MAX_CARDS)
                    .map((attraction) => (
                      <AttractionEntry
                        key={attraction.id}
                        attraction={attraction}
                        isSheet={isSheet}
                        minuteLabel={minuteLabel}
                      />
                    ))}
                  <MoreLine
                    hidden={
                      counts.attractions -
                      Math.min(data.attractions.length, isSheet ? MAX_ROWS : MAX_CARDS)
                    }
                    label={more}
                  />
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function MoreLine({ hidden, label }: { hidden: number; label: (n: number) => string }) {
  if (hidden <= 0) return null;
  return (
    <li className="col-span-full px-2 pt-1">
      <Link
        href="/#favorites"
        prefetch={false}
        className="text-muted-foreground hover:text-foreground text-xs transition-colors"
      >
        {label(hidden)}
      </Link>
    </li>
  );
}

function ParkEntry({
  park,
  isSheet,
  minuteLabel,
  country,
}: {
  park: FavoritePark;
  isSheet: boolean;
  minuteLabel: string;
  country: string;
}) {
  const href = convertApiUrlToFrontendUrl(park.url);
  const title = stripNewPrefix(park.name);
  const operating = park.status === 'OPERATING';
  // Ø and crowd only for a park that is actually running: a closed one aggregates over an empty
  // set and reports the same thing a park with no wait-time source reports.
  const wait =
    operating && park.analytics?.avgWaitTime != null
      ? roundWaitTo5(park.analytics.avgWaitTime)
      : null;
  const badge = <ParkStatusBadge status={park.status as ParkStatus} className="px-1.5 py-0 text-[10px]" />;

  if (isSheet) {
    return (
      <Row
        href={href}
        title={title}
        subtitle={[park.city, country].filter(Boolean).join(' · ')}
        image={park.backgroundImage}
        imagePosition={park.backgroundPosition}
        trailing={
          wait !== null ? (
            <span className="text-sm font-semibold tabular-nums">
              <span className={CROWD_TEXT_CLASS[waitTimeCrowdTier(wait)]}>{wait}</span>
              <span className="text-muted-foreground ml-1 text-xs font-normal">{minuteLabel}</span>
            </span>
          ) : (
            badge
          )
        }
      />
    );
  }

  return (
    <Card
      href={href}
      title={title}
      subtitle={[park.city, country].filter(Boolean).join(' · ')}
      image={park.backgroundImage}
      imagePosition={park.backgroundPosition}
      crowd={operating ? park.analytics?.crowdLevel : null}
      badge={badge}
      figure={
        wait !== null ? (
          <WaitFigure minutes={wait} unit={minuteLabel} />
        ) : (
          <span className="text-muted-foreground text-xs">
            {park.operatingAttractions != null
              ? `${park.operatingAttractions}/${park.totalAttractions}`
              : `${park.totalAttractions}`}
          </span>
        )
      }
    />
  );
}

function AttractionEntry({
  attraction,
  isSheet,
  minuteLabel,
}: {
  attraction: FavoriteAttraction;
  isSheet: boolean;
  minuteLabel: string;
}) {
  const href = convertApiUrlToFrontendUrl(attraction.url);
  const title = stripNewPrefix(attraction.name);
  const parkName = attraction.park ? stripNewPrefix(attraction.park.name) : null;
  // `effectiveStatus`, never the raw `status`: a ride out of season is closed, and the raw field
  // does not know that. See `docs/api/seasonal-attractions.md`.
  const status = (attraction.effectiveStatus ??
    attraction.status ??
    'CLOSED') as AttractionStatus;
  const operating = status === 'OPERATING';
  const raw = standbyWait(attraction);
  const wait = operating && raw !== null ? roundWaitTo5(raw) : null;
  const badge = <ParkStatusBadge status={status} className="px-1.5 py-0 text-[10px]" />;

  if (isSheet) {
    return (
      <Row
        href={href}
        title={title}
        subtitle={parkName}
        image={attraction.backgroundImage}
        imagePosition={attraction.backgroundPosition}
        trailing={
          wait !== null ? (
            <span className="text-sm font-semibold tabular-nums">
              <span className={CROWD_TEXT_CLASS[waitTimeCrowdTier(wait)]}>{wait}</span>
              <span className="text-muted-foreground ml-1 text-xs font-normal">{minuteLabel}</span>
            </span>
          ) : (
            badge
          )
        }
      />
    );
  }

  return (
    <Card
      href={href}
      title={title}
      subtitle={parkName}
      image={attraction.backgroundImage}
      imagePosition={attraction.backgroundPosition}
      crowd={operating ? attraction.crowdLevel : null}
      badge={badge}
      figure={wait !== null ? <WaitFigure minutes={wait} unit={minuteLabel} /> : null}
    />
  );
}


/**
 * Shows und Restaurants in einer Gruppe, als Zeilen.
 *
 * Sie bekommen keine Karte: die Mediendatenbank hat für keinen von beiden ein Bild, und eine
 * Kennzahl gibt es auch nicht — eine Karte wäre eine leere Fläche mit einem Namen darin. Beide
 * haben zudem keine eigene Seite; sie leben auf der Parkseite unter ihrem Reiter, weshalb der
 * Link dorthin geht.
 *
 * Der Grund, warum es diese Gruppe überhaupt (wieder) gibt: der Umbau auf Karten hat sie
 * herausgeworfen, und wer nur eine Show markiert hatte, öffnete danach ein leeres Menü mit einer
 * Zahl am Stern.
 */
function venueRows(shows: FavoriteShow[], restaurants: FavoriteRestaurant[]) {
  const parkHref = (url: string | undefined) => {
    if (!url) return null;
    const converted = convertApiUrlToFrontendUrl(url);
    return converted !== '#' && converted.startsWith('/parks/') ? converted : null;
  };

  return [
    ...shows.map((show) => ({
      id: show.id,
      title: stripNewPrefix(show.name),
      park: show.park ? stripNewPrefix(show.park.name) : null,
      base: parkHref(show.url),
      build: buildShowUrl,
    })),
    ...restaurants.map((restaurant) => ({
      id: restaurant.id,
      title: stripNewPrefix(restaurant.name),
      park: restaurant.park ? stripNewPrefix(restaurant.park.name) : null,
      base: parkHref(restaurant.url),
      build: buildRestaurantUrl,
    })),
  ].map((v) => ({
    id: v.id,
    title: v.title,
    park: v.park,
    // Ohne auflösbare Parkseite bleibt das Favoritenband der Startseite der einzige Ort, an dem
    // der Eintrag noch zu sehen ist.
    href: v.base ? v.build(v.base) : '/#favorites',
  }));
}


/**
 * Ein Parkvorschlag: antippbar zum Öffnen, mit einem Stern daneben zum Markieren.
 *
 * Der leere Zustand erklärt bisher, wo der Stern sitzt — und schickt den Leser damit weg, um ihn
 * zu suchen. Die Parks in Reichweite stehen ohnehin schon in der Antwort, die der Header für
 * seine Pille holt; sie hier anzubieten macht aus der Anleitung eine Handlung.
 */
function SuggestionChip({ park }: { park: ParkWithDistance }) {
  return (
    <li className="border-border/70 bg-card/40 hover:border-primary/40 flex items-center gap-1 rounded-full border py-1 pr-1 pl-1 transition-colors">
      <Link
        href={convertApiUrlToFrontendUrl(park.url) as '/'}
        prefetch={false}
        className="group flex min-w-0 items-center gap-2 pr-1"
      >
        <span className="bg-muted relative block h-6 w-6 shrink-0 overflow-hidden rounded-full">
          {park.backgroundImage && (
            <Image
              src={park.backgroundImage}
              alt=""
              fill
              sizes="24px"
              className="object-cover"
              style={{ objectPosition: park.backgroundPosition }}
            />
          )}
        </span>
        <span className="text-foreground group-hover:text-primary truncate text-[13px] font-medium transition-colors">
          {stripNewPrefix(park.name)}
        </span>
        <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
          {formatDistance(park.distance)}
        </span>
      </Link>
      <FavoriteStar type="park" id={park.id} name={park.name} size="sm" />
    </li>
  );
}
