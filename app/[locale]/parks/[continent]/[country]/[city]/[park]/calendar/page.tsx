import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, permanentRedirect } from 'next/navigation';

import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { RouteMessages } from '@/i18n/route-messages';
import { getParkFaqGlossary } from '@/lib/faq/park-faq-terms';
import { catchNonFatal } from '@/lib/api/client';
import { getParkByGeoPath, getParkSeasons, leanParkForParkShell } from '@/lib/api/parks';
import { getBestDaysCalendarSeed } from '@/lib/api/integrated-calendar';
import type { BestDaysSnapshot } from '@/lib/api/integrated-calendar';
import {
  findParkPageRedirect,
  findRelocatedParkRedirect,
  findRenamedParkRedirect,
} from '@/lib/utils/redirect-utils';
import { parkCalendarPath } from '@/lib/parks/calendar-segments';
import { translateContinent, translateCountry } from '@/lib/i18n/helpers';
import { generateParkBreadcrumbs } from '@/lib/utils/breadcrumb-utils';
import { stripNewPrefix } from '@/lib/utils';
import {
  buildOpenGraphMetadata,
  fitWithin,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';

import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import { ParkBestDaysSection } from '@/components/parks/park-best-days-section';
import { ParkBestDaysSectionSkeleton } from '@/components/parks/park-best-days-section-skeleton';
import { ParkCalendarPanel } from '@/components/parks/park-calendar-panel';
import { ParkPageShell } from '@/components/parks/park-page-shell';
import { ParkTitleHeader } from '@/components/parks/park-title-header';
import { ParkHeaderCard } from '@/components/parks/park-header-card';
import { ParkNavTiles } from '@/components/parks/park-nav-tiles';
import { ParkTodayPanel } from '@/components/parks/park-today-panel';

interface ParkCalendarPageProps {
  params: Promise<{
    locale: string;
    continent: string;
    country: string;
    city: string;
    park: string;
  }>;
}

// Same posture as the park page: rendered per request, no per-URL ISR shell across 212 parks × 6
// locales. The best-days seed streams inside its own boundary so a cold `/best-days` compute never
// gates first byte; the month grid is client-fetched per visible month.
export const dynamic = 'force-dynamic';

/**
 * A park's crowd calendar, on its own URL.
 *
 * It was `#calendar` on the park page: a tab whose panel mounted on click, whose selection was
 * written with `history.replaceState`, and whose month stepper appended `#calendar-2026-04`. That
 * arrangement had one address for six different things. Nothing in it could be crawled, so the
 * whole "wann ist es leer" answer — the part of this site with the least competition in search —
 * existed for Google as a fragment of the wait-times page. It could not carry its own title or
 * description, could not be a search result, could not be shared as a link that opens on the
 * calendar, and `replaceState` meant the back button did not undo opening it.
 *
 * So the tab is a page. What moved with it is the best-days section, which is the answer the
 * calendar is the evidence for and which used to open that tab; what stayed on the park page is
 * the entry tile, whose hint already names the next quiet day and now links here.
 *
 * The month hash keeps its `#calendar-YYYY-MM` spelling rather than shortening to `#2026-04`, so
 * every link ever written against the old tab still lands on the right month after the redirect
 * the park page issues.
 */
export async function generateMetadata({ params }: ParkCalendarPageProps): Promise<Metadata> {
  const { continent, country, city, park: parkSlug, locale } = await params;
  if (!isServableRoute(locale, continent, country, city, parkSlug)) return {};

  const t = await getTranslations({ locale, namespace: 'parks.calendarPage' });
  const tNotFound = await getTranslations({ locale, namespace: 'seo.notFound' });

  const park = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));
  if (!park) return { title: tNotFound('park') };

  const parkName = stripNewPrefix(park.name);
  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');

  // `fitWithin` takes the limit first and then candidates longest-preferred: the short title is
  // the fallback for a park name that pushes the full one past 60 characters.
  const title = fitWithin(
    MAX_TITLE_LENGTH,
    t('metaTitle', { park: parkName }),
    t('metaTitleShort', { park: parkName })
  );
  const description = fitWithin(
    MAX_DESCRIPTION_LENGTH,
    t('metaDescription', { park: parkName, city: cityName })
  );
  const canonical = `${SITE_URL}/${locale}${parkCalendarPath(locale, continent, country, city, parkSlug)}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      // Each locale gets its OWN segment (`/de/…/kalender`, `/fr/…/calendrier`), not the canonical
      // English folder — the localized URL is what the rewrite serves and what a reader sees.
      languages: generateAlternateLanguages(
        (l) => `/${l}${parkCalendarPath(l, continent, country, city, parkSlug)}`
      ),
    },
    ...buildOpenGraphMetadata({
      title,
      description,
      url: canonical,
      locale,
      ogImageUrl: getOgImageUrl([locale, continent, country, city, parkSlug]),
    }),
  };
}

export default async function ParkCalendarPage({ params }: ParkCalendarPageProps) {
  const { locale, continent, country, city, park: parkSlug } = await params;
  assertServableRoute(locale, continent, country, city, parkSlug);
  setRequestLocale(locale);

  const t = await getTranslations('parks.calendarPage');
  const tGeo = await getTranslations('geo');

  // The same three redirects the park page runs, for the same reason: this URL is reachable
  // directly from search and a stale geo path must transfer rather than 404.
  const malformed = await findParkPageRedirect(continent, country, city, parkSlug);
  if (malformed) {
    permanentRedirect(`/${locale}${malformed}`);
  }

  // Fired, not awaited: consumed inside the <Suspense> boundary below, so a cold best-days
  // compute streams in behind the shell instead of gating TTFB. One clock read serves the seed.
  const seedNow = new Date();
  const seedNowMs = seedNow.getTime();
  const bestDaysSeedPromise = getBestDaysCalendarSeed(continent, country, city, parkSlug);
  const seasonsPromise = getParkSeasons(continent, country, city, parkSlug);

  const parkFull = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));
  const park = parkFull ? leanParkForParkShell(parkFull) : parkFull;
  const seasons = await seasonsPromise;
  if (!park) {
    const relocated = await findRelocatedParkRedirect(continent, country, city, parkSlug);
    if (relocated) {
      permanentRedirect(`/${locale}${relocated}${parkCalendarSuffix(locale)}`);
    }
    notFound();
  }

  const renamed = findRenamedParkRedirect(park, { continent, country, city, parkSlug });
  if (renamed) {
    permanentRedirect(`/${locale}${renamed}${parkCalendarSuffix(locale)}`);
  }

  const parkName = stripNewPrefix(park.name);
  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  const countryName = translateCountry(tGeo, country, locale, park.country ?? undefined);
  const parkPath = `/parks/${continent}/${country}/${city}/${parkSlug}`;

  const tCommon = await getTranslations('common');
  const tNav = await getTranslations('navigation');
  const { breadcrumbs: parkBreadcrumbs, currentPage: parkCurrentPage } = generateParkBreadcrumbs({
    continent,
    country,
    city,
    continentName: translateContinent(tGeo, continent, locale),
    countryName,
    cityName,
    parkName,
    homeLabel: tCommon('home'),
    continentsLabel: tNav('continents'),
  });
  // The park page's own trail plus the park itself as a link, so the way back is a real link and
  // not just the browser's back button; this page is the leaf.
  const breadcrumbs = [...parkBreadcrumbs, { name: parkCurrentPage, url: parkPath }];

  const { terms: faqGlossaryTerms, segment: glossarySegment } = await getParkFaqGlossary(
    park,
    locale,
    seedNowMs
  );

  return (
    <RouteMessages route="/parks/[continent]/[country]/[city]/[park]/calendar">
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
        currentPage={t('breadcrumb')}
        seedNowMs={seedNowMs}
        faqGlossaryTerms={faqGlossaryTerms}
        glossarySegment={glossarySegment}
        head={<BreadcrumbStructuredData breadcrumbs={breadcrumbs} locale={locale} />}
        header={
          <ParkTitleHeader
            park={park}
            parkName={parkName}
            cityName={cityName}
            country={country}
            countryName={countryName}
            suffix={t('h1Suffix')}
            intro={t('intro', { park: parkName })}
          />
        }
      >
        {/* The same header card the park page opens with, built with LINK cells instead of tab
          triggers — there is no `<Tabs>` on this page to switch, and a trigger without a panel is
          a button that does nothing. The panel above them is the identical component reading the
          identical query keys, so the card shows the same readings it does one URL over. */}
        <ParkHeaderCard
          panel={
            <ParkTodayPanel
              initialData={park}
              continent={continent}
              country={country}
              city={city}
              parkSlug={parkSlug}
              parkPath={parkPath}
            />
          }
          tiles={
            <ParkNavTiles
              current="calendar"
              park={park}
              continent={continent}
              country={country}
              city={city}
              parkSlug={parkSlug}
              showsAvailable={(park.shows?.length ?? 0) > 0}
              restaurantsAvailable={(park.restaurants?.length ?? 0) > 0}
              weatherAvailable={!!park.weather?.current}
            />
          }
        />

        {/* The answer, streamed. Same seeding as the park page's tile hint, and the same
          placeholder — which renders the REAL header, so the grid below it does not jump when the
          seed lands. No calendar link in the header here: it would point at this page. */}
        <Suspense
          fallback={
            <ParkBestDaysSectionSkeleton parkName={parkName} parkSlug={parkSlug} locale={locale} />
          }
        >
          <SeededBestDays
            seedPromise={bestDaysSeedPromise}
            continent={continent}
            country={country}
            city={city}
            parkSlug={parkSlug}
            timezone={park.timezone}
            hasOperatingSchedule={park.hasOperatingSchedule}
            parkName={parkName}
            locale={locale}
            seedNowMs={seedNowMs}
          />
        </Suspense>

        {/* The evidence. Client-fetched per visible month — the grid is the one thing on this page
          that genuinely needs a click before it knows what to load. */}
        <ParkCalendarPanel
          park={park}
          continent={continent}
          country={country}
          city={city}
          parkSlug={parkSlug}
          className="mt-8"
        />
      </ParkPageShell>
    </RouteMessages>
  );
}

/** The localized `/kalender` suffix, for the redirects that rebuild this URL under a new geo path. */
function parkCalendarSuffix(locale: string): string {
  const path = parkCalendarPath(locale, 'c', 'c', 'c', 'p');
  return path.slice(path.lastIndexOf('/'));
}

/**
 * Streamed best-days slot — the await happens here rather than in the page body, so the shell
 * flushes at park-fetch speed and this content arrives in the same response. A `null` seed
 * (timeout or error) falls through to the section's own skeleton plus its client fetch.
 */
async function SeededBestDays({
  seedPromise,
  continent,
  country,
  city,
  parkSlug,
  timezone,
  hasOperatingSchedule,
  parkName,
  locale,
  seedNowMs,
}: {
  seedPromise: Promise<BestDaysSnapshot | null>;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  timezone: string;
  hasOperatingSchedule: boolean;
  parkName: string;
  locale: string;
  seedNowMs: number;
}) {
  const seed = await seedPromise;
  return (
    <ParkBestDaysSection
      continent={continent}
      country={country}
      city={city}
      parkSlug={parkSlug}
      timezone={timezone}
      hasOperatingSchedule={hasOperatingSchedule}
      parkName={parkName}
      locale={locale}
      initialCalendar={seed}
      seedNowMs={seedNowMs}
    />
  );
}
