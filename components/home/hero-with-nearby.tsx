'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ArrowDown, Compass } from 'lucide-react';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useGlobalStats } from '@/lib/hooks/use-global-stats';
import { useMounted } from '@/lib/hooks/use-mounted';
import { PARK_COMPASS_ID, useCompassPresent } from '@/lib/home/compass-presence';
import { trackCompassPillClicked } from '@/lib/analytics/umami';
import { parkGeoFromUrl } from '@/lib/planner/park-url';
import { stripNewPrefix, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { LiveDot } from '@/components/common/live-dot';
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
const NEAR_PARK_HERO_RADIUS_M = 5000;

/** Sentence fallbacks when neither the SSR seed nor the live overlay has counts yet. */
const FALLBACK_COUNTS = { openParks: null, parks: 200, attractions: 7000 };

/** Seed for the live counts, baked into the static shell by <HeroStats>. */
export interface HeroInitialCounts {
  openParks: number;
  parks: number;
  attractions: number;
}

/**
 * Glass pill above the headline: "N parks open right now", live via useGlobalStats. The shell
 * renders either way and only its content swaps, since a skeleton replaced by a badge shifts even
 * at identical heights. `self-start w-fit`, or the xl flex column would stretch it.
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
          <LiveDot color="bg-status-operating" pingColor="bg-status-operating opacity-60" />
          {tHome('hero.openNow', { count: openParks })}
        </>
      )}
    </span>
  );
}

/**
 * The open-parks badge and, beside it, the newest news post as a chip. The row's own width decides
 * the layout, never the badge's, which changes after first paint: from 34 rem (the widest badge
 * plus 15 rem of chip) it is one line that never wraps and the chip truncates; below that, badge
 * above chip. In a park, while the compass is on the page, the chip's slot holds a pill that
 * scrolls down to it, same shape and height, so the swap moves nothing.
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
    // Not counted under `?sim=`: that is the team testing (see `trackCompassViewed`).
    if (!new URLSearchParams(window.location.search).has('sim')) trackCompassPillClicked();
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
 * The headline, with the detailed pin beside it on a wide page. The pin alone, not the full
 * lockup, which at a height that reads beside `text-5xl` would fold German and French to four
 * lines; `logo.svg` rather than `BrandPin`, whose flat silhouette is made for 26 px. 96 px (`h-24`)
 * is the two-line headline's own height. `mark` stays off for the welcome headline, which appears
 * only after mount and would otherwise move the intro and badge. The threshold asks the page
 * (`@container/page`): 1304 px is where the world map column stops squeezing the plate.
 */
function HeroHeadline({ children, mark = false }: { children: React.ReactNode; mark?: boolean }) {
  return (
    // Margins do not collapse in a flex container, so `mt-4 mb-3` here spaces the headline as it
    // would on the <h1>.
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
   * The nearby variant only after mount: `useHomeNearbyParks` reads the last known position from
   * localStorage and can return a park in the first client render, which would not match the
   * server's general intro.
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

    // No intro under the welcome: on a phone it stood between the welcome and what somebody in the
    // park came for, and this variant is client-only, so the crawlable HTML keeps the general
    // intro. Three children, like the general variant, so the entrance stagger counts alike.
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
