import { getTranslations } from 'next-intl/server';
import { Ban, Hourglass, MapPin } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { Badge } from '@/components/ui/badge';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { ChapterPanel } from '@/components/common/chapter-panel';
import { GlassCard } from '@/components/common/glass-card';
import { PageContainer } from '@/components/common/page-container';
import { ShareButtons } from '@/components/common/share-buttons';
import { AttractionBlogPostsSection } from '@/components/parks/blog-posts-sections';
import { AttractionTypicalWaits } from '@/components/parks/attraction-typical-waits';
import { GlassNotice } from '@/components/parks/glass-notice';
import { ParkBackground } from '@/components/parks/park-background';
import { PANEL_CELL, PanelGrid } from '@/components/parks/park-panel-cell';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { RcdbBadge } from '@/components/parks/rcdb-badge';
import { RideProfileSection } from '@/components/parks/ride-profile-section';
import { RideProfileTeaser } from '@/components/parks/ride-profile-teaser';
import { PlannerPageParkBeacon } from '@/components/planner/planner-page-park-beacon';
import {
  AttractionStructuredData,
  BreadcrumbStructuredData,
} from '@/components/seo/structured-data';
import { objectPositionForSrc } from '@/lib/media/focus';
import { getMediaAltBySrc } from '@/lib/media/text';
import {
  closedRidePost,
  closedRideSource,
  formatClosedOn,
  type ClosedRide,
} from '@/lib/parks/closed-ride';
import {
  getAttractionBackgroundImage,
  getCardObjectPosition,
  getParkBackgroundImage,
} from '@/lib/utils/park-assets';
import { stripNewPrefix } from '@/lib/utils';
import type { Breadcrumb, ParkWithAttractions } from '@/lib/api/types';

interface ClosedRidePageProps {
  locale: Locale;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  attractionSlug: string;
  park: ParkWithAttractions;
  ride: ClosedRide;
  breadcrumbs: Breadcrumb[];
  currentPage: string;
  /** Absolute canonical URL of this page. */
  url: string;
  /** OG card URL, the JSON-LD image when the ride has no photo of its own. */
  ogImageUrl: string;
  /**
   * The sentence the meta description carries (`buildClosedRideDescription`), printed as the
   * intro so the snippet and the page say the same thing.
   */
  description: string;
}

/**
 * The page of a ride that closed for good.
 *
 * It keeps the URL, and with it the ranking the ride page earned while the ride ran, instead of
 * the 404 X2 at Six Flags Magic Mountain answered for two months after it closed. What it shows is
 * what is still true about the ride: when it closed, why (our news post, where the retirement
 * names one), what the queue cost before that, and the ride profile. Everything that describes
 * today — the live wait, today's curve, the rope-drop advice, the FAQ, the planner and the
 * favourite star — is left out, because every one of those would describe a ride that runs.
 *
 * Server-rendered throughout. The only client component is `AttractionTypicalWaits`, which the
 * live ride page mounts as well, so the route's message set does not grow.
 */
export async function ClosedRidePage({
  locale,
  continent,
  country,
  city,
  parkSlug,
  attractionSlug,
  park,
  ride,
  breadcrumbs,
  currentPage,
  url,
  ogImageUrl,
  description,
}: ClosedRidePageProps) {
  const t = await getTranslations('attractions.retired');
  const attractionName = stripNewPrefix(ride.name);
  const parkName = stripNewPrefix(park.name);
  const parkPath = `/parks/${continent}/${country}/${city}/${parkSlug}`;

  const post = closedRidePost(ride.retiredReason, locale);
  // Our own post first: it is written for the reader, in their language. An outside source only
  // where the reason names no post of ours.
  const source = post ? null : closedRideSource(ride.retiredReason);

  // Typed as `{ name }`, served as a plain string on this endpoint (X2: "Thrill Rides").
  const rawLand = ride.land as unknown;
  const land =
    typeof rawLand === 'string' ? rawLand : ((rawLand as { name?: string } | null)?.name ?? null);

  const backgroundImage = getAttractionBackgroundImage(parkSlug, attractionSlug);
  const rcdbBadge =
    ride.rcdbId != null ? <RcdbBadge rcdbId={ride.rcdbId} attractionName={attractionName} /> : null;

  const linkClass =
    'text-primary hover:text-primary/80 font-medium underline decoration-dotted underline-offset-4';

  return (
    <>
      <PlannerPageParkBeacon
        slug={park.slug}
        name={parkName}
        geo={{ continent, country, city }}
        timezone={park.timezone}
        backgroundImage={getParkBackgroundImage(park.slug)}
        backgroundPosition={getCardObjectPosition(park.slug)}
      />
      <AttractionStructuredData
        attraction={{ name: ride.name, slug: attractionSlug }}
        park={park}
        url={url}
        locale={locale}
        description={description}
        ogImageUrl={ogImageUrl}
      />
      <BreadcrumbStructuredData
        breadcrumbs={breadcrumbs}
        currentPage={{ name: currentPage, url: `${parkPath}/${attractionSlug}` }}
        locale={locale}
      />
      <ParkBackground
        imageSrc={backgroundImage}
        alt={getMediaAltBySrc(backgroundImage, locale) ?? attractionName}
        objectPosition={objectPositionForSrc(backgroundImage)}
      />
      <PageContainer>
        <BreadcrumbNav
          breadcrumbs={breadcrumbs}
          currentPage={currentPage}
          pinLastBreadcrumb
          phone="hidden"
        />

        <article itemScope itemType="https://schema.org/TouristAttraction">
          <div className="mb-4">
            <GlassCard variant="tile">
              <h1 className="mb-2 text-3xl font-bold md:text-4xl">
                {attractionName}{' '}
                <span className="text-muted-foreground text-xl font-normal md:text-2xl">
                  – {t('h1Suffix')}
                </span>
              </h1>
              <div className="text-muted-foreground flex flex-wrap items-center gap-3">
                <Link
                  href={parkPath as '/parks/europe/germany/rust/europa-park'}
                  prefetch={false}
                  className="hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {parkName}
                </Link>
                {land && <Badge variant="outline">{land}</Badge>}
                <ParkStatusBadge status="RETIRED" />
              </div>

              {/* What the ride was, which stays true after it closed. The height limits and the
                  queue-jump badges of the live page are left out: they describe a visit. */}
              {(ride.rideProfile || rcdbBadge) && (
                <div className="border-border/50 no-scrollbar mt-5 flex items-center gap-2 border-t pt-4 max-sm:overflow-x-auto sm:flex-wrap">
                  {ride.rideProfile ? (
                    <RideProfileTeaser profile={ride.rideProfile} locale={locale}>
                      {rcdbBadge}
                    </RideProfileTeaser>
                  ) : (
                    rcdbBadge
                  )}
                </div>
              )}

              <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed">
                {description}
              </p>
            </GlassCard>
          </div>

          <GlassNotice
            icon={Ban}
            title={t('noticeTitle', { date: formatClosedOn(ride.retiredAt, locale) })}
            tintClassName="bg-red-500/5 dark:bg-red-500/10"
            iconClassName="text-red-600 dark:text-red-400"
            className="mb-8"
          >
            {post && (
              <span className="block">
                {t.rich('noticePost', {
                  title: post.title,
                  link: (chunks) => (
                    <Link href={post.href as '/'} className={linkClass}>
                      {chunks}
                    </Link>
                  ),
                })}
              </span>
            )}
            {source && (
              <span className="block">
                {t.rich('noticeSource', {
                  host: source.host,
                  link: (chunks) => (
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </span>
            )}
            <span className="mt-1 block">
              {t.rich('noticePark', {
                park: parkName,
                link: (chunks) => (
                  <Link
                    href={parkPath as '/parks/europe/germany/rust/europa-park'}
                    prefetch={false}
                    className={linkClass}
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </GlassNotice>

          {/* The typical-waits card is computed over 365 days, so for a year after the closure it
              still describes the ride as it ran. The chapter title says which time it is about;
              the card's own line says the window. */}
          {ride.typicalWaits?.displayable && (
            <ChapterPanel icon={Hourglass} title={t('waitsTitle')} id="waits" bodyPadding="none">
              <PanelGrid columnCount={1}>
                <div className={PANEL_CELL}>
                  <AttractionTypicalWaits bare typicalWaits={ride.typicalWaits} />
                </div>
              </PanelGrid>
            </ChapterPanel>
          )}

          {ride.rideProfile && <RideProfileSection profile={ride.rideProfile} locale={locale} />}

          <AttractionBlogPostsSection
            locale={locale}
            parkSlug={parkSlug}
            attractionSlug={attractionSlug}
            geoPath={`${continent}/${country}/${city}`}
            attractionName={attractionName}
          />

          <div className="mt-10">
            <ShareButtons url={url} title={attractionName} />
          </div>
        </article>
      </PageContainer>
    </>
  );
}
