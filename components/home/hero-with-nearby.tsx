'use client';

import { useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import { useNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { stripNewPrefix } from '@/lib/utils';
import { trackHeroViewed } from '@/lib/analytics/umami';
import { Badge } from '@/components/ui/badge';
import { HeroSearchInput } from '@/components/search/hero-search-input';
import type {
  NearbyAttractionsData,
  NearbyParksData,
  NearbyParkInfo,
  ParkWithDistance,
} from '@/types/nearby';

/** API returns distance in meters. Treat user as "in park" when nearest park is within this (m). */
const IN_PARK_FALLBACK_DISTANCE_M = 1000; // 1 km
/** Only show "Park is nearby" hero subline when nearest park is within this (m). */
const NEAR_PARK_HERO_RADIUS_M = 5000; // 5 km

const BADGE_BASE = 'px-3 py-1 text-xs md:px-4 md:py-1.5 md:text-sm';

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
  isOpenForPrefetch: boolean;
  t: ReturnType<typeof useTranslations<'parks'>>;
  tCommon: ReturnType<typeof useTranslations<'common'>>;
}

function ParkBadges({
  isOpen,
  operatingCount,
  crowdLabel,
  hoursStr,
  parkUrl,
  isOpenForPrefetch,
  t,
  tCommon,
}: ParkBadgesProps) {
  return (
    <div className="mx-auto mt-6 mb-8 flex max-w-2xl flex-wrap items-center justify-center gap-2 px-4 py-4 md:gap-3 md:px-6 md:py-5">
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
          prefetch={isOpenForPrefetch}
          className="text-primary hover:text-primary/90 focus-visible:ring-ring mt-1 inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none md:mt-0 md:px-4 md:py-2 md:text-sm"
        >
          {t('heroParkLink')}
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function HeroWithNearby({ searchPlaceholder }: { searchPlaceholder: string }) {
  const t = useTranslations('parks');
  const tHome = useTranslations('home');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { data: nearbyData } = useNearbyParks({ radiusInMeters: 200, limit: 6 });

  const inPark = nearbyData?.type === 'in_park' ? (nearbyData.data as NearbyAttractionsData) : null;
  let park = inPark?.park;

  const nearbyParksList =
    nearbyData?.type === 'nearby_parks' ? (nearbyData.data as NearbyParksData).parks : [];
  const nearestParkForVariant = nearbyParksList.length > 0 ? nearbyParksList[0] : null;
  const showNearParkHero =
    nearestParkForVariant != null && nearestParkForVariant.distance <= NEAR_PARK_HERO_RADIUS_M;

  const heroVariant = park ? 'in_park' : showNearParkHero ? 'near_park' : 'default';
  const heroParkName = park?.name ?? nearestParkForVariant?.name;
  const heroParkId = park?.id ?? nearestParkForVariant?.id;
  const lastTrackedVariant = useRef<string | null>(null);
  useEffect(() => {
    if (lastTrackedVariant.current === heroVariant) return;
    lastTrackedVariant.current = heroVariant;
    trackHeroViewed({
      variant: heroVariant as 'in_park' | 'near_park' | 'default',
      ...(heroParkName && { parkName: heroParkName }),
      ...(heroParkId && { parkId: heroParkId }),
    });
  }, [heroVariant, heroParkName, heroParkId]);

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
        <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
          {t('heroWelcome', { parkName: stripNewPrefix(park.name) })}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-center text-base leading-relaxed md:text-lg">
          {tHome('intro')}
        </p>
        <ParkBadges
          isOpen={isOpen}
          operatingCount={operatingCount}
          crowdLabel={crowdLabel}
          hoursStr={hoursStr}
          parkUrl={parkUrl}
          isOpenForPrefetch={isOpen}
          t={t}
          tCommon={tCommon}
        />
        <HeroSearchInput placeholder={searchPlaceholder} />
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
      <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
        {t('title')}
      </h1>
      {showNearParkHero ? (
        <>
          <p className="text-muted-foreground mx-auto max-w-2xl text-center text-base leading-relaxed md:text-lg">
            {t('heroNearPark', { parkName: nearestParkForVariant!.name })}
          </p>
          <ParkBadges
            isOpen={nearParkOpen ?? false}
            operatingCount={nearParkOperatingCount}
            crowdLabel={nearParkCrowdLabel}
            hoursStr={nearParkHoursStr}
            parkUrl={nearParkUrl}
            isOpenForPrefetch={nearParkOpen ?? false}
            t={t}
            tCommon={tCommon}
          />
        </>
      ) : (
        <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-center text-base leading-relaxed md:text-lg">
          {tHome('intro')}
        </p>
      )}
      <HeroSearchInput placeholder={searchPlaceholder} />
    </>
  );
}
