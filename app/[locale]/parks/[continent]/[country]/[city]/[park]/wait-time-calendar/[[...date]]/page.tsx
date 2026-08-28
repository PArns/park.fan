import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, permanentRedirect } from 'next/navigation';

import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { RouteMessages } from '@/i18n/route-messages';
import { catchNonFatal } from '@/lib/api/client';
import { getParkByGeoPath, getParkSeasons, leanParkForParkShell } from '@/lib/api/parks';
import { getBestDaysCalendarSeed, getCalendarMonthSeed } from '@/lib/api/integrated-calendar';
import type { BestDaysSnapshot } from '@/lib/api/integrated-calendar';
import { summarizeCalendarMonth } from '@/lib/parks/calendar-month-summary';
import type { IntegratedCalendarResponse, ParkWithAttractions } from '@/lib/api/types';
import {
  findParkPageRedirect,
  findRelocatedParkRedirect,
  findRenamedParkRedirect,
} from '@/lib/utils/redirect-utils';
import {
  currentParkCalendarMonth,
  isParkCalendarMonthInRange,
  parkCalendarPath,
  parseParkCalendarMonth,
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

import {
  BreadcrumbStructuredData,
  ParkCalendarDatasetStructuredData,
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
 * The month a URL asks for, plus what to do when it asks wrongly.
 *
 * Shared by `generateMetadata` and the page so the two cannot disagree about which month they are
 * describing — a title for September under a grid showing August is the kind of mismatch nobody
 * notices until it is in the index.
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
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
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
  // The hub is canonical for the CURRENT month — `/2026/8` points at it in August — so it is
  // that month's page and its title should say so. It used to end „: die ruhigen Tage", which
  // names no month, matches no query and is the decorative closer CLAUDE.md rules out. The label
  // is the month the page actually shows either way, so one variable serves both branches.
  const label = monthLabel(locale, month ?? nowInPark);

  // `fitWithin` takes the limit first and then candidates longest-preferred: the short title is
  // the fallback for a park name that pushes the full one past 60 characters.
  //
  // ONE pair for the hub and for every month, because they are one kind of page. The hub is
  // canonical for the current month — `/2026/8` points at it in August — so it is that month's
  // page and reads like one. It used to have a second pair of its own, and the two drifted the
  // moment they existed: the hub said „Wartezeiten-Kalender", the months said „{month}:
  // Wartezeiten & Andrang", and neither was the phrase a person types. Same reasoning as the
  // segment name in `calendar-segments.ts` — two spellings of one thing are two chances to pick
  // the wrong one.
  const title = fitWithin(
    MAX_TITLE_LENGTH,
    t('metaTitle', { park: parkName, month: label }),
    t('metaTitleShort', { park: parkName, month: label })
  );
  // Two candidates, and the second is not decoration: the description names the park AND the
  // city, and the catalogue's longest pair is 53 characters ("Fantawild Silk Road Heritage
  // Jiayuguan" in "Jia Yu Guan Shi") against Phantasialand's 18. With one candidate `fitWithin`
  // has nothing to fall back to and returns it at whatever length it came out — measured at 179
  // to 198 characters in all six locales for that park, every one of them past the 160 Google
  // will render. The city is the part that goes: it is already in the URL, the breadcrumb and
  // the H1's address line. Same shape the park page has used all along.
  const description = fitWithin(
    MAX_DESCRIPTION_LENGTH,
    month
      ? t('monthMetaDescription', { park: parkName, city: cityName, month: label })
      : t('metaDescription', { park: parkName, city: cityName }),
    month
      ? t('monthMetaDescriptionNoCity', { park: parkName, month: label })
      : t('metaDescriptionNoCity', { park: parkName })
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

  const parkFull = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));
  const parkForClock = parkFull ? leanParkForParkShell(parkFull) : parkFull;
  const nowMonth = currentParkCalendarMonth(parkForClock?.timezone);
  // Read off the full payload, not the lean shell projection: the shell keeps what the header
  // renders, and the coverage window is a routing fact.
  const coverageTo = parkFull?.scheduleCoverage?.to;
  const resolved = resolveMonth(date, nowMonth, coverageTo);
  // A month that is not a month is a 404, not a quiet fall back to the hub: `/…/2026/13` is a typo
  // or a crawler probing, and answering it with the current month would put one page's content on
  // unbounded URLs.
  if (resolved === 'invalid') {
    // A well-formed month that has simply fallen out of the window gets a 301 to the hub, not a
    // 404. Narrowing the back span from twelve months to what the archive covers turned four
    // months × 212 parks × 6 locales from 200 into gone — URLs the stepper linked last week and a
    // crawler may still hold. A malformed segment (`/2026/13`, `/abc/x`) stays a 404: that is a
    // typo or a probe, and there is nothing to send it to.
    const [rawYear, rawMonth] = date ?? [];
    const wellFormed =
      /^\d{4}$/.test(rawYear ?? '') &&
      /^\d{1,2}$/.test(rawMonth ?? '') &&
      Number(rawMonth) >= 1 &&
      Number(rawMonth) <= 12;
    if (wellFormed) {
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
    // Keep the calendar segment and the month, exactly as the relocated/renamed branches below do.
    // Dropping them sent somebody who asked for September 2026 to the park's wait-time page.
    permanentRedirect(`/${locale}${malformed}${parkCalendarSuffix(locale, month)}`);
  }

  // Fired, not awaited: consumed inside the <Suspense> boundary below, so a cold best-days
  // compute streams in behind the shell instead of gating TTFB. One clock read serves the seed.
  const seedNow = new Date();
  const seedNowMs = seedNow.getTime();
  const bestDaysSeedPromise = getBestDaysCalendarSeed(continent, country, city, parkSlug);
  const seasonsPromise = getParkSeasons(continent, country, city, parkSlug);
  // The month the page is ABOUT — on the hub that is the current one, which is the month the grid
  // opens on and therefore the month a summary there would describe. Fired here, awaited inside
  // its own boundary below, and data-cached so tens of thousands of URLs do not each mean an
  // upstream call.
  const summaryMonth = month ?? nowMonth;
  const monthSeedPromise = getCalendarMonthSeed(continent, country, city, parkSlug, summaryMonth);

  const park = parkForClock;
  const seasons = await seasonsPromise;
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

  // The neighbouring months, but only while they are inside the window the route serves — a
  // stepper that points at a 404 is worse than one that stops.
  // One month value feeds the stepper, the grid and the label, so the three cannot disagree —
  // the page used the park's clock while the grid fell back to the browser's, which is one month
  // apart for a few hours around every month boundary in any zone but the reader's.
  // Same rule `generateMetadata` applies to `alternates.canonical`: the hub is canonical for the
  // current month, every other month for itself. Kept next to the render so the structured data
  // and the <link> can only ever name one URL.
  const isCurrentMonth = !!month && month.year === nowMonth.year && month.month === nowMonth.month;
  const canonicalUrl = `${SITE_URL}/${locale}${parkCalendarPath(
    locale,
    continent,
    country,
    city,
    parkSlug,
    isCurrentMonth ? undefined : (month ?? undefined)
  )}`;

  const shownMonth = month ?? nowMonth;
  const back = shiftParkCalendarMonth(shownMonth, -1);
  const forward = shiftParkCalendarMonth(shownMonth, 1);
  const prevMonth = isParkCalendarMonthInRange(back, nowMonth, coverageTo) ? back : null;
  const nextMonth = isParkCalendarMonthInRange(forward, nowMonth, coverageTo) ? forward : null;

  return (
    <RouteMessages route="/parks/[continent]/[country]/[city]/[park]/wait-time-calendar/[[...date]]">
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
            {/* Keyed on the CANONICAL month, not on the requested one. In August the hub and
              `/2026/8` render the same page and the metadata canonicals the second at the first —
              but both emitted their own `#dataset` and `#webpage` with identical name, description
              and coverage. Two ids for one month, one of them on a URL that declares itself not
              canonical. `canonicalMonth` is what the `<link rel=canonical>` already uses. */}
            {/* What this page is about, pointing at the park's own `AmusementPark` node rather
              than restating it. Without this the calendar pages declared no subject at all. */}
            {/* The page is a table of one row per day, which is what `Dataset` is for. The month
              it covers is `summaryMonth` — on the hub that is the current one, which is what its
              grid opens on, so the coverage matches what a visitor actually sees. */}
            <ParkCalendarDatasetStructuredData
              url={canonicalUrl}
              parkUrl={`${SITE_URL}/${locale}${parkPath}`}
              name={tDataset('name', { park: parkName, month: monthLabel(locale, summaryMonth) })}
              description={tDataset('description', {
                park: parkName,
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
            // The H1 is the one thing that must differ between the hub and each of its months,
            // or twelve pages share a heading and a crawler has no reason to tell them apart.
            // The month this page shows — the URL's on a month page, today's on the hub. Same
            // suffix either way, for the same reason the title is.
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

        {/* One chapter, one stream. „Beste Reisezeit" and the month's own sentences answer the
          same question at two grains, so they arrive as one box rather than as two cards with a
          strip of park photograph between them — and as one boundary rather than two, which is
          also one placeholder to keep honest instead of two that have to agree. */}
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
 * The streamed „beste Reisezeit" chapter, month summary included.
 *
 * Two awaits in one boundary on purpose. They used to be two: the month summary in its own
 * <Suspense> above this one, each with its own placeholder, each resolving on its own schedule —
 * so the chapter assembled itself in two visible steps. They answer the same question and are one
 * box now, so they are one wait.
 *
 * Either half may be missing and the chapter still stands. A `null` best-days seed falls through
 * to the section's own client fetch; a `null` month seed (timeout, or a month with no operating
 * day at all) simply renders no lead-in.
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
