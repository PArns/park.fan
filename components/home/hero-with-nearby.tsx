'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ArrowDown, Compass } from 'lucide-react';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useGlobalStats } from '@/lib/hooks/use-global-stats';
import { useMounted } from '@/lib/hooks/use-mounted';
import { PARK_COMPASS_ID, useCompassPresent } from '@/lib/home/compass-presence';
import { parkGeoFromUrl } from '@/lib/planner/park-url';
import { stripNewPrefix, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { HeroParkActions, type HeroPark } from '@/components/home/hero-park-actions';
import { LatestNewsChip, type LatestNews } from '@/components/blog/latest-news-chip';
import type {
  NearbyAttractionsData,
  NearbyParksData,
  NearbyParkInfo,
  ParkWithDistance,
} from '@/types/nearby';
import { IN_PARK_FALLBACK_DISTANCE_M } from '@/types/nearby';

/** Only show "Park is nearby" hero subline when nearest park is within this (m). */
const NEAR_PARK_HERO_RADIUS_M = 5000; // 5 km

/** Sentence fallbacks when neither the SSR seed nor the live overlay has counts yet. */
const FALLBACK_COUNTS = { openParks: null, parks: 200, attractions: 7000 };

/** Seed for the live counts, baked into the static shell by <HeroStats>. */
export interface HeroInitialCounts {
  openParks: number;
  parks: number;
  attractions: number;
}

/**
 * Glass pill above the headline: "N parks open right now", live via useGlobalStats.
 *
 * The pill's shell is rendered either way and only its CONTENT swaps — a pulsing bar until the
 * count arrives. Two separate elements (a skeleton and then the badge) measured a small but
 * real layout shift even at identical heights; one element cannot shift.
 *
 * `self-start` + `w-fit`: the hero's left panel is a flex column on xl and would stretch this
 * pill across the whole column otherwise.
 */
function OpenParksBadge({ openParks }: { openParks: number | null }) {
  const tHome = useTranslations('home');
  const pending = openParks == null;
  return (
    <span
      className={cn(
        'inline-flex h-[30px] w-fit shrink-0 items-center gap-2 self-start rounded-full border px-3.5 text-[11px] font-bold tracking-[0.14em] uppercase shadow-sm',
        pending
          ? 'border-border/50 bg-background/50'
          : 'border-status-operating/40 bg-status-operating/10 text-status-operating'
      )}
      aria-busy={pending || undefined}
    >
      {pending ? (
        <Skeleton className="h-2.5 w-36" />
      ) : (
        <>
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="bg-status-operating absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 [will-change:transform,opacity] motion-reduce:animate-none" />
            <span className="bg-status-operating relative inline-flex h-2 w-2 rounded-full" />
          </span>
          {tHome('hero.openNow', { count: openParks })}
        </>
      )}
    </span>
  );
}

/**
 * The open-parks badge and, beside it, the newest news post as a chip.
 *
 * One element in the text panel's flow, so the panel's entrance stagger (`hero-in-stagger`, by
 * `nth-child`) counts the same children it always did.
 *
 * **The row's own width decides the layout, never the badge's.** The badge changes width after
 * the first paint — a skeleton bar until the count arrives, then "8" or "123" parks in one of six
 * languages — so a wrap left to `flex-wrap` could move the chip to a second line late and push the
 * headline, the intro and the search 38 px down under the reader. So the row is its own container
 * (`@container/badges`): from 34 rem it is one line that never wraps (`flex-nowrap`), the badge
 * keeps its width and the chip shrinks into what is left and truncates; below that the two stand
 * in a column, badge above chip, whatever the count. 34 rem is the widest badge (French, 286 px)
 * plus the gap plus 15 rem of chip. Measured: the chip is on the badge's line from a 768 px
 * window up in all six locales, and the plate is not a pixel taller there than without it.
 *
 * The chip does not grow: a short headline gets a short chip, not a pill of empty tint.
 *
 * **In a park the chip's place goes to the compass.** While the compass is on the page (see
 * `useCompassPresent`), the row carries a pill that scrolls down to it instead of the news: in a
 * park, the rides around you are the reason to be here, and the compass sits a screen below a
 * hero that fills the phone. Same shape and height as the chip, in the chip's slot, so the swap
 * moves nothing.
 */
function HeroBadgeRow({
  openParks,
  latestNews,
}: {
  openParks: number | null;
  latestNews: LatestNews | null | undefined;
}) {
  const compass = useCompassPresent();
  return (
    // Two elements because a container query styles the container's descendants, never the
    // container itself: the outer box is measured, the inner one is laid out.
    <div className="@container/badges w-full">
      <div className="flex flex-col items-start gap-2 @min-[34rem]/badges:flex-row @min-[34rem]/badges:items-center">
        <OpenParksBadge openParks={openParks} />
        {compass ? <CompassPill /> : latestNews && <LatestNewsChip news={latestNews} />}
      </div>
    </div>
  );
}

/**
 * „Zum Kompass": scrolls to the in-park compass under the hero and hands it the focus, so a
 * keyboard or screen reader lands where the eye does. A plain fragment link underneath, which is
 * what it does without JavaScript; the smooth scroll is dropped under reduced motion.
 */
function CompassPill() {
  const t = useTranslations('nearby.compass');
  const jump = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(PARK_COMPASS_ID);
    if (!target) return;
    event.preventDefault();
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  };
  return (
    <a
      href={`#${PARK_COMPASS_ID}`}
      onClick={jump}
      data-hero-compass=""
      // 30 px to match the chip it stands in for; the `::after` makes the target 44 px tall.
      className="group border-primary/40 bg-primary/10 text-foreground hover:bg-primary/15 relative inline-flex h-[30px] max-w-full min-w-0 items-center gap-2 rounded-full border pr-3 pl-1 text-xs font-semibold shadow-sm transition-colors after:absolute after:inset-x-0 after:-inset-y-[7px] after:content-['']"
    >
      <span className="bg-primary text-primary-foreground flex size-[22px] shrink-0 items-center justify-center rounded-full">
        <Compass className="size-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 truncate">{t('heroPill')}</span>
      <ArrowDown
        className="text-primary size-3.5 shrink-0 transition-transform group-hover:translate-y-0.5 motion-reduce:transition-none"
        aria-hidden="true"
      />
    </a>
  );
}

/**
 * The headline, with the pin beside it on a wide page, sized to German's two-line wrap — the case
 * in the screenshot that started this ticket.
 *
 * **Pin only, not the full lockup.** A full lockup (pin + wordmark, 4.21 : 1 on the wordmark) at a
 * height that reads next to `text-5xl` text is ~400 px wide — built and measured, not guessed —
 * and that leaves too little of the 608–672 px plate for the headline: German and French both fold
 * to four short lines. The pin alone is roughly 0.82 : 1, so it can go tall without doing that: at
 * 96 px it is ~79 px wide, and the headline keeps its normal two-line wrap in every locale that
 * matters.
 *
 * **The detailed pin (`logo.svg`), not `BrandPin`'s simplified one.** `BrandPin` (the header's
 * `logo-small.svg`) is a flat silhouette meant to still read at 26 px; blown up to 96 px it looks
 * like a plain icon rather than the mark. `logo.svg`/`logo-dark.svg` is cut from the same master
 * lockup (`logo-big.svg`) the favicon's detailed sizes use and the footer draws next to its own
 * wordmark — full linework at any size, which is the point at 96 px. It is inlined here rather
 * than going through a shared component: the footer draws the same pair the same way with no
 * component either, and `BrandPin`'s own contract (26 px ink box, `logo-small.svg` specifically)
 * would have to change shape to fit a different file.
 *
 * **96 px is the two-line headline's own height**, measured at the 1440 px width the ticket's
 * screenshot was taken at (`h-24`). A shorter headline (English's one-liner) sits under a taller
 * pin than its own line — the same tradeoff the original 48 px version made in the other direction,
 * just resolved toward the ticket's own reference case instead of away from it.
 *
 * **`mark` is off for the welcome headline, and that is not a nicety.** The two headlines are not
 * the same kind of string: `hero.title` is six fixed sentences that can be measured once, while
 * `heroWelcome` interpolates a park name of no fixed length, and the welcome variant only appears
 * AFTER the mount, when the nearby lookup lands. Turning the mark on there would move the intro
 * paragraph and the open-parks badge at that exact moment — the same post-mount jump this version
 * was built to avoid. Without the mark the welcome headline lays out exactly as it did before this
 * change.
 *
 * **The threshold asks the PAGE, not this card and not the window.** 1304 px is where the plate
 * stops being squeezed by the world map column (48 the hero section's `px-6` + 672 `max-w-2xl` +
 * 40 the grid's gap + 544 the map column's `34rem`) — because the ticket asks for this on a wide
 * page. Same `@container/page` every other threshold in this hero asks.
 */
function HeroHeadline({ children, mark = false }: { children: React.ReactNode; mark?: boolean }) {
  return (
    // mt-4 mb-3 sat on the <h1> and moved here unchanged: margins do not collapse in a flex
    // container, so the spacing above and below the headline is the same with the row as without.
    <div className="mt-4 mb-3 flex items-center gap-4">
      {mark && (
        <span className="hidden shrink-0 @min-[1304px]/page:block">
          <Image
            src="/logo-dark.svg"
            width={1562}
            height={1905}
            alt=""
            aria-hidden="true"
            className="hidden h-24 w-auto dark:block"
            loading="eager"
          />
          <Image
            src="/logo.svg"
            width={1562}
            height={1905}
            alt=""
            aria-hidden="true"
            className="block h-24 w-auto dark:hidden"
            loading="eager"
          />
        </span>
      )}
      <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
        {children}
      </h1>
    </div>
  );
}

/**
 * The hero's left column: live open-count badge, headline and the intro with live park/
 * attraction counts (SSR seed + 5-min client overlay). When the visitor is inside or right
 * next to a park it switches to the "Willkommen im …" variant with that park's live badges.
 */
export function HeroWithNearby({
  initialCounts,
  latestNews,
}: {
  initialCounts: HeroInitialCounts | null;
  /** The newest news post, for the chip beside the badge. Resolved on the server. */
  latestNews?: LatestNews | null;
}) {
  const t = useTranslations('parks');
  const tHome = useTranslations('home');
  const { data: liveNearbyData } = useHomeNearbyParks();
  /*
   * Die Nähe-Variante erst nach dem Mount.
   *
   * `useHomeNearbyParks` liest die zuletzt bekannte Position aus dem localStorage und kann deshalb
   * schon im ERSTEN Client-Render einen Park liefern. Der Server schrieb dann den allgemeinen
   * Einleitungssatz und der Client an derselben Stelle „Das Phantasialand ist in deiner Nähe" —
   * React verwirft den Teilbaum mit einem Hydration-Fehler. Die Umschaltung passiert ohnehin erst
   * eine Runde später, das Gate verschiebt sie nur um einen Render.
   */
  const mounted = useMounted();
  const nearbyData = mounted ? liveNearbyData : undefined;
  const { data: liveStats } = useGlobalStats();

  const counts = liveStats?.counts ?? initialCounts;
  const openParks = counts?.openParks ?? FALLBACK_COUNTS.openParks;
  const introValues = {
    parks: counts?.parks ?? FALLBACK_COUNTS.parks,
    attractions: counts?.attractions ?? FALLBACK_COUNTS.attractions,
    strong: (chunks: React.ReactNode) => (
      <strong className="text-foreground font-semibold">{chunks}</strong>
    ),
  };

  const inPark = nearbyData?.type === 'in_park' ? (nearbyData.data as NearbyAttractionsData) : null;
  let park = inPark?.park;

  const nearbyParksList =
    nearbyData?.type === 'nearby_parks' ? (nearbyData.data as NearbyParksData).parks : [];
  const nearestParkForVariant = nearbyParksList.length > 0 ? nearbyParksList[0] : null;
  const showNearParkHero =
    nearestParkForVariant != null && nearestParkForVariant.distance <= NEAR_PARK_HERO_RADIUS_M;

  // Fallback: API returned nearby_parks but user is very close → show "im Park" (distance from API is in meters)
  if (!park && nearbyData?.type === 'nearby_parks') {
    const nearest: ParkWithDistance | undefined = nearbyParksList[0];
    if (nearest && nearest.distance <= IN_PARK_FALLBACK_DISTANCE_M) {
      park = {
        ...nearest,
        analytics: {
          ...nearest.analytics,
          operatingAttractions: nearest.operatingAttractions,
        },
      } as NearbyParkInfo;
    }
  }

  if (park) {
    // `in_park` sends no URL for the park itself, so its slugs are read off a ride's — every ride
    // names the same four. The 1 km fallback above comes from `nearby_parks`, which does carry one.
    const geo =
      parkGeoFromUrl(park.url) ??
      (inPark?.rides ?? []).reduce<ReturnType<typeof parkGeoFromUrl>>(
        (found, ride) => found ?? parkGeoFromUrl(ride.url),
        null
      );

    // No intro under the welcome. The general sentence („park.fan hat 210 Freizeitparks …") was
    // six lines on a phone between the welcome and the one thing somebody in the park came for,
    // and this variant is client-only, so the served HTML — and its crawlable intro — is the
    // general one either way. Three children, like the general variant, so the plate's entrance
    // stagger counts the search and the pills below at the same places.
    return (
      <>
        <HeroBadgeRow openParks={openParks} latestNews={latestNews} />
        <HeroHeadline>{t('heroWelcome', { parkName: stripNewPrefix(park.name) })}</HeroHeadline>
        <HeroParkActions park={heroPark(park, geo)} className="mt-2" />
      </>
    );
  }

  return (
    <>
      <HeroBadgeRow openParks={openParks} latestNews={latestNews} />
      <HeroHeadline mark>{tHome('hero.title')}</HeroHeadline>
      {showNearParkHero ? (
        <>
          <p className="text-foreground/80 max-w-xl text-base leading-relaxed md:text-lg">
            {t('heroNearPark', { parkName: nearestParkForVariant!.name })}
          </p>
          <HeroParkActions
            park={heroPark(nearestParkForVariant!, parkGeoFromUrl(nearestParkForVariant!.url))}
            className="mt-5"
          />
        </>
      ) : (
        <p className="text-foreground/80 max-w-xl text-base leading-relaxed md:text-lg">
          {tHome.rich('hero.intro', introValues)}
        </p>
      )}
    </>
  );
}

/** The two nearby shapes, reduced to what the hero's park block reads. */
function heroPark(park: NearbyParkInfo | ParkWithDistance, geo: HeroPark['geo']): HeroPark {
  return {
    slug: park.slug,
    name: stripNewPrefix(park.name),
    geo,
    timezone: park.timezone,
    status: park.status,
    todaySchedule: park.todaySchedule,
    nextSchedule: park.nextSchedule,
    operatingAttractions:
      'operatingAttractions' in park
        ? park.operatingAttractions
        : (park.analytics?.operatingAttractions ?? null),
    backgroundImage: park.backgroundImage,
    backgroundPosition: park.backgroundPosition,
  };
}
