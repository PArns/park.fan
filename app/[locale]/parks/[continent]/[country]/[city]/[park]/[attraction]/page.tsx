import { getTranslations, setRequestLocale } from 'next-intl/server';
import { formatInTimeZone } from 'date-fns-tz';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import {
  buildAttractionTitle,
  buildAttractionDescription,
  buildAttractionFacts,
  buildClosedRideDescription,
  buildClosedRideTitle,
} from '@/lib/seo/attraction-meta';
import { formatClosedOn, getClosedRide, type ClosedRide } from '@/lib/parks/closed-ride';
import { ClosedRidePage } from '@/components/parks/closed-ride-page';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound, permanentRedirect } from 'next/navigation';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { Link } from '@/i18n/navigation';
import { Clock, MapPin, Sparkles } from 'lucide-react';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { Badge } from '@/components/ui/badge';
import { SeasonalBadge } from '@/components/parks/seasonal-badge';
import { WorksPeriodBadge } from '@/components/parks/works-period-badge';
import { TransportSystemBadge } from '@/components/parks/transport-system-badge';
import { WorksPeriodNote } from '@/components/parks/works-period-note';
import { FastPassBadge } from '@/components/parks/fast-pass-badge';
import { SingleRiderBadge } from '@/components/parks/single-rider-badge';
import { VirtualLineBadge } from '@/components/parks/virtual-line-badge';
import { AttractionMetaBadges } from '@/components/parks/attraction-meta-badges';
import { RcdbBadge } from '@/components/parks/rcdb-badge';
import { RideExposureLine } from '@/components/parks/ride-exposure-line';
import { ChapterPanel } from '@/components/common/chapter-panel';
import { PANEL_CELL, PanelGrid } from '@/components/parks/park-panel-cell';
import { getParkByGeoPath, leanParkForAttractionShell } from '@/lib/api/parks';
import { catchNonFatal } from '@/lib/api/client';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import type { Metadata } from 'next';
import type { ParkWithAttractions } from '@/lib/api/types';
import { objectPositionForSrc } from '@/lib/media/focus';
import { getMediaAltBySrc } from '@/lib/media/text';
import { ParkBackground } from '@/components/parks/park-background';
import { FavoriteStar } from '@/components/common/favorite-star';
import { AddToPlannerButton } from '@/components/planner/add-to-planner-button';
import { ParkDistance } from '@/components/common/park-distance';
import { ShareButtons } from '@/components/common/share-buttons';
import { ContributeBanner } from '@/components/contribute/contribute-banner';
import { PreferredSourcePrompt } from '@/components/common/preferred-source-prompt';
import { buildContributeHref } from '@/lib/contribute/prefill';
import {
  getAttractionBackgroundImage,
  getCardObjectPosition,
  getParkBackgroundImage,
} from '@/lib/utils/park-assets';
import {
  AttractionStructuredData,
  BreadcrumbStructuredData,
} from '@/components/seo/structured-data';
import { AttractionFAQStructuredData } from '@/components/seo/attraction-faq-structured-data';
import { AttractionFAQSection } from '@/components/faq/attraction-faq-section';
import { buildAttractionFaqItems } from '@/lib/faq/attraction-faq';
import { ParkHeaderCard } from '@/components/parks/park-header-card';
import { RideLiveHeader } from '@/components/parks/ride-live-header';
import { RideNavTiles } from '@/components/parks/ride-nav-tiles';
import { rideProfileRenders } from '@/lib/glossary/ride-profile';
import { PageContainer } from '@/components/common/page-container';
import { GlassCard } from '@/components/common/glass-card';
import { AttractionHistorySections } from '@/components/parks/attraction-history-sections';
import { AttractionTypicalWaits } from '@/components/parks/attraction-typical-waits';
import { AttractionDowntimeSection } from '@/components/parks/attraction-downtime-section';
import { LiveAttractionData } from '@/components/parks/live-attraction-data';
import { RopeDropCard } from '@/components/parks/rope-drop-card';
import { RideProfileSection } from '@/components/parks/ride-profile-section';
import { NoLiveWaitTimesNotice } from '@/components/parks/no-live-wait-times-notice';
import { hasReadableWaitTimes, noLiveWaitTimesReason } from '@/lib/utils/live-wait-times';
import { AttractionBlogPostsSection } from '@/components/parks/blog-posts-sections';
import { RideProfileTeaser } from '@/components/parks/ride-profile-teaser';
import { isEveningBetter } from '@/lib/utils/rope-drop';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { generateAttractionBreadcrumbs } from '@/lib/utils/breadcrumb-utils';
import { stripNewPrefix } from '@/lib/utils';
import {
  cityHasOwnPage,
  findRelocatedParkRedirect,
  findRenamedParkRedirect,
} from '@/lib/utils/redirect-utils';
import { RouteMessages } from '@/i18n/route-messages';
import { PlannerPageParkBeacon } from '@/components/planner/planner-page-park-beacon';
import { parkArgs } from '@/lib/i18n/park-phrase';

interface AttractionPageProps {
  params: Promise<{
    locale: string;
    continent: string;
    country: string;
    city: string;
    park: string;
    attraction: string;
  }>;
}

export async function generateMetadata({ params }: AttractionPageProps): Promise<Metadata> {
  const {
    continent,
    country,
    city,
    park: parkSlug,
    attraction: attractionSlug,
    locale,
  } = await params;
  if (!isServableRoute(locale, continent, country, city, parkSlug, attractionSlug)) return {};

  // catchNonFatal (not a bare .catch(() => null)): maintenance/502 must re-throw so an
  // API outage surfaces the maintenance page instead of a not-found title — same as the body.
  const park = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));
  const attraction = park?.attractions?.find((a) => a.slug === attractionSlug);

  // A ride that closed for good is not in the park payload but keeps its page — see
  // `lib/parks/closed-ride.ts`. Same question the page body asks, answered once by `cache()`.
  const closedRide =
    park && !attraction
      ? await catchNonFatal(getClosedRide(continent, country, city, parkSlug, attractionSlug))
      : null;
  if (park && closedRide) {
    return closedRideMetadata({
      locale: locale as Locale,
      path: `/parks/${continent}/${country}/${city}/${parkSlug}/${attractionSlug}`,
      pathSegments: [locale, continent, country, city, parkSlug, attractionSlug],
      park,
      ride: closedRide,
    });
  }

  if (!attraction) {
    const tNotFound = await getTranslations({ locale, namespace: 'seo.notFound' });
    if (!park) {
      // Stale geo segments (re-slugged/relocated city)? Point canonical at the
      // attraction's current path — the page body issues the actual 308.
      const relocatedUrl = await findRelocatedParkRedirect(continent, country, city, parkSlug);
      if (relocatedUrl) {
        return {
          title: tNotFound('attraction'),
          alternates: { canonical: `${SITE_URL}/${locale}${relocatedUrl}/${attractionSlug}` },
        };
      }
    }
    return { title: tNotFound('attraction') };
  }

  // The park was renamed upstream: the API 301'd the old path and `fetch` followed it, so
  // canonical points at the real attraction path; the page body issues the matching 308. `park`
  // is non-null here, but the narrowing does not survive the optional chain behind `attraction`.
  const renamedUrl = park
    ? findRenamedParkRedirect(park, { continent, country, city, parkSlug })
    : null;
  if (renamedUrl) {
    const tNotFound = await getTranslations({ locale, namespace: 'seo.notFound' });
    return {
      title: tNotFound('attraction'),
      alternates: { canonical: `${SITE_URL}/${locale}${renamedUrl}/${attractionSlug}` },
    };
  }

  // A numbered-suffix slug (playground-2) is a backend duplicate only when the base slug exists
  // in the same park with exactly the same name; then it is noindex with canonical at the base
  // slug. The name check keeps distinct rides indexable ("Main Train 2" beside "Main Train").
  const isVariantSlug = /^.+-\d+$/.test(attractionSlug);
  const baseSlug = isVariantSlug ? attractionSlug.replace(/-\d+$/, '') : attractionSlug;
  const canonicalAttractionSlug =
    isVariantSlug &&
    park?.attractions?.some((a) => a.slug === baseSlug && a.name === attraction.name)
      ? baseSlug
      : attractionSlug;
  const isDeduplicatedVariant = canonicalAttractionSlug !== attractionSlug;

  const t = await getTranslations({ locale, namespace: 'seo.attraction' });
  const tGlobal = await getTranslations({ locale, namespace: 'seo.global' });
  const tImageAlt = await getTranslations({ locale, namespace: 'seo.imageAlt' });

  const ogImageUrl = getOgImageUrl([locale, continent, country, city, parkSlug, attractionSlug]);
  const attractionName = stripNewPrefix(attraction.name);
  const parkName = stripNewPrefix(park?.name || '');

  const cityName = park?.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');

  const keywords = [
    attractionName,
    `${attractionName} ${t('keywordWaitTime')}`,
    parkName,
    `${parkName} ${cityName}`,
    cityName,
    tGlobal('keywords'),
  ]
    .filter(Boolean)
    .join(', ');

  // A ladder of templates rather than one, so the title fits Google's ~60 characters in every
  // locale; the facts come off the attraction this fetch already returned.
  const title = buildAttractionTitle(attractionName, parkName, t, {
    locale: locale as Locale,
    articleDe: park?.nameArticleDe,
  });
  const description = attraction
    ? buildAttractionDescription(attractionName, parkName, buildAttractionFacts(attraction, t), t, {
        locale: locale as Locale,
        articleDe: park?.nameArticleDe,
      })
    : t('metaDescriptionTemplate', {
        attraction: attractionName,
        ...parkArgs(locale as Locale, parkName, park?.nameArticleDe),
      });

  return {
    title,
    description,
    keywords,
    ...(isDeduplicatedVariant && { robots: { index: false, follow: true } }),
    ...buildOpenGraphMetadata({
      locale,
      title,
      description,
      url: `${SITE_URL}/${locale}/parks/${continent}/${country}/${city}/${parkSlug}/${canonicalAttractionSlug}`,
      ogImageUrl,
      imageAlt: tImageAlt('attraction', {
        ...parkArgs(locale as Locale, parkName, park?.nameArticleDe),
        attraction: attractionName,
        park: parkName,
      }),
    }),
    alternates: {
      canonical: `${SITE_URL}/${locale}/parks/${continent}/${country}/${city}/${parkSlug}/${canonicalAttractionSlug}`,
      languages: {
        ...generateAlternateLanguages(
          (l) =>
            `/${l}/parks/${continent}/${country}/${city}/${parkSlug}/${canonicalAttractionSlug}`
        ),
        'x-default': `${SITE_URL}/en/parks/${continent}/${country}/${city}/${parkSlug}/${canonicalAttractionSlug}`,
      },
    },
  };
}

/**
 * Title, description and alternates for a ride that closed for good. Indexable like every ride
 * page, with the canonical on itself: the point of keeping the page is to keep what the URL ranks
 * for. The description is also the page's intro (`closedRideDescription`).
 */
async function closedRideMetadata({
  locale,
  path,
  pathSegments,
  park,
  ride,
}: {
  locale: Locale;
  path: string;
  pathSegments: string[];
  park: ParkWithAttractions;
  ride: ClosedRide;
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'seo.attraction' });
  const tImageAlt = await getTranslations({ locale, namespace: 'seo.imageAlt' });
  const attractionName = stripNewPrefix(ride.name);
  const parkName = stripNewPrefix(park.name);
  const phrase = { locale, articleDe: park.nameArticleDe };
  const title = buildClosedRideTitle(attractionName, parkName, t, phrase);
  const description = closedRideDescription(ride, park, locale, t);
  const url = `${SITE_URL}/${locale}${path}`;

  return {
    title,
    description,
    ...buildOpenGraphMetadata({
      locale,
      title,
      description,
      url,
      ogImageUrl: getOgImageUrl(pathSegments),
      imageAlt: tImageAlt('attraction', {
        ...parkArgs(locale, parkName, park.nameArticleDe),
        attraction: attractionName,
        park: parkName,
      }),
    }),
    alternates: {
      canonical: url,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}${path}`),
        'x-default': `${SITE_URL}/en${path}`,
      },
    },
  };
}

/** The closed ride's description, shared by the metadata and the page's intro. */
function closedRideDescription(
  ride: ClosedRide,
  park: ParkWithAttractions,
  locale: Locale,
  t: Parameters<typeof buildClosedRideDescription>[4]
): string {
  const weekdayPeak = ride.typicalWaits?.displayable
    ? (ride.typicalWaits.weekday.typical ?? null)
    : null;
  return buildClosedRideDescription(
    stripNewPrefix(ride.name),
    stripNewPrefix(park.name),
    formatClosedOn(ride.retiredAt, locale),
    {
      weekdayPeak,
      manufacturer: ride.rideProfile?.manufacturer,
      openedYear: ride.rideProfile?.openedYear,
    },
    t,
    { locale, articleDe: park.nameArticleDe }
  );
}

// Rendered per request, so there is no ISR shell write per attraction × locale. The page reads the
// data-cached park snapshot and renders the full content (h1, JSON-LD, FAQ) into the first HTML;
// live status and the history time-series load on the client.
export const dynamic = 'force-dynamic';

export default async function AttractionPage({ params }: AttractionPageProps) {
  const {
    locale,
    continent,
    country,
    city,
    park: parkSlug,
    attraction: attractionSlug,
  } = await params;
  assertServableRoute(locale, continent, country, city, parkSlug, attractionSlug);
  setRequestLocale(locale);

  const t = await getTranslations('attractions');
  const tCommon = await getTranslations('common');
  const tGeo = await getTranslations('geo');
  const tSeo = await getTranslations('seo.attraction');

  // Only the lean park snapshot is fetched here; the attraction's daily history and hourly
  // forecast load client-side in <AttractionHistorySections> through the CDN-cached attraction
  // route. The park-embedded attraction carries everything the shell, JSON-LD and FAQ need.
  // Not `catchNonFatal`: a failed fetch must throw rather than 404 — see the park page.
  const park = await getParkByGeoPath(continent, country, city, parkSlug);
  const attraction = park?.attractions?.find((a) => a.slug === attractionSlug) ?? null;

  if (!park) {
    // Park slug is stable across API geo re-slugs — 308 old attraction URLs
    // (e.g. /germany/bruhl/phantasialand/taron) to the park's current path.
    const relocatedUrl = await findRelocatedParkRedirect(continent, country, city, parkSlug);
    if (relocatedUrl) {
      permanentRedirect(`/${locale}${relocatedUrl}/${attractionSlug}`);
    }
  }

  // Renamed park (upstream slug change): the API 301'd the old path and `fetch` followed it,
  // so the park resolved under a path it no longer owns. Send the visitor — and the attraction's
  // accumulated ranking — to the current one instead of rendering a duplicate.
  if (park) {
    const renamedUrl = findRenamedParkRedirect(park, { continent, country, city, parkSlug });
    if (renamedUrl) {
      permanentRedirect(`/${locale}${renamedUrl}/${attractionSlug}`);
    }
  }

  if (!park) {
    notFound();
  }

  // Not in the park payload: either a ride that closed for good, which keeps its page, or a 404.
  // Asked only on this miss, so a live ride's render costs nothing extra.
  const closedRide = attraction
    ? null
    : await getClosedRide(continent, country, city, parkSlug, attractionSlug);
  if (!attraction && !closedRide) {
    notFound();
  }

  const continentName = translateContinent(tGeo, continent, locale);
  const countryName = translateCountry(tGeo, country, locale, park.country ?? undefined);
  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  const attractionName = stripNewPrefix(attraction?.name ?? closedRide?.name ?? '');
  const parkName = stripNewPrefix(park.name);

  const tNav = await getTranslations('navigation');
  const { breadcrumbs, currentPage: attractionCurrentPage } = generateAttractionBreadcrumbs({
    continent,
    country,
    city,
    parkSlug,
    continentName,
    countryName,
    cityName,
    cityHasPage: await cityHasOwnPage(continent, country, city),
    parkName,
    attractionName,
    homeLabel: tCommon('home'),
    continentsLabel: tNav('continents'),
  });

  const attractionUrl = `${SITE_URL}/${locale}/parks/${continent}/${country}/${city}/${parkSlug}/${attractionSlug}`;

  if (closedRide) {
    return (
      <RouteMessages route="/parks/[continent]/[country]/[city]/[park]/[attraction]">
        <ClosedRidePage
          locale={locale as Locale}
          continent={continent}
          country={country}
          city={city}
          parkSlug={parkSlug}
          attractionSlug={attractionSlug}
          park={park}
          ride={closedRide}
          breadcrumbs={breadcrumbs}
          currentPage={attractionCurrentPage}
          url={attractionUrl}
          ogImageUrl={getOgImageUrl([locale, continent, country, city, parkSlug, attractionSlug])}
          description={closedRideDescription(closedRide, park, locale as Locale, tSeo)}
        />
      </RouteMessages>
    );
  }
  // Unreachable — the two checks above leave a live attraction or a closed ride — but it is what
  // narrows `attraction` for everything below.
  if (!attraction) {
    notFound();
  }

  // The ride's own photo or nothing (`ParkBackground` renders null): the park's photo would make
  // a photo-less ride look like it had one, and the wrong one.
  const backgroundImage = getAttractionBackgroundImage(parkSlug, attractionSlug);
  // OG card is only a fallback for the JSON-LD image when the ride has no photo.
  const ogImageUrl = getOgImageUrl([locale, continent, country, city, parkSlug, attractionSlug]);

  // Does the facts band have anything to show? Without this a ride with neither
  // metadata nor a profile renders a bare divider line. It covers the RCDB link
  // too, which is why it is not simply AttractionMetaBadges' own `hasAny`.
  const hasMetaBadges =
    attraction.minimumHeight != null ||
    attraction.maximumHeight != null ||
    Boolean(attraction.mayGetWet) ||
    attraction.hasSingleRider === true ||
    attraction.hasVirtualLine === true ||
    Boolean(attraction.fastPass) ||
    attraction.rcdbId != null;

  // The outbound reference closes the facts band, after everything the ride IS.
  // Passed THROUGH the teaser when there is a profile so it lands left of the
  // "N figures" jump link, which is pushed to the far right and has to stay last.
  const rcdbBadge =
    attraction.rcdbId != null ? (
      <RcdbBadge rcdbId={attraction.rcdbId} attractionName={attractionName} />
    ) : null;

  // Whether the ride-profile chapter renders, by the predicate `RideProfileSection` asks, so no
  // tile points at an anchor that is not on the page.
  const hasRideProfile = attraction.rideProfile
    ? await rideProfileRenders(attraction.rideProfile, locale as Locale)
    : false;

  const tFaqItems = await getTranslations('seo.faq.attraction');
  const tRideProfile = await getTranslations('attraction.rideProfile');
  // Whether the FAQ chapter renders, by the pure builder <AttractionFAQSection> calls, so asking
  // twice costs a function call.
  const faqCount = buildAttractionFaqItems(
    attraction,
    park,
    tFaqItems as Parameters<typeof buildAttractionFaqItems>[2]
  ).length;

  // Today in the park's timezone, for the rope-drop card's closing cap and the history calendar's
  // row reservation; the browser's date can be a day off. Safe to read the server clock here: the
  // route is `force-dynamic`, so there is no ISR window to pin.
  const todayIso = formatInTimeZone(new Date(), park.timezone, 'yyyy-MM-dd');

  /**
   * The one shell snapshot both client trees read, built once: React Flight dedupes by object
   * identity, so two equal objects would be written to the payload twice. `attraction` below is
   * the object inside it, so that prop costs a back-reference. See docs/architecture/api-budget.md.
   */
  const shellPark = leanParkForAttractionShell(park, attraction);

  // Whether „Beste Besuchszeit planen" renders anything: both of its cards are optional, and the
  // chapter row must not offer a jump to an anchor that is not on the page.
  const hasPlanChapter = Boolean(attraction.ropeDrop || attraction.typicalWaits?.displayable);

  /**
   * Whether this park publishes wait times at all. Today's curve and the 30-day calendar have no
   * answer without them, and their reserved boxes would collapse to one line on a park like
   * Hansa-Park. Read from the curated flag, never derived from an empty payload: a park with no
   * source is byte-for-byte a park shut for the night. See docs/rules/parks-we-cannot-read.md.
   */
  const waitsReadable = hasReadableWaitTimes(park);

  return (
    <RouteMessages route="/parks/[continent]/[country]/[city]/[park]/[attraction]">
      <>
        {/* Tells the planner which park this route is about (`lib/planner/page-park.ts`): the
          panel lives in the layout and cannot otherwise tell one park's page from another's. */}
        <PlannerPageParkBeacon
          slug={park.slug}
          name={stripNewPrefix(park.name)}
          geo={{ continent, country, city }}
          timezone={park.timezone}
          backgroundImage={getParkBackgroundImage(park.slug)}
          backgroundPosition={getCardObjectPosition(park.slug)}
        />
        <AttractionStructuredData
          attraction={attraction}
          park={park}
          url={attractionUrl}
          locale={locale}
          description={tSeo('metaDescriptionTemplate', {
            attraction: attractionName,
            ...parkArgs(locale as Locale, parkName, park.nameArticleDe),
            city: cityName,
          })}
          ogImageUrl={ogImageUrl}
        />
        <AttractionFAQStructuredData attraction={attraction} park={park} locale={locale} />
        <BreadcrumbStructuredData
          breadcrumbs={breadcrumbs}
          currentPage={{
            name: attractionCurrentPage,
            url: `/parks/${continent}/${country}/${city}/${parkSlug}/${attractionSlug}`,
          }}
          locale={locale}
        />
        <ParkBackground
          imageSrc={backgroundImage}
          // The sidecar's authored sentence in this locale: the bare name would tell a screen
          // reader nothing the heading had not already said.
          alt={getMediaAltBySrc(backgroundImage, locale) ?? attractionName}
          objectPosition={objectPositionForSrc(backgroundImage)}
        />
        <PageContainer>
          <BreadcrumbNav
            breadcrumbs={breadcrumbs}
            currentPage={attractionCurrentPage}
            pinLastBreadcrumb
            // The title card's park link is the way one level up on a phone.
            phone="hidden"
          />

          <article itemScope itemType="https://schema.org/TouristAttraction">
            {/* The park header's card, not a lookalike: `variant="tile"` and `mb-4` as in
              `ParkPageShell`, so two pages over the same photo open on the same glass. */}
            <div className="mb-4">
              <GlassCard variant="tile">
                {/* In flow, not absolutely positioned, so a long name wraps beside the star
                  instead of underneath it. */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* The wait-time keyword lives inside the h1 (a styled span) so the primary
                      heading carries "Wartezeit". The literal space before the span keeps the
                      extracted text from reading "Taron– Aktuelle Wartezeit". */}
                    <h1 className="mb-2 text-3xl font-bold md:text-4xl">
                      {attractionName}{' '}
                      <span className="text-muted-foreground text-xl font-normal md:text-2xl">
                        – {t('h1Suffix')}
                      </span>
                    </h1>
                    {/* Muted like the park header's address line: where the ride is, not what it
                      is. min-h reserves the row's two-line height on a phone (24 + 12 + 22 px):
                      below `sm` it sits at its wrap threshold, and the font swap and
                      ParkDistance's badge would flip it between one and two lines.
                      `content-start` keeps a single line from centring inside the box. */}
                    <div className="text-muted-foreground flex min-h-[58px] flex-wrap content-start items-center gap-3 sm:min-h-0">
                      <Link
                        href={
                          `/parks/${continent}/${country}/${city}/${parkSlug}` as '/parks/europe/germany/rust/europa-park'
                        }
                        prefetch={false}
                        className="hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        {parkName}
                      </Link>
                      {/* Distance to the PARK this ride sits in (rides share the park's location
                        for travel purposes) — client-only, appears once the position is known. */}
                      <ParkDistance latitude={park.latitude} longitude={park.longitude} size="md" />
                      {attraction.land && <Badge variant="outline">{attraction.land}</Badge>}
                      {/* What this ride IS, next to where it is: the curated
                          marker for a station on a park railway, whose wait is
                          a departure interval rather than a queue. Independent
                          of the season and works badges beside it. */}
                      <TransportSystemBadge attractionKind={attraction.attractionKind} />
                      {attraction.isSeasonal && (
                        <SeasonalBadge
                          seasonMonths={attraction.seasonMonths}
                          isCurrentlyInSeason={attraction.isCurrentlyInSeason}
                        />
                      )}
                      {/* Beside the season badge and not instead of it — the two say different
                          things about the same ride. The dates are in the note below. */}
                      <WorksPeriodBadge worksPeriod={attraction.worksPeriod} todayIso={todayIso} />
                    </div>
                  </div>
                  {attraction.id && (
                    <div className="flex items-center gap-2">
                      {/* The planner's first step from a ride page. */}
                      <AddToPlannerButton
                        parkSlug={parkSlug}
                        parkName={parkName}
                        geo={{ continent, country, city }}
                        attractionSlug={attractionSlug}
                        attractionName={attraction.name}
                        timezone={park.timezone}
                      />
                      <FavoriteStar type="attraction" id={attraction.id} size="lg" />
                    </div>
                  )}
                </div>

                {/* Facts band: what this ride is, apart from where it is, in the order that
                  matters: whether you may ride (height), what it does, what kind it is, who built
                  it, then RCDB. Below `sm` it is one row that scrolls sideways instead of
                  wrapping in front of the live wait, so the order decides what is in view. */}
                {(hasMetaBadges || attraction.rideProfile) && (
                  <div className="border-border/50 no-scrollbar mt-5 flex items-center gap-2 border-t pt-4 max-sm:overflow-x-auto sm:flex-wrap">
                    <AttractionMetaBadges
                      minimumHeight={attraction.minimumHeight}
                      maximumHeight={attraction.maximumHeight}
                      mayGetWet={attraction.mayGetWet}
                    />
                    {/* After the restrictions, before what the ride IS: a queue-jump
                        pass is a fact about the visit, like the height limits, and
                        not part of the ride's identity. */}
                    <SingleRiderBadge hasSingleRider={attraction.hasSingleRider} />
                    <VirtualLineBadge hasVirtualLine={attraction.hasVirtualLine} />
                    <FastPassBadge fastPass={attraction.fastPass} />
                    {attraction.rideProfile ? (
                      <RideProfileTeaser profile={attraction.rideProfile} locale={locale as Locale}>
                        {rcdbBadge}
                      </RideProfileTeaser>
                    ) : (
                      rcdbBadge
                    )}
                  </div>
                )}
                <RideExposureLine indoorOutdoor={attraction.indoorOutdoor} />

                {/* Server-rendered intro: crawlable text for "{attraction} Wartezeit" that the
                  client-streamed live panel does not give as HTML. Inside the card, as on the
                  park page. Clamped to two lines below `sm`; the full text stays in the HTML. */}
                <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed max-sm:line-clamp-2">
                  {t('intro', {
                    attraction: attractionName,
                    ...parkArgs(locale as Locale, parkName, park?.nameArticleDe),
                  })}
                </p>
              </GlassCard>
            </div>

            {/* The fold, one card as on the park page: „Heute an dieser Bahn" on top and the
              chapter row as its footer. The tiles are jump links, not tabs: tabs would take the
              typical-wait table, the history, the ride profile and the FAQ out of the served
              HTML. */}
            <ParkHeaderCard
              panel={
                <RideLiveHeader
                  initialPark={shellPark}
                  todayIso={todayIso}
                  attractionSlug={attractionSlug}
                  continent={continent}
                  country={country}
                  city={city}
                  parkSlug={parkSlug}
                />
              }
              tiles={
                <RideNavTiles
                  continent={continent}
                  country={country}
                  city={city}
                  parkSlug={parkSlug}
                  attractionSlug={attractionSlug}
                  attraction={attraction}
                  timezone={park.timezone}
                  hasWaitTimeChapters={waitsReadable}
                  hasPlanChapter={hasPlanChapter}
                  hasRideProfile={hasRideProfile}
                  rideProfileCount={attraction.rideProfile?.elements?.length ?? 0}
                  hasFaq={faqCount > 0}
                  faqCount={faqCount}
                  labels={{ rideProfile: tRideProfile('title'), faq: tFaqItems('title') }}
                />
              }
            />

            {/* Parks that publish wait times only inside their own app (Hansa-Park). Above the
              chapters, as on the park page: it answers the question the empty panel above
              raised. */}
            <NoLiveWaitTimesNotice
              reason={noLiveWaitTimesReason(park)}
              scope="ride"
              className="mt-4 mb-8"
            />

            {/* Why the panel above is empty when the ride is being rebuilt. Same place and
              surface as the notice above; renders nothing outside a curated window. */}
            <WorksPeriodNote
              worksPeriod={attraction.worksPeriod}
              todayIso={todayIso}
              className="mt-4 mb-8"
            />

            {/* Chapter: today's curve, what the queue has done since opening and what it is
              forecast to do, plus the ride's other queues. The live minute is in the header. */}
            {waitsReadable && (
              <ChapterPanel
                icon={Clock}
                title={t('todayChart.title')}
                // The chart draws no heading of its own (`hideTitle`), so its KI-Prognose pill,
                // with the glossary link, rides up to this title.
                badge={
                  <GlossaryTermLink termId="ai-forecast">
                    <Badge className="border-primary/20 bg-primary/10 text-primary gap-1">
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      {t('todayChart.aiBadge')}
                    </Badge>
                  </GlossaryTermLink>
                }
                id="live"
                // The chart brings its own padding and the queue band under it is a `PanelGrid`
                // whose cells bring theirs — a `p-4` here would be a second box inside the box.
                bodyPadding="none"
              >
                {/* initialPark is trimmed to this attraction and the park fields this page reads
                (leanParkForAttractionShell), not the full park with every sibling ride. */}
                <LiveAttractionData
                  initialPark={shellPark}
                  attractionSlug={attractionSlug}
                  continent={continent}
                  country={country}
                  city={city}
                  parkSlug={parkSlug}
                />
              </ChapterPanel>
            )}

            {/* Chapter: plan your visit, rope-drop and typical waits, server-rendered for
              headliners so they paint together. The rope-drop recommendation is precomputed daily
              for tier1/tier2 headliners, and today's closing caps its times. Gated on having
              something to say. */}
            {hasPlanChapter && (
              <ChapterPanel
                icon={Sparkles}
                title={t('sectionPlanVisit')}
                /* Names the basis, like „Basierend auf den letzten 31 Tagen" one chapter down, but
                  no window: the two cards are computed over different ones. Short enough for two
                  lines in the heading's 256 px column on a 360 px phone. */
                hint={t('sectionPlanVisitHint')}
                id="plan"
                bodyPadding="none"
              >
                {/* Two readings in one box with a hairline between them, as „Heute im Park" does;
                  both render `bare` because `PANEL_CELL` is the box. The column count may be
                  decided from the data because both components are total over it: `RopeDropCard`
                  renders for every `ropeDrop`, `AttractionTypicalWaits` exactly when
                  `displayable`. See
                  docs/rules/a-cell-is-gated-on-its-content-and-a-component-that-fills-one.md. */}
                <PanelGrid
                  columnCount={attraction.ropeDrop && attraction.typicalWaits?.displayable ? 2 : 1}
                >
                  {attraction.ropeDrop && (
                    <div className={PANEL_CELL}>
                      <RopeDropCard
                        bare
                        ropeDrop={attraction.ropeDrop}
                        typicalWaits={attraction.typicalWaits}
                        timezone={park.timezone}
                        todayClosingUtc={
                          park.schedule?.find(
                            (sch) => sch.date === todayIso && sch.scheduleType === 'OPERATING'
                          )?.closingTime ?? null
                        }
                        parkHasRecommendations={(park.attractions ?? []).some(
                          (a) => a.ropeDrop && (a.ropeDrop.worth || isEveningBetter(a.ropeDrop))
                        )}
                      />
                    </div>
                  )}
                  {/* Typical (P50) vs busy (P90) peak waits — precomputed per headliner, rendered
                    in the static shell for SEO and instant paint. Non-headliner displayable rides
                    fall back to the client render under the calendar. */}
                  {attraction.typicalWaits?.displayable && (
                    <div className={PANEL_CELL}>
                      <AttractionTypicalWaits bare typicalWaits={attraction.typicalWaits} />
                    </div>
                  )}
                </PanelGrid>
              </ChapterPanel>
            )}

            {/* Chapter: the ride's own 30-day calendar, client-loaded from the CDN-cached
              attraction route (one fetch shared with the chart and the header card). The heading
              and the legend are in the served HTML; only the grid's own box is held. */}
            {waitsReadable && (
              <AttractionHistorySections
                continent={continent}
                country={country}
                city={city}
                parkSlug={parkSlug}
                attractionSlug={attractionSlug}
                todayIso={todayIso}
                suppressTypicalWaits={!!attraction.typicalWaits?.displayable}
              />
            )}

            {/* Chapter: how often it has been reported down, or one line saying why we do not
              say. A ChapterPanel only where there are numbers. The refusals about our data stay
              apart from the ride: "no source here reports outages" must never read as "this ride
              never breaks". */}
            <AttractionDowntimeSection
              downtime={attraction.downtime}
              attractionName={attraction.name}
            />

            {/* Chapter: what this ride is and does, the curated link into the glossary. Static
              data, so it renders into the shell; its own <PageSection> carries the #ride-profile
              anchor the header teaser jumps to. */}
            {attraction.rideProfile && (
              <RideProfileSection profile={attraction.rideProfile} locale={locale as Locale} />
            )}

            {/* Chapter: FAQ (its own PageSection lives inside the component) */}
            <AttractionFAQSection attraction={attraction} park={park} />

            {/* Chapter: what we wrote about this ride, from the generated blog manifest, so no
              API call. Not behind <Suspense>: the lookups are synchronous, and a
              `fallback={null}` would let the chapter drop in at full height. */}
            <AttractionBlogPostsSection
              locale={locale as Locale}
              parkSlug={parkSlug}
              attractionSlug={attractionSlug}
              geoPath={`${continent}/${country}/${city}`}
              attractionName={attractionName}
            />

            <div className="mt-10">
              <ShareButtons url={attractionUrl} title={attractionName} />
            </div>

            <ContributeBanner
              className="mt-8"
              href={
                attraction.id
                  ? buildContributeHref({
                      type: 'attraction',
                      id: attraction.id,
                      name: attractionName,
                      slug: attractionSlug,
                      url: `/parks/${continent}/${country}/${city}/${parkSlug}/${attractionSlug}`,
                      country: park.country ?? undefined,
                      parentParkName: parkName,
                    })
                  : undefined
              }
            />

            <PreferredSourcePrompt compact className="mt-8" />
          </article>
        </PageContainer>
      </>
    </RouteMessages>
  );
}
