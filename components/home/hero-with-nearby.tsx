'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useGlobalStats } from '@/lib/hooks/use-global-stats';
import { useMounted } from '@/lib/hooks/use-mounted';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { stripNewPrefix, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

const BADGE_BASE = 'px-3 py-1 text-xs md:px-4 md:py-1.5 md:text-sm';

/** Seed for the live counts, baked into the static shell by <HeroStats>. */
export interface HeroInitialCounts {
  openParks: number;
  parks: number;
  attractions: number;
}

function formatTimeRange(
  openingTime: string | undefined,
  closingTime: string | undefined,
  locale: string,
  timeZone: string
): string | null {
  if (!openingTime || !closingTime) return null;
  try {
    const open = new Date(openingTime);
    const close = new Date(closingTime);
    return `${open.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone })} – ${close.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone })}`;
  } catch {
    return null;
  }
}

interface ParkBadgesProps {
  isOpen: boolean;
  operatingCount: number | null;
  crowdLabel: string | null;
  hoursStr: string | null;
  parkUrl: string | null;
  t: ReturnType<typeof useTranslations<'parks'>>;
  tCommon: ReturnType<typeof useTranslations<'common'>>;
}

function ParkBadges({
  isOpen,
  operatingCount,
  crowdLabel,
  hoursStr,
  parkUrl,
  t,
  tCommon,
}: ParkBadgesProps) {
  return (
    <div className="mt-4 mb-2 flex flex-wrap items-center gap-2 md:gap-3">
      <Badge
        variant="outline"
        className={
          isOpen
            ? `border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-500/20 dark:text-emerald-300 ${BADGE_BASE}`
            : `border-red-500/60 bg-red-500/10 text-red-700 dark:border-red-400/60 dark:bg-red-500/20 dark:text-red-300 ${BADGE_BASE}`
        }
      >
        {isOpen ? tCommon('open') : tCommon('closed')}
      </Badge>
      {operatingCount != null && (
        <Badge variant="secondary" className={BADGE_BASE}>
          {t('heroWelcomeAttractions', { count: operatingCount })}
        </Badge>
      )}
      {crowdLabel && isOpen && (
        <Badge
          variant="outline"
          className={`border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 ${BADGE_BASE}`}
        >
          {crowdLabel}
        </Badge>
      )}
      {hoursStr && (
        <Badge variant="outline" className={`text-muted-foreground ${BADGE_BASE}`}>
          {hoursStr}
        </Badge>
      )}
      {parkUrl && (
        <Link
          href={parkUrl}
          prefetch={false}
          className="text-primary hover:text-primary/90 focus-visible:ring-ring inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none md:px-4 md:py-2 md:text-sm"
        >
          {t('heroParkLink')}
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
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
        'inline-flex h-[30px] w-fit items-center gap-2 self-start rounded-full border px-3.5 text-[11px] font-bold tracking-[0.14em] uppercase shadow-sm',
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
export function HeroWithNearby({ initialCounts }: { initialCounts: HeroInitialCounts | null }) {
  const t = useTranslations('parks');
  const tHome = useTranslations('home');
  const tCommon = useTranslations('common');
  const locale = useLocale();
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
    const isOpen = park.status === 'OPERATING';
    const crowdLabel = park.analytics?.crowdLevel
      ? t(`crowdLevels.${park.analytics.crowdLevel}` as 'very_low') || park.analytics.crowdLevel
      : null;
    const operatingCount = park.analytics?.operatingAttractions ?? null;
    const hoursStr =
      isOpen && park.todaySchedule?.scheduleType === 'OPERATING'
        ? formatTimeRange(
            park.todaySchedule.openingTime,
            park.todaySchedule.closingTime,
            locale,
            park.timezone
          )
        : null;

    const parkUrl =
      park.url != null && park.url !== '' ? convertApiUrlToFrontendUrl(park.url) : null;

    return (
      <>
        <OpenParksBadge openParks={openParks} />
        <HeroHeadline>{t('heroWelcome', { parkName: stripNewPrefix(park.name) })}</HeroHeadline>
        <p className="text-foreground/80 max-w-xl text-base leading-relaxed md:text-lg">
          {tHome.rich('hero.intro', introValues)}
        </p>
        <ParkBadges
          isOpen={isOpen}
          operatingCount={operatingCount}
          crowdLabel={crowdLabel}
          hoursStr={hoursStr}
          parkUrl={parkUrl}
          t={t}
          tCommon={tCommon}
        />
      </>
    );
  }

  const nearParkOpen = nearestParkForVariant?.status === 'OPERATING';
  const nearParkOperatingCount = nearestParkForVariant?.operatingAttractions ?? null;
  const nearParkCrowdLabel =
    nearestParkForVariant?.analytics?.crowdLevel != null
      ? t(`crowdLevels.${nearestParkForVariant.analytics.crowdLevel}` as 'very_low') ||
        nearestParkForVariant.analytics.crowdLevel
      : null;
  const nearParkHoursStr =
    nearParkOpen &&
    nearestParkForVariant?.todaySchedule?.scheduleType === 'OPERATING' &&
    nearestParkForVariant?.timezone
      ? formatTimeRange(
          nearestParkForVariant.todaySchedule?.openingTime,
          nearestParkForVariant.todaySchedule?.closingTime,
          locale,
          nearestParkForVariant.timezone
        )
      : null;
  const nearParkUrl =
    nearestParkForVariant?.url != null && nearestParkForVariant.url !== ''
      ? convertApiUrlToFrontendUrl(nearestParkForVariant.url)
      : null;

  return (
    <>
      <OpenParksBadge openParks={openParks} />
      <HeroHeadline mark>{tHome('hero.title')}</HeroHeadline>
      {showNearParkHero ? (
        <>
          <p className="text-foreground/80 max-w-xl text-base leading-relaxed md:text-lg">
            {t('heroNearPark', { parkName: nearestParkForVariant!.name })}
          </p>
          <ParkBadges
            isOpen={nearParkOpen ?? false}
            operatingCount={nearParkOperatingCount}
            crowdLabel={nearParkCrowdLabel}
            hoursStr={nearParkHoursStr}
            parkUrl={nearParkUrl}
            t={t}
            tCommon={tCommon}
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
