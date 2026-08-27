import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import {
  buildOpenGraphMetadata,
  fitWithin,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from '@/lib/utils/metadata';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound, permanentRedirect } from 'next/navigation';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { getParkByGeoPath, getParkSeasons, leanParkForParkShell } from '@/lib/api/parks';
import { getBestDaysCalendarSeed } from '@/lib/api/integrated-calendar';
import { catchNonFatal } from '@/lib/api/client';
import {
  ParkStructuredData,
  BreadcrumbStructuredData,
  ShowsStructuredData,
} from '@/components/seo/structured-data';
import { FAQStructuredData } from '@/components/seo/faq-structured-data';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import {
  findParkPageRedirect,
  findRelocatedParkRedirect,
  findRenamedParkRedirect,
} from '@/lib/utils/redirect-utils';
import { stripNewPrefix } from '@/lib/utils';
import { LiveParkData } from '@/components/parks/live-park-data';
import { ParkPageShell } from '@/components/parks/park-page-shell';
import { ParkTitleHeader } from '@/components/parks/park-title-header';
import { ParkTodayPanel } from '@/components/parks/park-today-panel';
import { ParkPurchasesCard } from '@/components/parks/park-purchases-card';
import { NoLiveWaitTimesNotice } from '@/components/parks/no-live-wait-times-notice';
import { noLiveWaitTimesReason } from '@/lib/utils/live-wait-times';
import { groupAttractionsByLand } from '@/lib/utils/park-utils';
import { generateParkBreadcrumbs } from '@/lib/utils/breadcrumb-utils';
import { RouteMessages } from '@/i18n/route-messages';
import { getParkFaqGlossary } from '@/lib/faq/park-faq-terms';
import { applyParkSimulation, parseParkSimulation } from '@/lib/parks/park-simulation';
import { ParkSimulationNotice } from '@/components/parks/park-simulation-notice';

interface ParkPageProps {
  params: Promise<{
    locale: string;
    continent: string;
    country: string;
    city: string;
    park: string;
  }>;
  /** Only `?state=` is read, and only off production — the dev/preview park-state simulation
   *  (`lib/parks/park-simulation.ts`). `generateMetadata` deliberately does not take it: a
   *  simulated page must never produce different metadata from the real one. */
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// FULLY DYNAMIC (force-dynamic) — rendered per request, so NO per-URL ISR shell write across the
// catalog × 6 locales. Cache Components is off; the structure (header, attraction wait-time
// overview incl. every attraction name/link, FAQ, JSON-LD) AND — when its cache is warm — the
// best-days section render server-side into the first HTML from the data-cached snapshots
// (getParkByGeoPath / getBestDaysCalendarSeed; the seed is timeout-guarded so a cold calendar
// fill can never block TTFB). Live status/wait times, weather nowcast and historical stats are
// client-loaded (React Query) and stream in afterwards.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ParkPageProps): Promise<Metadata> {
  const { continent, country, city, park: parkSlug, locale } = await params;
  if (!isServableRoute(locale, continent, country, city, parkSlug)) return {};
  const t = await getTranslations({ locale, namespace: 'seo.parks' });
  const tGlobal = await getTranslations({ locale, namespace: 'seo.global' });
  const tGeo = await getTranslations({ locale, namespace: 'geo' });
  const tNotFound = await getTranslations({ locale, namespace: 'seo.notFound' });
  const tImageAlt = await getTranslations({ locale, namespace: 'seo.imageAlt' });

  // If this is a malformed URL (e.g. .../efteling/villa-volta), avoid calling the API
  const redirectUrl = await findParkPageRedirect(continent, country, city, parkSlug);
  if (redirectUrl) {
    return {
      title: tNotFound('park'),
      alternates: { canonical: `${SITE_URL}/${locale}${redirectUrl}` },
    };
  }

  const park = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));

  if (!park) {
    // Stale geo segments (re-slugged/relocated city)? Point canonical at the
    // park's current path — the page body issues the actual 308.
    const relocatedUrl = await findRelocatedParkRedirect(continent, country, city, parkSlug);
    if (relocatedUrl) {
      return {
        title: tNotFound('park'),
        alternates: { canonical: `${SITE_URL}/${locale}${relocatedUrl}` },
      };
    }
    return { title: tNotFound('park') };
  }

  // The API 301s a renamed park's old path and `fetch` follows it, so we can be holding a park
  // whose canonical path differs from the one requested. Point the canonical at the real path —
  // the page body issues the matching 308.
  const renamedUrl = findRenamedParkRedirect(park, { continent, country, city, parkSlug });
  if (renamedUrl) {
    return {
      title: tNotFound('park'),
      alternates: { canonical: `${SITE_URL}/${locale}${renamedUrl}` },
    };
  }

  const ogImageUrl = getOgImageUrl([locale, continent, country, city, parkSlug]);
  const parkName = stripNewPrefix(park.name);

  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  const countryName = translateCountry(tGeo, country, locale, park.country ?? undefined);

  const parkNameLower = parkName.toLowerCase();
  const cityNameLower = cityName.toLowerCase();
  const cityInParkName =
    parkNameLower.includes(cityNameLower) ||
    cityNameLower
      .split(/\s+/)
      .some((word) => word.length > 3 && parkNameLower.split(/\s+/).includes(word));
  const titleKey = cityInParkName ? 'titleTemplateNoCity' : 'titleTemplate';
  // Long park names ("Fantawild Oriental Heritage Mianyang") push the templated title past the
  // ~60 chars Google shows, clipping the very keyword the template exists for. Fall back to the
  // bare "<park> Wait Times LIVE" form, and to the city-less copy for the snippet.
  const title = fitWithin(
    MAX_TITLE_LENGTH,
    cityInParkName
      ? t(titleKey, { park: parkName })
      : t(titleKey, { park: parkName, city: cityName }),
    t('titleTemplateShort', { park: parkName })
  );

  const descriptionKey = cityInParkName
    ? 'metaDescriptionTemplateNoCity'
    : 'metaDescriptionTemplate';
  const description = fitWithin(
    MAX_DESCRIPTION_LENGTH,
    cityInParkName
      ? t(descriptionKey, { park: parkName })
      : t(descriptionKey, { park: parkName, city: cityName }),
    t('metaDescriptionTemplateNoCity', { park: parkName })
  );

  const keywords = [
    parkName,
    `${parkName} ${cityName}`,
    `${parkName} ${countryName}`,
    `${parkName} ${t('keywordWaitTimes')}`,
    `${parkName} ${t('keywordCrowdCalendar')}`,
    `${parkName} ${t('keywordBestTime')}`,
    cityName,
    countryName,
    tGlobal('keywords'),
  ].join(', ');

  return {
    title,
    description,
    keywords,
    ...buildOpenGraphMetadata({
      locale,
      title,
      description,
      url: `${SITE_URL}/${locale}/parks/${continent}/${country}/${city}/${parkSlug}`,
      ogImageUrl,
      imageAlt: tImageAlt('park', { park: parkName }),
    }),
    alternates: {
      canonical: `${SITE_URL}/${locale}/parks/${continent}/${country}/${city}/${parkSlug}`,
      languages: {
        ...generateAlternateLanguages(
          (l) => `/${l}/parks/${continent}/${country}/${city}/${parkSlug}`
        ),
        'x-default': `${SITE_URL}/en/parks/${continent}/${country}/${city}/${parkSlug}`,
      },
    },
  };
}

// force-dynamic (see the `export const dynamic` above): the structure (header, attraction
// wait-time overview, FAQ, JSON-LD) renders server-side into the first HTML — content-first —
// from the data-cached park snapshot (getParkByGeoPath); the best-days section additionally
// seeds from the data-cached calendar (timeout-guarded, see below). The LIVE values and the
// historical stats stay CLIENT-loaded (React Query → CDN-cached /api routes) and trickle in
// behind the SSR content, so their cold/slow fetches never block this page's TTFB.
export default async function ParkPage({ params, searchParams }: ParkPageProps) {
  const { locale, continent, country, city, park: parkSlug } = await params;
  const simScenarios = parseParkSimulation((await searchParams)?.state as string | undefined);
  assertServableRoute(locale, continent, country, city, parkSlug);
  setRequestLocale(locale);

  const t = await getTranslations('parks');
  const tCommon = await getTranslations('common');
  const tGeo = await getTranslations('geo');
  const tSeo = await getTranslations('seo.parks');

  // Check for malformed URLs first (e.g. /parks/europe/netherlands/efteling/villa-volta
  // where "efteling" is the park and "villa-volta" is an attraction). Redirect before
  // calling the API to avoid 404s on the backend.
  const redirectUrl = await findParkPageRedirect(continent, country, city, parkSlug);
  if (redirectUrl) {
    permanentRedirect(`/${locale}${redirectUrl}`);
  }

  // Best-days SEED: fired here but DELIBERATELY NOT awaited on the render's critical path — it is
  // consumed only inside <Suspense> boundaries below (the best-days section + the FAQ JSON-LD), so
  // it STREAMS in and never gates TTFB. This is the fix for the cold-start latency regression: a
  // cold `/best-days` fetch can be ~0.4–1s (occasionally slower than the park fetch), and awaiting
  // it inline added that to first-byte. Now the shell (H1, attraction overview, header, FAQ base)
  // flushes at park-fetch speed and the seeded best-days HTML arrives a beat later in the same
  // stream — crawlers still receive it in the final document. The client queries (React Query,
  // `useLoadLast`-gated) still replace the seed on the client as before. `getBestDaysCalendarSeed`
  // keeps a timeout + `after()` so a hung backend can't hold the stream open and the fill still
  // warms the data cache. ONE per-request clock read serves every seed-rendered "today" derivation.
  const seedNow = new Date();
  const seedNowMs = seedNow.getTime();
  const bestDaysSeedPromise = getBestDaysCalendarSeed(continent, country, city, parkSlug);

  // Started here, awaited at the bottom of the fetch block: it is a small,
  // day-cached list and the page has no reason to serialise it behind the park.
  const seasonsPromise = getParkSeasons(continent, country, city, parkSlug);

  // Fetch park data and holidays (holidays are optional). `leanParkForParkShell` strips the two
  // per-attraction fields only the ride page renders (typicalWaits, rideProfile) — ~11 KB of this
  // park's 33 KB attraction list that nothing here reads. The live poll returns them regardless.
  const parkFull = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));
  const parkLean = parkFull ? leanParkForParkShell(parkFull) : parkFull;
  // Dev/preview only, and a no-op with no `?state=` — see `lib/parks/park-simulation.ts` for why
  // this one fabricates data where `?sim=` refuses to.
  const park = parkLean ? applyParkSimulation(parkLean, simScenarios) : parkLean;
  const seasons = await seasonsPromise;

  if (!park) {
    // The park slug is stable across API geo re-slugs (bruhl → bruehl etc.).
    // If it exists under different geo segments, 308 to the canonical path so
    // Google transfers the old URL's signals instead of dropping a 404.
    const relocatedUrl = await findRelocatedParkRedirect(continent, country, city, parkSlug);
    if (relocatedUrl) {
      permanentRedirect(`/${locale}${relocatedUrl}`);
    }
    notFound();
  }

  // The park exists but under a different path than requested: an upstream rename regenerated
  // its slug and the API answered our request for the OLD path with a 301 that `fetch` followed
  // silently. Without this the park would render at two URLs with the stale one canonical, and
  // the redirect's ranking transfer would never reach the browser or Googlebot.
  const renamedUrl = findRenamedParkRedirect(park, { continent, country, city, parkSlug });
  if (renamedUrl) {
    permanentRedirect(`/${locale}${renamedUrl}`);
  }

  // NOTE: bestDaysSeedPromise is intentionally NOT awaited here — see the comment where it's
  // created. It is passed to the <Suspense>-wrapped FAQ JSON-LD + best-days slot below so it
  // streams instead of blocking TTFB.

  // Historical stats are still loaded CLIENT-side only (React Query → the CDN-cached `/stats`
  // route, `useLoadLast`-gated): the 2-year aggregate is the other slow cold-compute response,
  // and the best-days section renders its calendar-based fallback until it lands.

  // Glossary terms for the (client) FAQ section. This is a small static-content lookup (no fetch,
  // no clock) so it's safe to load in the static shell; the client FAQ tree highlights terms from
  // these props instead of awaiting them itself.
  //
  // Narrowed to the terms the FAQ text can actually link before it crosses the client boundary —
  // <ParkFAQSection> is a Client Component, so anything handed to it is serialized into the page.
  // The full dictionary was 61.2 KB (18.0 KB brotli, a quarter of this page's transfer) so that a
  // few paragraphs could link a handful of terms. Same reasoning as leanParkForShell in
  // lib/api/parks.ts: pass what is read, not what is available.
  const { terms: faqGlossaryTerms, segment: glossarySegment } = await getParkFaqGlossary(
    park,
    locale,
    seedNowMs
  );

  // Nowcast (rain/storm warnings) is intentionally NOT fetched in the static shell. Its `'use cache'`
  // fill can time out during prerender (the nowcast endpoint is the slowest park dependency), which
  // FAILS the park page's static prerender and makes Next fall back to dynamic rendering for the whole
  // route — served `no-store`, so the CDN never caches it and every request hits the function (the
  // root cause of the park-route ISR write churn). Both consumers (WeatherNowcastBanner, WeatherCard)
  // already fetch the nowcast client-side via useWeatherNowcast, so no SSR seed is needed.

  // Historical stats (2-year aggregate) feed only the below-the-fold stats + best-days sections and
  // are likewise loaded CLIENT-side (useParkHistoricalStats → the `/api/parks/.../stats` CDN-cached
  // route), so the slow cold-compute response never blocks or poisons the static shell.

  // Group attractions by land
  const otherAttractionsLabel = t('otherAttractions');
  const attractionsByLand = groupAttractionsByLand(park.attractions || [], otherAttractionsLabel);
  const landNames = Object.keys(attractionsByLand).sort((a, b) => {
    // Put "Other Attractions" at the end
    if (a === otherAttractionsLabel) return 1;
    if (b === otherAttractionsLabel) return -1;
    return a.localeCompare(b);
  });

  // Format names for breadcrumb - use actual names from park data (proper umlauts)
  const continentName = translateContinent(tGeo, continent, locale);
  const countryName = translateCountry(tGeo, country, locale, park.country ?? undefined);
  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');

  // Today's schedule is picked CLIENT-side inside <ParkTodayPanel> (from the browser clock in the
  // park's timezone) — the full day-stable park.schedule is handed down instead of a server-derived
  // "today" entry, so the shell never reads the server clock.
  const parkName = stripNewPrefix(park.name);

  // Construct breadcrumbs using utility
  const tNav = await getTranslations('navigation');
  const { breadcrumbs, currentPage: parkCurrentPage } = generateParkBreadcrumbs({
    continent,
    country,
    city,
    continentName,
    countryName,
    cityName,
    parkName,
    homeLabel: tCommon('home'),
    continentsLabel: tNav('continents'),
  });

  // OG card is only a fallback for the JSON-LD image when the park has no real photo.
  const ogImageUrl = getOgImageUrl([locale, continent, country, city, parkSlug]);

  return (
    <RouteMessages route="/parks/[continent]/[country]/[city]/[park]">
      <ParkPageShell
        park={park}
        seasons={seasons}
        locale={locale}
        continent={continent}
        country={country}
        city={city}
        parkSlug={parkSlug}
        cityName={cityName}
        countryName={countryName}
        breadcrumbs={breadcrumbs}
        currentPage={parkCurrentPage}
        pagePath={`/parks/${continent}/${country}/${city}/${parkSlug}`}
        seedNowMs={seedNowMs}
        faqGlossaryTerms={faqGlossaryTerms}
        glossarySegment={glossarySegment}
        head={
          <>
            <ParkStructuredData
              park={park}
              url={`${SITE_URL}/${locale}/parks/${continent}/${country}/${city}/${parkSlug}`}
              description={tSeo('metaDescriptionTemplate', { park: parkName, city: cityName })}
              locale={locale}
              ogImageUrl={ogImageUrl}
            />
            <BreadcrumbStructuredData
              breadcrumbs={breadcrumbs}
              currentPage={{
                name: parkCurrentPage,
                url: `/parks/${continent}/${country}/${city}/${parkSlug}`,
              }}
              locale={locale}
            />
            {park.shows && park.shows.length > 0 && (
              <ShowsStructuredData shows={park.shows} park={park} />
            )}
            {/* FAQ JSON-LD streams: the base FAQPage questions don't need the seed, and the
              least-crowded question is appended when the seed resolves — awaiting it here would
              block TTFB, so it's rendered inside its own Suspense boundary. It lives on THIS page
              and on no other page of the park: the visible FAQ is shared furniture, the structured
              data may not be. */}
            <Suspense fallback={null}>
              <FAQStructuredData
                park={park}
                locale={locale}
                nowMs={seedNowMs}
                seedPromise={bestDaysSeedPromise}
              />
            </Suspense>

            {/* Dev/preview only — says out loud that the weather, holidays and crowd on this page
              were fabricated by `?state=`. Never renders on production. */}
            <ParkSimulationNotice scenarios={simScenarios} />
          </>
        }
        header={
          <ParkTitleHeader
            park={park}
            parkName={parkName}
            cityName={cityName}
            country={country}
            countryName={countryName}
            suffix={t('h1Suffix')}
            // Keyword-rich, server-rendered intro — gives Google crawlable topical text with the
            // exact "Wartezeiten im {park}" phrase + "heute" that the live (client-streamed) grid
            // does not provide as static text.
            intro={t('intro', { park: parkName, city: cityName })}
          />
        }
      >
        {/* Paid skip-the-line day prices (schedule purchases) — renders nothing for parks
          without purchase data (currently everything non-Disney). */}
        <ParkPurchasesCard schedule={park.schedule} timezone={park.timezone} className="mb-8" />

        {/* Parks that publish wait times only inside their own app (Hansa-Park). Server-rendered,
          not streamed: `liveWaitTimes` is day-stable, so it arrives with the structure fetch and
          the live merge carries it — and it has to be in the first paint, because it explains the
          empty ride list the visitor is already looking at. Renders nothing for the other 212
          parks. */}
        <NoLiveWaitTimesNotice reason={noLiveWaitTimesReason(park)} scope="park" className="mb-8" />

        {/* The header card ("Heute im Park" + the entry tiles) and the tab body under it, all with
          auto-refresh. The card is inside this tree rather than in the shell because it and the
          tab panels are one `<Tabs>`; the calendar page builds the same card with link cells.

          "Heute im Park" is the one panel the fold is built around. It absorbed four things that
          used to be four boxes: the official DWD/MeteoAlarm warning (its top strip), the stats
          board (its first two columns), the holiday context (its last row) and the weather summary
          (the nowcast strip above that row). It also carries the two readings that were not above
          the fold at all — what the headliners cost right now and when the next shows start.

          Not behind <Suspense>: everything it draws is either in `park` already or arrives on the
          client queries it starts itself, so a boundary would defer nothing and its
          `fallback={null}` would reserve nothing — the exact shape that cost this page 0.095 CLS
          when the weather card had one. */}
        <LiveParkData
          initialData={park}
          continent={continent}
          country={country}
          city={city}
          parkSlug={parkSlug}
          landNames={landNames}
          attractionsByLand={attractionsByLand}
          otherAttractionsLabel={otherAttractionsLabel}
          todayPanel={
            <ParkTodayPanel
              initialData={park}
              continent={continent}
              country={country}
              city={city}
              parkSlug={parkSlug}
              parkPath={`/parks/${continent}/${country}/${city}/${parkSlug}`}
            />
          }
        />
      </ParkPageShell>
    </RouteMessages>
  );
}
