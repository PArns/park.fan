import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, permanentRedirect } from 'next/navigation';

import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { RouteMessages } from '@/i18n/route-messages';
import { PlannerPageParkBeacon } from '@/components/planner/planner-page-park-beacon';
import { getCardObjectPosition, getParkBackgroundImage } from '@/lib/utils/park-assets';
import { catchNonFatal } from '@/lib/api/client';
import { getParkByGeoPath, getParkSeasons, leanParkForCalendarShell } from '@/lib/api/parks';
import { getBestDaysCalendarSeed, getCalendarMonthSeed } from '@/lib/api/integrated-calendar';
import { hasParkStatsPage } from '@/lib/api/stats';
import type { BestDaysSnapshot } from '@/lib/api/integrated-calendar';
import { summarizeCalendarMonth } from '@/lib/parks/calendar-month-summary';
import type { IntegratedCalendarResponse, ParkWithAttractions } from '@/lib/api/types';
import {
  cityHasOwnPage,
  findParkPageRedirect,
  findRelocatedParkRedirect,
  findRenamedParkRedirect,
} from '@/lib/utils/redirect-utils';
import {
  currentParkCalendarMonth,
  isParkCalendarMonthInRange,
  parkCalendarPath,
  parseParkCalendarMonth,
  parseParkCalendarMonthSpelling,
  shiftParkCalendarMonth,
  type ParkCalendarMonth,
} from '@/lib/parks/calendar-segments';
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
import { getServerToday } from '@/lib/utils/server-time';
import { getDateTimeFormat } from '@/lib/utils/intl-format';

import {
  BreadcrumbStructuredData,
  ParkDatasetStructuredData,
  ParkSubPageStructuredData,
} from '@/components/seo/structured-data';
import { ParkBestDaysSection } from '@/components/parks/park-best-days-section';
import { ParkBestDaysSectionSkeleton } from '@/components/parks/park-best-days-section-skeleton';
import { ParkCalendarPanel } from '@/components/parks/park-calendar-panel';
import {
  ParkCalendarMonthSummary,
  ParkCalendarMonthSummarySkeleton,
} from '@/components/parks/park-calendar-month-summary';
import { ParkCalendarMonthIndex } from '@/components/parks/park-calendar-month-index';
import { ParkPageShell } from '@/components/parks/park-page-shell';
import { ParkTitleHeader } from '@/components/parks/park-title-header';
import { ParkHeaderCard } from '@/components/parks/park-header-card';
import { ParkNavTiles } from '@/components/parks/park-nav-tiles';
import { ParkTodayPanel } from '@/components/parks/park-today-panel';
import { parkArgs } from '@/lib/i18n/park-phrase';

interface ParkCalendarPageProps {
  params: Promise<{
    locale: string;
    continent: string;
    country: string;
    city: string;
    park: string;
    /** `undefined` on the hub, `['2026', '9']` on a month. Optional catch-all, so both are one
     *  route with one metadata function and one render. */
    date?: string[];
  }>;
}

/**
 * The month a URL asks for, or `'invalid'`. Shared by `generateMetadata` and the page so the two
 * cannot describe different months.
 */
function resolveMonth(
  date: string[] | undefined,
  now: ParkCalendarMonth,
  coverageTo?: string | null
) {
  const parsed = parseParkCalendarMonth(date, now, coverageTo);
  return parsed === 'invalid' ? 'invalid' : parsed;
}

/** The month's name in the reader's language, for the title, the H1 and the breadcrumb. */
function monthLabel(locale: string, { year, month }: ParkCalendarMonth): string {
  return getDateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

// Same posture as the park page: rendered per request, no per-URL ISR shell. The best-days seed
// streams inside its own boundary so a cold `/best-days` compute never gates first byte; the
// month grid is client-fetched per visible month.
export const dynamic = 'force-dynamic';

/**
 * A park's crowd calendar on its own URL, so the "wann ist es leer" answer can be crawled, carry
 * its own title and be shared as a link; the best-days section, which the calendar is the
 * evidence for, lives here too. The month hash keeps its `#calendar-YYYY-MM` spelling, so old
 * links still land on the right month after the park page's redirect.
 */
export async function generateMetadata({ params }: ParkCalendarPageProps): Promise<Metadata> {
  const { continent, country, city, park: parkSlug, locale, date } = await params;
  if (!isServableRoute(locale, continent, country, city, parkSlug)) return {};

  const t = await getTranslations({ locale, namespace: 'parks.calendarPage' });
  const tNotFound = await getTranslations({ locale, namespace: 'seo.notFound' });

  const park = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));
  if (!park) return { title: tNotFound('park') };

  // The window is measured from TODAY IN THE PARK, so the metadata and the page agree about which
  // months exist even for a park whose date has already rolled over (or not yet).
  const nowInPark = currentParkCalendarMonth(park.timezone);
  const resolved = resolveMonth(date, nowInPark, park.scheduleCoverage?.to);
  if (resolved === 'invalid') return { title: tNotFound('park'), robots: { index: false } };
  const month = resolved.month;

  const parkName = stripNewPrefix(park.name);
  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  // The hub is canonical for the current month (`/2026/8` points at it in August), so its title
  // names that month: the label is the month the page shows either way.
  const label = monthLabel(locale, month ?? nowInPark);

  // `fitWithin` takes the limit, then candidates longest-preferred: the short title is the
  // fallback for a park name that pushes the full one past 60 characters. One pair for the hub
  // and every month, because they are one kind of page; two pairs would drift apart.
  const title = fitWithin(
    MAX_TITLE_LENGTH,
    t('metaTitle', { park: parkName, month: label }),
    t('metaTitleShort', { park: parkName, month: label })
  );
  // Two candidates: with the longest park and city names in the catalogue, the description runs
  // past the 160 characters Google renders. The city goes, since it is already in the URL, the
  // breadcrumb and the H1's address line. The park phrases are inflected once for all four
  // strings: the German ones need them, and a call without them throws FORMATTING_ERROR.
  const parkPhrases = parkArgs(locale as Locale, parkName, park.nameArticleDe);
  const description = fitWithin(
    MAX_DESCRIPTION_LENGTH,
    month
      ? t('monthMetaDescription', { ...parkPhrases, city: cityName, month: label })
      : t('metaDescription', { ...parkPhrases, city: cityName }),
    month
      ? t('monthMetaDescriptionNoCity', { ...parkPhrases, month: label })
      : t('metaDescriptionNoCity', parkPhrases)
  );

  const path = (l: string, m: ParkCalendarMonth | null) =>
    parkCalendarPath(l, continent, country, city, parkSlug, m ?? undefined);

  // The hub shows the current month, so `/wartezeiten-kalender` and `/wartezeiten-kalender/2026/8` are the
  // same page in August — and the next month's "previous" arrow links straight at the second one.
  // The hub is the one that keeps working when the month turns over, so it is canonical for both;
  // every OTHER month is canonical for itself.
  const isCurrentMonth =
    !!month && month.year === nowInPark.year && month.month === nowInPark.month;
  const canonicalMonth = isCurrentMonth ? null : month;
  const canonical = `${SITE_URL}/${locale}${path(locale, canonicalMonth)}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      // Each locale gets its OWN segment (`/de/…/wartezeiten-kalender`, `/fr/…/calendrier-temps-attente`),
      // not the canonical English folder — the localized URL is what the rewrite serves and what a
      // reader sees. The month rides along unchanged: a month is a number in every language.
      languages: {
        ...generateAlternateLanguages((l) => `/${l}${path(l, canonicalMonth)}`),
        // Same shape every other route uses, and the same one `app/sitemap.ts` writes for these
        // URLs — a page and the sitemap disagreeing about x-default is an hreflang conflict.
        'x-default': `${SITE_URL}/en${path('en', canonicalMonth)}`,
      },
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
  const { locale, continent, country, city, park: parkSlug, date } = await params;
  assertServableRoute(locale, continent, country, city, parkSlug);
  setRequestLocale(locale);

  // Started before the park is awaited, since none of the three needs it. None of them rejects
  // (each answers a failure with null, [] or false), so a redirect below that leaves one unread
  // cannot leave an unhandled rejection. The best-days seed is consumed inside the <Suspense>
  // boundary below, so a cold compute streams in behind the shell instead of gating TTFB.
  const seedNow = new Date();
  const seedNowMs = seedNow.getTime();
  const bestDaysSeedPromise = getBestDaysCalendarSeed(continent, country, city, parkSlug);
  const seasonsPromise = getParkSeasons(continent, country, city, parkSlug);
  // Whether this park has a wait-time record, for the tile row below. Data-cached for a day and
  // shared with that page and `app/sitemap.ts`; awaited with the seasons to save a round trip.
  const statsAvailablePromise = hasParkStatsPage(continent, country, city, parkSlug);

  // Not `catchNonFatal`: a failed fetch must throw rather than 404 — see the park page.
  const parkFull = await getParkByGeoPath(continent, country, city, parkSlug);
  // This page draws no attraction cards, so it ships none of their data — the nine fields its
  // headliner rows and nav tiles actually read, and nothing else. See `leanParkForCalendarShell`.
  const parkForClock = parkFull ? leanParkForCalendarShell(parkFull) : parkFull;
  const nowMonth = currentParkCalendarMonth(parkForClock?.timezone);
  // Read off the full payload, not the lean shell projection: the shell keeps what the header
  // renders, and the coverage window is a routing fact.
  const coverageTo = parkFull?.scheduleCoverage?.to;
  const resolved = resolveMonth(date, nowMonth, coverageTo);
  // A month that is not a month is a 404, not a quiet fall back to the hub: `/…/2026/13` is a typo
  // or a crawler probing, and answering it with the current month would put one page's content on
  // unbounded URLs.
  if (resolved === 'invalid') {
    // A well-formed month that has fallen out of the window 308s to the hub: the stepper linked it
    // once and a crawler may still hold it. A malformed segment stays a 404. Most never get here:
    // `proxy.ts` answers months out of the window for every park, since a redirect thrown from a
    // render carries the not-found document as its body; this handles the edge months that only
    // this park's timezone and `scheduleCoverage.to` settle. See `lib/parks/calendar-redirects.ts`.
    if (parseParkCalendarMonthSpelling(date)) {
      permanentRedirect(
        `/${locale}${parkCalendarPath(locale, continent, country, city, parkSlug)}`
      );
    }
    notFound();
  }
  const month = resolved.month;
  // `/2026/09` and `/2026/9` are the same month. One of them is canonical and the other 308s to
  // it, rather than both answering 200 with identical content.
  if (resolved.padded && month) {
    permanentRedirect(
      `/${locale}${parkCalendarPath(locale, continent, country, city, parkSlug, month)}`
    );
  }

  const t = await getTranslations('parks.calendarPage');
  const tDataset = await getTranslations('parks.calendarPage.dataset');
  const tGeo = await getTranslations('geo');

  // The same three redirects the park page runs, for the same reason: this URL is reachable
  // directly from search and a stale geo path must transfer rather than 404.
  const malformed = await findParkPageRedirect(continent, country, city, parkSlug);
  if (malformed) {
    // Keep the calendar segment and the month, as the relocated and renamed branches below do.
    permanentRedirect(`/${locale}${malformed}${parkCalendarSuffix(locale, month)}`);
  }

  // The month the page is about: on the hub the current one, the month the grid opens on.
  // Awaited inside its own boundary below, and data-cached so the many URLs do not each mean an
  // upstream call.
  const summaryMonth = month ?? nowMonth;
  const monthSeedPromise = getCalendarMonthSeed(continent, country, city, parkSlug, summaryMonth);

  const park = parkForClock;
  const [seasons, statsAvailable] = await Promise.all([seasonsPromise, statsAvailablePromise]);
  if (!park) {
    const relocated = await findRelocatedParkRedirect(continent, country, city, parkSlug);
    if (relocated) {
      permanentRedirect(`/${locale}${relocated}${parkCalendarSuffix(locale, month)}`);
    }
    notFound();
  }

  const renamed = findRenamedParkRedirect(park, { continent, country, city, parkSlug });
  if (renamed) {
    permanentRedirect(`/${locale}${renamed}${parkCalendarSuffix(locale, month)}`);
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
    cityHasPage: await cityHasOwnPage(continent, country, city),
    parkName,
    homeLabel: tCommon('home'),
    continentsLabel: tNav('continents'),
  });
  // The park page's own trail plus the park itself as a link, so the way back is a real link and
  // not just the browser's back button. On a month page the calendar hub becomes a link too and
  // the month is the leaf — the trail is the only place a visitor can step back up one level.
  const calendarPath = parkCalendarPath(locale, continent, country, city, parkSlug);
  const monthName = month ? monthLabel(locale, month) : null;
  const breadcrumbs = [
    ...parkBreadcrumbs,
    { name: parkCurrentPage, url: parkPath },
    ...(month ? [{ name: t('breadcrumb'), url: calendarPath }] : []),
  ];

  // Same rule `generateMetadata` applies to `alternates.canonical`: the hub is canonical for the
  // current month, every other month for itself.
  const isCurrentMonth = !!month && month.year === nowMonth.year && month.month === nowMonth.month;
  const canonicalUrl = `${SITE_URL}/${locale}${parkCalendarPath(
    locale,
    continent,
    country,
    city,
    parkSlug,
    isCurrentMonth ? undefined : (month ?? undefined)
  )}`;

  // One month value feeds the stepper, the grid and the label, so the three cannot disagree. The
  // neighbours only while they are inside the window: a stepper pointing at a 404 is worse than
  // one that stops.
  const shownMonth = month ?? nowMonth;
  const back = shiftParkCalendarMonth(shownMonth, -1);
  const forward = shiftParkCalendarMonth(shownMonth, 1);
  const prevMonth = isParkCalendarMonthInRange(back, nowMonth, coverageTo) ? back : null;
  const nextMonth = isParkCalendarMonthInRange(forward, nowMonth, coverageTo) ? forward : null;

  return (
    <RouteMessages route="/parks/[continent]/[country]/[city]/[park]/wait-time-calendar/[[...date]]">
      {/* Tells the planner which park this route is about (`lib/planner/page-park.ts`): the
          panel lives in the layout and cannot otherwise tell one park's calendar from
          another's. */}
      <PlannerPageParkBeacon
        slug={park.slug}
        name={parkName}
        geo={{ continent, country, city }}
        timezone={park.timezone}
        backgroundImage={getParkBackgroundImage(park.slug)}
        backgroundPosition={getCardObjectPosition(park.slug)}
      />
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
        currentPage={monthName ?? t('breadcrumb')}
        pagePath={parkCalendarPath(locale, continent, country, city, parkSlug, month ?? undefined)}
        statsAfterChildren
        head={
          <>
            {/* A `Dataset` for the table of days (`summaryMonth`, the month the grid opens on) and
              a page node pointing at the park's own `AmusementPark` node. Both are keyed on the
              canonical URL, so the hub and its current month do not emit two ids for one month. */}
            <ParkDatasetStructuredData
              url={canonicalUrl}
              parkUrl={`${SITE_URL}/${locale}${parkPath}`}
              parkName={parkName}
              parkLatitude={park.latitude}
              parkLongitude={park.longitude}
              name={tDataset('name', {
                ...parkArgs(locale as Locale, parkName, park.nameArticleDe),
                month: monthLabel(locale, summaryMonth),
              })}
              description={tDataset('description', {
                ...parkArgs(locale as Locale, parkName, park.nameArticleDe),
                month: monthLabel(locale, summaryMonth),
              })}
              temporalCoverage={monthTemporalCoverage(summaryMonth)}
              variableMeasured={[
                tDataset('varCrowd'),
                tDataset('varWait'),
                tDataset('varHours'),
                tDataset('varHolidays'),
                tDataset('varWeather'),
              ]}
              locale={locale}
            />
            <ParkSubPageStructuredData
              url={canonicalUrl}
              parkUrl={`${SITE_URL}/${locale}${parkPath}`}
              parkName={parkName}
              name={monthName ? `${parkName} – ${monthName}` : `${parkName} – ${t('breadcrumb')}`}
              locale={locale}
            />
            <BreadcrumbStructuredData
              breadcrumbs={breadcrumbs}
              currentPage={{
                name: monthName ?? t('breadcrumb'),
                url: parkCalendarPath(
                  locale,
                  continent,
                  country,
                  city,
                  parkSlug,
                  month ?? undefined
                ),
              }}
              locale={locale}
            />
          </>
        }
        header={
          <ParkTitleHeader
            park={park}
            parkName={parkName}
            cityName={cityName}
            country={country}
            countryName={countryName}
            locale={locale}
            // The H1 must differ between the hub and each of its months, or the pages share a
            // heading; it names the month the page shows, today's on the hub.
            suffix={t('h1Suffix', { month: monthName ?? monthLabel(locale, nowMonth) })}
            intro={
              monthName
                ? t('monthIntro', {
                    ...parkArgs(locale as Locale, parkName, park.nameArticleDe),
                    month: monthName,
                  })
                : t('intro', parkArgs(locale as Locale, parkName, park.nameArticleDe))
            }
          />
        }
      >
        {/* The park page's header card, with link cells instead of tab triggers: there is no
          `<Tabs>` on this page, and a trigger without a panel does nothing. */}
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
              statsAvailable={statsAvailable}
            />
          }
        />

        {/* One chapter, one stream: „Beste Reisezeit" and the month's own sentences answer the
          same question at two grains, so they arrive as one box behind one boundary. */}
        <Suspense
          fallback={
            <ParkBestDaysSectionSkeleton
              parkName={parkName}
              parkSlug={parkSlug}
              locale={locale}
              intro={<ParkCalendarMonthSummarySkeleton />}
            />
          }
        >
          <SeededBestDays
            seedPromise={bestDaysSeedPromise}
            monthSeedPromise={monthSeedPromise}
            continent={continent}
            country={country}
            city={city}
            parkSlug={parkSlug}
            timezone={park.timezone}
            hasOperatingSchedule={park.hasOperatingSchedule}
            parkName={parkName}
            park={park}
            locale={locale}
            monthLabel={monthLabel(locale, summaryMonth)}
            seedNowMs={seedNowMs}
          />
        </Suspense>

        {/* The evidence. The month comes from the URL rather than from component state, which is
          what turns the stepper into two real links and the twelve months into twelve pages. */}
        <ParkCalendarPanel
          park={park}
          continent={continent}
          country={country}
          city={city}
          parkSlug={parkSlug}
          month={shownMonth}
          currentMonth={nowMonth}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          className="mt-8"
          // Every month of the window, one hop from here. The stepper inside the card links two.
          monthIndex={
            <ParkCalendarMonthIndex
              locale={locale}
              continent={continent}
              country={country}
              city={city}
              parkSlug={parkSlug}
              currentMonth={nowMonth}
              activeMonth={month}
              coverageTo={coverageTo}
            />
          }
        />
      </ParkPageShell>
    </RouteMessages>
  );
}

/**
 * The part of this URL after the park — `/wartezeiten-kalender` or `/wartezeiten-kalender/2026/9` — for
 * the redirects that rebuild it under a park's new geo path. Built from `parkCalendarPath` with
 * throwaway geo segments rather than reassembled by hand, so the two can never disagree about
 * how a month is spelled.
 */
function parkCalendarSuffix(locale: string, month: ParkCalendarMonth | null): string {
  const stem = parkCalendarPath(locale, 'c', 'c', 'c', 'p');
  const full = parkCalendarPath(locale, 'c', 'c', 'c', 'p', month ?? undefined);
  return full.slice(stem.lastIndexOf('/'));
}

/**
 * The streamed „beste Reisezeit" chapter, month summary included: two awaits in one boundary,
 * because they are one box. A `null` best-days seed falls through to the section's client fetch;
 * a `null` month seed renders no lead-in.
 */
async function SeededBestDays({
  seedPromise,
  monthSeedPromise,
  continent,
  country,
  city,
  parkSlug,
  timezone,
  hasOperatingSchedule,
  parkName,
  park,
  locale,
  monthLabel,
  seedNowMs,
}: {
  seedPromise: Promise<BestDaysSnapshot | null>;
  monthSeedPromise: Promise<IntegratedCalendarResponse | null>;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  timezone: string;
  hasOperatingSchedule: boolean;
  parkName: string;
  park: ParkWithAttractions;
  locale: string;
  monthLabel: string;
  seedNowMs: number;
}) {
  const [seed, monthSeed] = await Promise.all([seedPromise, monthSeedPromise]);

  // The park's own date, not the server's: `isPast` decides whether the prose reads „am ruhigsten
  // wird es" or „war es", and a park in Florida is still on yesterday for six hours after
  // midnight in Berlin.
  const tz = timezone || 'UTC';
  const todayIso = await getServerToday(tz);
  const summary = monthSeed?.days?.length
    ? summarizeCalendarMonth(monthSeed.days, todayIso, tz)
    : null;

  return (
    <ParkBestDaysSection
      continent={continent}
      country={country}
      city={city}
      parkSlug={parkSlug}
      timezone={timezone}
      hasOperatingSchedule={hasOperatingSchedule}
      parkName={parkName}
      articleDe={park.nameArticleDe}
      locale={locale}
      initialCalendar={seed}
      seedNowMs={seedNowMs}
      intro={
        summary ? (
          <ParkCalendarMonthSummary
            summary={summary}
            park={park}
            locale={locale}
            monthLabel={monthLabel}
          />
        ) : null
      }
    />
  );
}

/**
 * ISO-8601 interval for one month, e.g. `2026-11-01/2026-11-30`, for `Dataset.temporalCoverage`.
 *
 * `Date.UTC(year, month, 0)` is the last day of `month` — the zeroth day of the NEXT one — which
 * gets February and a leap year right without a table. UTC throughout so a server in a zone with
 * a midnight DST jump cannot land the interval a day short.
 */
function monthTemporalCoverage({ year, month }: ParkCalendarMonth): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${pad(month)}-01/${year}-${pad(month)}-${pad(lastDay)}`;
}
