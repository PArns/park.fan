import { getTranslations, setRequestLocale } from 'next-intl/server';
import { formatInTimeZone } from 'date-fns-tz';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import {
  buildAttractionTitle,
  buildAttractionDescription,
  buildAttractionFacts,
} from '@/lib/seo/attraction-meta';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound, permanentRedirect } from 'next/navigation';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { Link } from '@/i18n/navigation';
import { Clock, MapPin, Sparkles } from 'lucide-react';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { Badge } from '@/components/ui/badge';
import { SeasonalBadge } from '@/components/parks/seasonal-badge';
import { FastPassBadge } from '@/components/parks/fast-pass-badge';
import { SingleRiderBadge } from '@/components/parks/single-rider-badge';
import { AttractionMetaBadges } from '@/components/parks/attraction-meta-badges';
import { RcdbBadge } from '@/components/parks/rcdb-badge';
import { PageSection } from '@/components/common/page-section';
import { getParkByGeoPath, leanParkForAttractionShell } from '@/lib/api/parks';
import { catchNonFatal } from '@/lib/api/client';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import type { Metadata } from 'next';
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
import { stripNewPrefix, cn } from '@/lib/utils';
import { findRelocatedParkRedirect, findRenamedParkRedirect } from '@/lib/utils/redirect-utils';
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

  // The park was renamed upstream: the API 301'd our request for the old path and `fetch`
  // followed it, so `park` is valid but lives elsewhere now. Canonical points at the real
  // attraction path; the page body issues the matching 308.
  // `park` is non-null here (a null park means no attraction, handled above), but the
  // narrowing doesn't survive the optional chain that produced `attraction`.
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

  // Numbered-suffix slugs (e.g. playground-2, behind-the-seams-3) are backend
  // duplicates of the base attraction. Mark them noindex and point canonical at
  // the base slug so Google consolidates signals on the primary page.
  const isVariantSlug = /^.+-\d+$/.test(attractionSlug);
  const baseSlug = isVariantSlug ? attractionSlug.replace(/-\d+$/, '') : attractionSlug;
  const canonicalAttractionSlug = park?.attractions?.some((a) => a.slug === baseSlug)
    ? baseSlug
    : attractionSlug;
  // Only noindex when we actually resolved a different canonical — avoids
  // incorrectly noindexing legitimate slugs like "area-51" or "coaster-360".
  const isDeduplicatedVariant = isVariantSlug && canonicalAttractionSlug !== attractionSlug;

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

  // One template for every ride fitted inside Google's ~60 characters for 33.2%
  // of English rides, 29.9% of German ones and 7.1% of Italian, and said the same
  // sentence on all 42,606 of them. The ladder takes every locale to ~98%; the
  // facts come off the attraction this fetch already returned.
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

// FULLY DYNAMIC (force-dynamic) — rendered per request, so NO per-URL ISR shell write (the dominant
// write-units source pre-#118 was prerendering every attraction × 6 locales). Cache Components is
// off; this page reads the data-cached park snapshot (getParkByGeoPath, `fetch` next:revalidate,
// shared per park) and renders the full content (h1, JSON-LD, FAQ) server-side into the first HTML
// — content-first, no skeleton. Live status/wait times + the heavy history time-series are
// client-loaded (React Query). No generateStaticParams needed.
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

  // Only the lean park snapshot is fetched in the static shell. The attraction's heavy detail — the
  // daily `history` + `hourlyForecast` time-series — is loaded CLIENT-side inside
  // <AttractionHistorySections> (via the CDN-cached /api/parks/.../attractions/<slug> route), so it
  // no longer bakes into every per-attraction × per-locale ISR write (the dominant write source).
  // The park-embedded attraction carries everything the shell + JSON-LD + FAQ need (name,
  // statistics, bestVisitTimes); live status/wait times still come from the client poll.
  const park = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));
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

  if (!park || !attraction) {
    notFound();
  }

  // Format names
  const continentName = translateContinent(tGeo, continent, locale);
  const countryName = translateCountry(tGeo, country, locale, park.country ?? undefined);
  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  const attractionName = stripNewPrefix(attraction.name);
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
    parkName,
    attractionName,
    homeLabel: tCommon('home'),
    continentsLabel: tNav('continents'),
  });

  const attractionUrl = `${SITE_URL}/${locale}/parks/${continent}/${country}/${city}/${parkSlug}/${attractionSlug}`;

  // The ride's own photo or nothing — `ParkBackground` renders null and the page
  // keeps its plain backdrop. Showing the park's picture here made a photo-less
  // ride look like it had a photo, and it was the wrong one.
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
    Boolean(attraction.fastPass) ||
    attraction.rcdbId != null;

  // The outbound reference closes the facts band, after everything the ride IS.
  // Passed THROUGH the teaser when there is a profile so it lands left of the
  // "N figures" jump link, which is pushed to the far right and has to stay last.
  const rcdbBadge =
    attraction.rcdbId != null ? (
      <RcdbBadge rcdbId={attraction.rcdbId} attractionName={attractionName} />
    ) : null;

  // Does the FAQ chapter actually render? <AttractionFAQSection> returns null on an empty set,
  // and the chapter row must not offer a jump to an anchor that is not on the page. Same pure
  // builder the section itself calls — it reads the attraction it was handed and does no I/O,
  // so asking twice costs a function call.
  // Does the ride-profile chapter actually render? `RideProfileSection` returns null when the
  // curated ids resolve to nothing and the profile carries no facts, and a tile must not point at
  // an anchor that is not on the page. Same predicate the section itself asks.
  const hasRideProfile = attraction.rideProfile
    ? await rideProfileRenders(attraction.rideProfile, locale as Locale)
    : false;

  const tFaqItems = await getTranslations('seo.faq.attraction');
  const tRideProfile = await getTranslations('attraction.rideProfile');
  const faqCount = buildAttractionFaqItems(
    attraction,
    park,
    tFaqItems as Parameters<typeof buildAttractionFaqItems>[2]
  ).length;

  // Today in the PARK's timezone. Two things read it and both would be wrong from the browser's:
  // the rope-drop card's closing cap below, and the history calendar's row reservation — a
  // Florida park is still on yesterday's date for six hours after midnight in Berlin. Safe to
  // read the server clock here because this route is `force-dynamic`; there is no ISR window for
  // it to pin.
  const todayIso = formatInTimeZone(new Date(), park.timezone, 'yyyy-MM-dd');

  /**
   * The one shell snapshot both client trees read, built ONCE.
   *
   * `leanParkForAttractionShell` is what takes this route's serialized park data from 36.3 KB to
   * 3.7 KB (see docs/architecture/api-budget.md), and calling it twice undoes half of that: React
   * Flight dedupes by object IDENTITY, so two calls producing equal objects are written to the
   * payload twice, on 42,756 URLs × 6 locales. One call, one reference, one copy in the payload —
   * and `attraction` below is the very object inside it, so that prop costs a back-reference
   * rather than a third copy.
   */
  const shellPark = leanParkForAttractionShell(park, attraction);

  // Does „Beste Besuchszeit planen" render anything? Both of its cards are optional, and the
  // chapter row must not offer a jump to an anchor that is not on the page — same rule the ride
  // profile and the FAQ tiles already follow.
  const hasPlanChapter = Boolean(attraction.ropeDrop || attraction.typicalWaits?.displayable);

  /**
   * Does this park publish wait times at all?
   *
   * Two whole chapters answer questions that have no answer without them — today's curve and the
   * 30-day calendar — and both are client-loaded behind a reserved box. On Hansa-Park, which
   * publishes wait times only inside its own app, that box was 880 px on a desktop and 2024 px on
   * a phone, and what landed in it was the one-line „Keine historischen Daten"; the chart card
   * collapsed from its 401 px skeleton to 2 px. Measured with `pnpm measure:cls --late --scroll`
   * on `hansa-park/nessie`: **0.5325** with the reader parked on the chapter, all of it those two
   * boxes deflating.
   *
   * The curated `liveWaitTimes` flag is the only honest signal here and the server has it — a
   * park with no source is byte-for-byte a park shut for the night, so this may never be derived
   * from an empty payload. `NoLiveWaitTimesNotice` above the chapters already says why they are
   * gone.
   *
   * What this does NOT cover is a ride inside a wait-times park that has no measured day of its
   * own (2 of 8 non-headliners sampled at Phantasialand). Nothing in the shell can predict it —
   * `statistics` is null on every attraction of the park payload — so it is left alone rather
   * than guessed at, the same call `NearbyParksSection` makes one page over.
   */
  const waitsReadable = hasReadableWaitTimes(park);

  return (
    <RouteMessages route="/parks/[continent]/[country]/[city]/[park]/[attraction]">
      <>
        {/* Tells the planner which park this route is about — see
          `lib/planner/page-park.ts`. The panel lives in the layout and
          otherwise cannot tell one park's page from another's, which is how its
          header came to name a park the reader was not looking at. */}
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
          // The sidecar's authored sentence in this locale, not the bare entity name:
          // "{park}" told a screen reader nothing the heading had not already said.
          alt={getMediaAltBySrc(backgroundImage, locale) ?? attractionName}
          objectPosition={objectPositionForSrc(backgroundImage)}
        />
        <PageContainer>
          <BreadcrumbNav
            breadcrumbs={breadcrumbs}
            currentPage={attractionCurrentPage}
            pinLastBreadcrumb
          />

          <article itemScope itemType="https://schema.org/TouristAttraction">
            {/* Header — the park header's card, not a lookalike: `variant="tile"` is the
              recipe `ParkPageShell` wraps its own title card in, and this one carried `medium`.
              Two pages one click apart over the same photograph opened on two grades of glass,
              which reads as two kinds of surface rather than one. The `mb-4` is the park's too:
              the title card and the header card under it are one stack. */}
            <div className="mb-4">
              <GlassCard variant="tile">
                {/* Title row: ride name + where it is on the left, favourite top-right.
                  In flow, not absolutely positioned — a long name now wraps beside the
                  star instead of underneath it. */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* The wait-time keyword lives INSIDE the h1 (a styled span, not a
                      sibling) so the primary heading actually carries "Wartezeit" — the
                      strongest on-page signal for "{attraction} wartezeit" queries. */}
                    {/* The literal space before the span matters: without it the extracted text
                      (SERP snippets, screen readers) reads "Taron– Aktuelle Wartezeit". */}
                    <h1 className="mb-2 text-3xl font-bold md:text-4xl">
                      {attractionName}{' '}
                      <span className="text-muted-foreground text-xl font-normal md:text-2xl">
                        – {t('h1Suffix')}
                      </span>
                    </h1>
                    {/* Muted like the park header's address line: this is where the ride
                      is, not what it is — the facts band below carries that.

                      min-h is this row's own two-line height on a phone: 24px (the park link at
                      text-base) + 12px (gap-3's row gap) + 22px (an outline Badge). Below `sm`
                      the row sits within a couple of px of its wrap threshold, so one load
                      flipped it 58 → 24 → 58px twice — once when Geist replaced the wider
                      fallback face, once when ParkDistance swapped its placeholder for the real
                      badge — and charged 0.32 CLS on a phone. Reserving the two lines makes both
                      transitions free. `content-start` is load-bearing: with `items-center` a
                      single line would centre itself 17px down inside the reserved box. From
                      `sm` the row has the width never to wrap, the cutoff DistanceGap uses. */}
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
                      {attraction.isSeasonal && (
                        <SeasonalBadge
                          seasonMonths={attraction.seasonMonths}
                          isCurrentlyInSeason={attraction.isCurrentlyInSeason}
                        />
                      )}
                    </div>
                  </div>
                  {attraction.id && (
                    <div className="flex items-center gap-2">
                      {/* The planner's real entry point. Its floating launcher only
                          appears once something is planned, so without a control
                          here the feature has no first step. */}
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

                {/* Facts band: what this ride IS, separated from where it is — the ride's
                  counterpart to the park header's stats band, same hairline and spacing.
                  One row mixing a navigation link, a live distance, a category label and
                  an outbound reference gave all four the same weight.

                  The order inside it is the point: what decides whether you may ride
                  (height), then what the ride does (inversions), then what kind of ride
                  it is, then who built it and when, then the way out to RCDB. */}
                {(hasMetaBadges || attraction.rideProfile) && (
                  <div className="border-border/50 mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
                    <AttractionMetaBadges
                      minimumHeight={attraction.minimumHeight}
                      maximumHeight={attraction.maximumHeight}
                      mayGetWet={attraction.mayGetWet}
                    />
                    {/* After the restrictions, before what the ride IS: a queue-jump
                        pass is a fact about the visit, like the height limits, and
                        not part of the ride's identity. */}
                    <SingleRiderBadge hasSingleRider={attraction.hasSingleRider} />
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

                {/* Keyword-rich, server-rendered intro — crawlable topical text for
                  "{attraction} Wartezeit(en)" that the client-streamed live panel doesn't
                  provide as static HTML. Inside the card, exactly like the park page: on
                  the bare background it sat on top of the hero photo and was unreadable. */}
                <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed">
                  {t('intro', {
                    attraction: attractionName,
                    ...parkArgs(locale as Locale, parkName, park?.nameArticleDe),
                  })}
                </p>
              </GlassCard>
            </div>

            {/* The fold — one card, exactly as the park page's is: „Heute an dieser Bahn" on
              top and the chapter row as its footer band. They were a title card, a gap, and a row
              of four rounded tiles with an icon and a label in them, over a live wait time that
              did not appear until the first chapter heading had gone by.

              The tiles are jump links rather than tabs, and that part does not change: switching
              a `Tabs` here would take the typical-wait table, the 30-day history, the ride profile
              and the FAQ out of every ride page's served HTML, which is most of what a ride page
              is for. */}
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
              chapters rather than inside the live one, exactly where the park page puts it: it is
              the answer to the question the empty panel above already raised. Renders nothing for
              the other 212 parks. */}
            <NoLiveWaitTimesNotice
              reason={noLiveWaitTimesReason(park)}
              scope="ride"
              className="mt-4 mb-8"
            />

            {/* Chapter: today's curve. The live minute moved up into the header card, so what
              this chapter is about is the day — what the queue has done since opening and what it
              is forecast to do — plus the ride's other queues. */}
            {waitsReadable && (
              <PageSection
                icon={Clock}
                title={t('todayChart.title')}
                // The chart's own h3 said this same string one line under the h2, so it draws no
                // heading here (`hideTitle`) and its KI-Prognose pill rides up with the title it
                // belonged to — the glossary link is the reason it is worth carrying over.
                badge={
                  <GlossaryTermLink termId="ai-forecast">
                    <Badge className="border-primary/20 bg-primary/10 text-primary gap-1">
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      {t('todayChart.aiBadge')}
                    </Badge>
                  </GlossaryTermLink>
                }
                frosted
                id="live"
              >
                {/* initialPark is trimmed to THIS attraction AND to the park-level fields this page
                actually reads (see leanParkForAttractionShell): passing the full park serialized
                all ~95 sibling attractions plus 46 restaurants, 17 opening days, the weather block
                and the show list into the HTML of a single ride — 36.3 KB of which 1.9 KB was
                read. */}
                <LiveAttractionData
                  initialPark={shellPark}
                  attractionSlug={attractionSlug}
                  continent={continent}
                  country={country}
                  city={city}
                  parkSlug={parkSlug}
                />
              </PageSection>
            )}

            {/* Chapter: plan your visit — rope-drop and typical waits, both server-rendered in
              the shell for headliners so they paint together; side by side on wide screens,
              stacked when only one is present. The rope-drop recommendation is precomputed daily
              and exists only for tier1/tier2 headliners in parks with a schedule; today's closing
              caps its displayed times to the operating day, and the „no need to rush" note
              renders only when some ride in the park IS recommended, so it never sits on every
              headliner of an unrecommended park.

              Gated on having something to say. The 30-day calendar used to be the second half of
              this chapter and is its own now, which left a ride with neither card opening a
              chapter under a heading and closing it again. */}
            {hasPlanChapter && (
              <PageSection icon={Sparkles} title={t('sectionPlanVisit')} frosted id="plan">
                {/* `hasPlanChapter` above is this same predicate — the grid is the chapter's
                  whole body now that the calendar has its own. */}
                <div
                  className={cn(
                    'grid items-start gap-6',
                    attraction.ropeDrop && attraction.typicalWaits?.displayable && 'lg:grid-cols-2'
                  )}
                >
                  {attraction.ropeDrop && (
                    <RopeDropCard
                      ropeDrop={attraction.ropeDrop}
                      timezone={park.timezone}
                      todayClosingUtc={
                        park.schedule?.find(
                          (s) => s.date === todayIso && s.scheduleType === 'OPERATING'
                        )?.closingTime ?? null
                      }
                      parkHasRecommendations={(park.attractions ?? []).some(
                        (a) => a.ropeDrop && (a.ropeDrop.worth || isEveningBetter(a.ropeDrop))
                      )}
                    />
                  )}
                  {/* Typical (P50) vs busy (P90) peak waits — precomputed per headliner,
                    rendered in the static shell for SEO + instant paint. Non-headliner
                    displayable rides fall back to the client render below. */}
                  {attraction.typicalWaits?.displayable && (
                    <AttractionTypicalWaits typicalWaits={attraction.typicalWaits} />
                  )}
                </div>
              </PageSection>
            )}

            {/* Chapter: the ride's own 30-day calendar — its own chapter now, where it used to be
              the second half of „Beste Besuchszeit planen". The park has a calendar chapter with
              its own heading, its own legend and its own panel; the ride's was a bare `Card` with
              a hand-built badge legend, tucked under someone else's title. Client-loaded from the
              CDN-cached attraction detail route (shared by key with the chart above and the
              header card, so all three are one fetch); the heading and the legend need no data
              and are in the served HTML, only the grid's own box is held. */}
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

            {/* Chapter: what this ride is and what it does — the curated link into
              the glossary. Static (hand-seeded) data, so it renders straight into
              the shell; the component returns null when the ride has no profile.
              Its own <PageSection> carries the #ride-profile anchor (and the
              repo's scroll-mt offset) so the header teaser's jump lands right. */}
            {attraction.rideProfile && (
              <RideProfileSection profile={attraction.rideProfile} locale={locale as Locale} />
            )}

            {/* Chapter: FAQ (its own PageSection lives inside the component) */}
            <AttractionFAQSection attraction={attraction} park={park} />

            {/* Chapter: what we wrote about this ride — static content out of the generated
              blog manifest (no API call, no clock), so it neither competes with the live
              queries nor adds anything to the shell's TTFB. Renders nothing when no post
              mentions the ride. Not behind <Suspense> for the same reason as the park page's
              counterpart: the lookups are synchronous, so the boundary deferred nothing while
              its `fallback={null}` reserved nothing — the chapter dropped in at full height and
              pushed the share row and everything under it down. */}
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

            {/* Invite visitors to contribute their own photos of this ride */}
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

            {/* Secondary, lighter "make park.fan a preferred Google source" prompt */}
            <PreferredSourcePrompt compact className="mt-8" />
          </article>
        </PageContainer>
      </>
    </RouteMessages>
  );
}
