'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { ParkCard } from '@/components/parks/park-card';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { Link } from '@/i18n/navigation';
import { ChevronRight, Star } from 'lucide-react';
import type { FeaturedPark } from './featured-parks-section';

async function fetchFeaturedParks(locale: string): Promise<FeaturedPark[]> {
  const res = await fetch(`/api/featured-parks/${locale}`);
  if (!res.ok) return [];
  return res.json();
}

function getTranslatedCountry(
  tGeo: ReturnType<typeof useTranslations>,
  park: FeaturedPark
): string {
  return translateGeoSlug(tGeo, 'countries', park.countrySlug, park.countryName);
}

/** Skeleton placeholder while parks load */
function FeaturedParksSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-muted h-40 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

interface FeaturedParksSectionClientProps {
  /** Intro text for the section (pre-rendered server-side, passed as prop). */
  introText: string;
  /** Section heading (pre-rendered server-side, passed as prop). */
  headingText: string;
  /** "View all parks" link label. */
  ctaText: string;
  /**
   * Parks pre-extracted server-side (from geoData already fetched by the page).
   * Passed as React Query initialData so park links appear in the SSR HTML for SEO.
   */
  initialParks?: FeaturedPark[];
}

/**
 * Compact park grid for inline use (e.g. howto page).
 * No heading/section wrapper — just the cards + "view all" link.
 */
export function PopularParksGridClient() {
  const locale = useLocale();
  const tHome = useTranslations('home');
  const tGeo = useTranslations('geo');

  const { data: parks, isLoading } = useQuery({
    queryKey: ['featured-parks', locale],
    queryFn: () => fetchFeaturedParks(locale),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-muted h-40 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!parks || parks.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="grid [grid-auto-rows:auto_1fr_auto] gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {parks.map((park) => (
          <ParkCard
            key={park.slug}
            name={park.name}
            slug={park.slug}
            parkId={park.parkId}
            city={park.city}
            country={getTranslatedCountry(tGeo, park)}
            href={park.href as '/'}
            backgroundImage={park.backgroundImage}
            status={park.status}
            crowdLevel={park.crowdLevel}
            averageWaitTime={park.averageWaitTime}
            operatingAttractions={park.operatingAttractions}
            totalAttractions={park.totalAttractions}
            timezone={park.timezone}
            todaySchedule={park.todaySchedule}
            nextSchedule={park.nextSchedule}
            variant="detailed"
          />
        ))}
      </div>
      <div className="flex justify-end">
        <Link
          href="/parks"
          prefetch={false}
          className="text-primary text-sm font-medium hover:underline"
        >
          {tHome('hero.cta')}
        </Link>
      </div>
    </div>
  );
}

/**
 * Client-side featured parks section — fetches live park data via React Query.
 * Keeps the parent page at revalidate=86400 by moving the live geo fetch client-side.
 *
 * Pass `initialParks` (extracted server-side from geoData) so that park links appear
 * in the SSR HTML for SEO — React Query will refetch in the background for live status.
 */
export function FeaturedParksSectionClient({
  introText,
  headingText,
  ctaText,
  initialParks,
}: FeaturedParksSectionClientProps) {
  const locale = useLocale();
  const tGeo = useTranslations('geo');

  const { data: parks, isLoading } = useQuery({
    queryKey: ['featured-parks', locale],
    queryFn: () => fetchFeaturedParks(locale),
    staleTime: 5 * 60_000, // 5 min — matches API TTL
    refetchOnWindowFocus: true,
    initialData: initialParks,
  });

  if (!isLoading && (!parks || parks.length === 0)) return null;

  return (
    <section className="px-4 py-12">
      <div className="container mx-auto">
        <div className="mb-2 flex items-center gap-2">
          <Star className="text-primary h-5 w-5" />
          <h2 className="text-xl font-bold">{headingText}</h2>
        </div>
        <p className="text-muted-foreground mb-8 text-sm">{introText}</p>

        {isLoading ? (
          <FeaturedParksSkeleton />
        ) : (
          <div className="grid [grid-auto-rows:auto_1fr_auto] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {parks!.map((park) => (
              <ParkCard
                key={park.slug}
                name={park.name}
                slug={park.slug}
                parkId={park.parkId}
                city={park.city}
                country={getTranslatedCountry(tGeo, park)}
                href={park.href as '/'}
                backgroundImage={park.backgroundImage}
                status={park.status}
                crowdLevel={park.crowdLevel}
                averageWaitTime={park.averageWaitTime}
                operatingAttractions={park.operatingAttractions}
                totalAttractions={park.totalAttractions}
                timezone={park.timezone}
                todaySchedule={park.todaySchedule}
                nextSchedule={park.nextSchedule}
                variant="detailed"
              />
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Link
            href="/parks"
            prefetch={false}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
          >
            {ctaText}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
