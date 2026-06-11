import { getTranslations, setRequestLocale } from 'next-intl/server';
import { formatInTimeZone } from 'date-fns-tz';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SeasonalBadge } from '@/components/parks/seasonal-badge';
import { Separator } from '@/components/ui/separator';
import { getParkByGeoPath } from '@/lib/api/parks';
import { catchNonFatal } from '@/lib/api/client';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import type { Metadata } from 'next';
import { ParkBackground } from '@/components/parks/park-background';
import { FavoriteStar } from '@/components/common/favorite-star';
import { ShareButtons } from '@/components/common/share-buttons';
import { getAttractionBackgroundImage, getParkBackgroundImage } from '@/lib/utils/park-assets';
import {
  AttractionStructuredData,
  BreadcrumbStructuredData,
} from '@/components/seo/structured-data';
import { AttractionFAQStructuredData } from '@/components/seo/attraction-faq-structured-data';
import { AttractionFAQSection } from '@/components/faq/attraction-faq-section';
import { PageContainer } from '@/components/common/page-container';
import { GlassCard } from '@/components/common/glass-card';
import { AttractionHistorySections } from '@/components/parks/attraction-history-sections';
import { LiveAttractionData } from '@/components/parks/live-attraction-data';
import { RopeDropCard } from '@/components/parks/rope-drop-card';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { generateAttractionBreadcrumbs } from '@/lib/utils/breadcrumb-utils';
import { stripNewPrefix } from '@/lib/utils';

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

  const park = await getParkByGeoPath(continent, country, city, parkSlug).catch(() => null);
  const attraction = park?.attractions?.find((a) => a.slug === attractionSlug);

  if (!attraction) {
    const tNotFound = await getTranslations({ locale, namespace: 'seo.notFound' });
    return { title: tNotFound('attraction') };
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
    `${attractionName} wait times`,
    parkName,
    `${parkName} ${cityName}`,
    cityName,
    tGlobal('keywords'),
  ]
    .filter(Boolean)
    .join(', ');

  return {
    title: t('titleTemplate', {
      attraction: attractionName,
      park: parkName,
      city: cityName,
    }),
    description: t('metaDescriptionTemplate', {
      attraction: attractionName,
      park: parkName,
      city: cityName,
    }),
    keywords,
    ...(isDeduplicatedVariant && { robots: { index: false, follow: true } }),
    ...buildOpenGraphMetadata({
      locale,
      title: t('titleTemplate', {
        attraction: attractionName,
        park: parkName,
        city: cityName,
      }),
      description: t('metaDescriptionTemplate', {
        attraction: attractionName,
        park: parkName,
        city: cityName,
      }),
      url: `${SITE_URL}/${locale}/parks/${continent}/${country}/${city}/${parkSlug}/${canonicalAttractionSlug}`,
      ogImageUrl,
      imageAlt: tImageAlt('attraction', {
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

  const backgroundImage =
    getAttractionBackgroundImage(parkSlug, attractionSlug) ?? getParkBackgroundImage(parkSlug);

  return (
    <>
      <AttractionStructuredData
        attraction={attraction}
        park={park}
        url={attractionUrl}
        locale={locale}
        description={tSeo('metaDescriptionTemplate', {
          attraction: attractionName,
          park: parkName,
          city: cityName,
        })}
      />
      <AttractionFAQStructuredData attraction={attraction} park={park} locale={locale} />
      <BreadcrumbStructuredData breadcrumbs={breadcrumbs} locale={locale} />
      <ParkBackground imageSrc={backgroundImage} alt={attractionName} />
      <PageContainer>
        <BreadcrumbNav
          breadcrumbs={breadcrumbs}
          currentPage={attractionCurrentPage}
          pinLastBreadcrumb
        />

        <article itemScope itemType="https://schema.org/TouristAttraction">
          {/* Header */}
          <div className="mb-8">
            <GlassCard variant="medium" className="relative">
              {attraction.id && (
                <div className="absolute top-4 right-4 z-20 flex items-center justify-center">
                  <FavoriteStar type="attraction" id={attraction.id} size="lg" />
                </div>
              )}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex flex-wrap items-baseline">
                    <h1 className="text-3xl font-bold md:text-4xl">{attractionName}</h1>
                    <span className="text-muted-foreground ml-2 text-xl font-normal md:text-2xl">
                      – {t('h1Suffix')}
                    </span>
                  </div>
                  <div className="text-foreground flex flex-wrap items-center gap-3">
                    <Link
                      href={
                        `/parks/${continent}/${country}/${city}/${parkSlug}` as '/parks/europe/germany/rust/europa-park'
                      }
                      prefetch={false}
                      className="hover:text-foreground flex items-center gap-1"
                    >
                      <MapPin className="h-4 w-4" />
                      {parkName}
                    </Link>
                    {attraction.land && <Badge variant="outline">{attraction.land}</Badge>}
                    {attraction.isSeasonal && (
                      <SeasonalBadge
                        seasonMonths={attraction.seasonMonths}
                        isCurrentlyInSeason={attraction.isCurrentlyInSeason}
                      />
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Live: status, wait time, queues — auto-refreshes every 5 min.
              initialPark is trimmed to THIS attraction (LiveAttractionData finds it by slug and
              uses only park-level fields) — passing the full park serialized all ~95 sibling
              attractions into every per-attraction ISR shell, the bulk of its write size. The live
              poll (getParkByGeoPathFresh) still returns the full park client-side. */}
          <LiveAttractionData
            initialPark={{ ...park, attractions: [attraction] }}
            attractionSlug={attractionSlug}
            continent={continent}
            country={country}
            city={city}
            parkSlug={parkSlug}
          />

          {/* Rope-drop recommendation — precomputed daily on the server, present
              only for tier1/tier2 headliners in parks with a schedule. Today's
              closing caps displayed times to the operating day. */}
          {attraction.ropeDrop && (
            <RopeDropCard
              ropeDrop={attraction.ropeDrop}
              timezone={park.timezone}
              todayClosingUtc={
                park.schedule?.find(
                  (s) =>
                    s.date === formatInTimeZone(new Date(), park.timezone, 'yyyy-MM-dd') &&
                    s.scheduleType === 'OPERATING'
                )?.closingTime ?? null
              }
              className="mb-8"
            />
          )}

          <Separator className="my-8" />

          {/* Daily wait-time chart + 30-day history grid — client-loaded from the CDN-cached
              attraction detail route so the heavy history/forecast time-series stays out of the
              ISR shell (a skeleton holds the layout until it lands). */}
          <AttractionHistorySections
            continent={continent}
            country={country}
            city={city}
            parkSlug={parkSlug}
            attractionSlug={attractionSlug}
            attractionName={attractionName}
            timezone={park.timezone}
            bestVisitTimes={attraction.bestVisitTimes}
          />

          <Separator className="my-8" />
          <AttractionFAQSection attraction={attraction} park={park} />

          <Separator className="my-8" />
          <ShareButtons url={attractionUrl} title={attractionName} />
        </article>
      </PageContainer>
    </>
  );
}
