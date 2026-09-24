import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowRight, CalendarDays, Clock, Zap } from 'lucide-react';

import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import { Link } from '@/i18n/navigation';
import { RouteMessages } from '@/i18n/route-messages';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { catchNonFatal } from '@/lib/api/client';
import { getParkByGeoPath, getParkSeasons, leanParkForCalendarShell } from '@/lib/api/parks';
import {
  getParkHourlyProfileForPage,
  getParkStatsForPage,
  PARK_STATS_PAGE_QUERY,
} from '@/lib/api/stats';
import { deriveParkStatsFindings, hasReadableHourlyProfile } from '@/lib/parks/park-stats-derive';
import { parkCalendarPath } from '@/lib/parks/calendar-segments';
import { parkStatsPath } from '@/lib/parks/stats-segments';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { getCardObjectPosition, getParkBackgroundImage } from '@/lib/utils/park-assets';
import {
  cityHasOwnPage,
  findParkPageRedirect,
  findRelocatedParkRedirect,
  findRenamedParkRedirect,
} from '@/lib/utils/redirect-utils';
import { translateContinent, translateCountry } from '@/lib/i18n/helpers';
import { generateParkBreadcrumbs } from '@/lib/utils/breadcrumb-utils';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { stripNewPrefix } from '@/lib/utils';
import {
  buildOpenGraphMetadata,
  fitWithin,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { parkArgs } from '@/lib/i18n/park-phrase';
import { roundWaitTo5 } from '@/lib/utils/wait-time';

import {
  BreadcrumbStructuredData,
  ParkDatasetStructuredData,
  ParkSubPageStructuredData,
} from '@/components/seo/structured-data';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { GlassCard } from '@/components/common/glass-card';
import { PlannerPageParkBeacon } from '@/components/planner/planner-page-park-beacon';
import { ParkHeaderCard } from '@/components/parks/park-header-card';
import { ParkHourlyProfileCard } from '@/components/parks/park-hourly-profile-card';
import { ParkNavTiles } from '@/components/parks/park-nav-tiles';
import { ParkPageShell } from '@/components/parks/park-page-shell';
import { ParkStatsMethod } from '@/components/parks/park-stats-method';
import { ParkStatsSection } from '@/components/parks/park-stats-section';
import { ParkTitleHeader } from '@/components/parks/park-title-header';
import { ParkTodayPanel } from '@/components/parks/park-today-panel';

interface ParkStatsPageProps {
  params: Promise<{
    locale: string;
    continent: string;
    country: string;
    city: string;
    park: string;
  }>;
}

/**
 * **ISR with a one-day window, and the first park-level route that is not `force-dynamic`.**
 *
 * The park page and the calendar are rendered per request because their subject is today: a live
 * wait table, a "heute im Park" band, a crowd level that moves every morning. Nothing on this page
 * is live. Both aggregates behind it are recomputed once a day by the backend, so a day is the
 * data's own cadence rather than a floor propped under the route, and the window matches the one
 * `CACHE_TTL.stats` gives the two fetches — Next takes the SHORTEST `revalidate` a route executes,
 * and these are the same number by construction rather than by luck.
 *
 * It is also where the cost argument for this URL class lives. 74 % of this site's function
 * invocations are crawler sweeps and 87 % of them miss every cache
 * (`docs/optimization/baseline-profile.md`), so a sweep of a `force-dynamic` route runs 714
 * functions while a sweep of this one is served from a prerender. That is the whole reason 714
 * new URLs is the cheap kind of surface to add — and the reason a later park sub-page that
 * CANNOT be cached does not get to cite this one.
 */
export const revalidate = 86400;

/**
 * Empty on purpose, and not optional.
 *
 * A route whose segments are all dynamic and which declares no `generateStaticParams` is not
 * registered in `.next/prerender-manifest.json` at all — Next serves it per request and caches
 * nothing, however long its `revalidate` says. Declaring one, even with no paths, registers it as
 * `compute: "blocking"` with `fallback: null`: nothing is built ahead of time, and each URL is
 * rendered on its first request and then served from that render for a day. Verified against the
 * manifest both ways.
 *
 * Nothing is listed because listing would mean building. The 714 URLs would each be rendered
 * during `next build` — with their two API calls apiece — for pages that are cheap to produce on
 * demand and are then cached exactly as a prerendered one is. The park and attraction routes
 * avoid the same write explosion by being `force-dynamic`; this route gets the cache without the
 * build cost.
 */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: ParkStatsPageProps): Promise<Metadata> {
  const { continent, country, city, park: parkSlug, locale } = await params;
  if (!isServableRoute(locale, continent, country, city, parkSlug)) return {};

  const t = await getTranslations({ locale, namespace: 'parks.statsPage' });
  const tNotFound = await getTranslations({ locale, namespace: 'seo.notFound' });

  const park = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));
  if (!park) return { title: tNotFound('park') };

  // The gate is the same one the page 404s on, asked here so a park without a record never gets
  // a title, a canonical or an hreflang set pointing at a page that does not exist.
  const stats = await catchNonFatal(getParkStatsForPage(continent, country, city, parkSlug));
  if (!stats?.meta.displayable) return { title: tNotFound('park'), robots: { index: false } };

  const parkName = stripNewPrefix(park.name);
  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  const parkPhrases = parkArgs(locale as Locale, parkName, park.nameArticleDe);

  // Two candidates, longest-preferred, for the same reason the calendar has two: the catalogue's
  // longest park name is 41 characters and the title has to survive it.
  const title = fitWithin(
    MAX_TITLE_LENGTH,
    t('metaTitle', { park: parkName }),
    t('metaTitleShort', { park: parkName })
  );
  // The description names the measured-day count, which is the one claim on this page no
  // competitor makes — and the shortest honest thing to put in front of a searcher comparing
  // two results. The city goes first when it fits: it is what separates two parks with similar
  // names in a SERP.
  const description = fitWithin(
    MAX_DESCRIPTION_LENGTH,
    t('metaDescription', {
      ...parkPhrases,
      city: cityName,
      days: stats.meta.totalSampleDays,
    }),
    t('metaDescriptionNoCity', { ...parkPhrases, days: stats.meta.totalSampleDays })
  );

  const path = (l: string) => parkStatsPath(l, continent, country, city, parkSlug);
  const canonical = `${SITE_URL}/${locale}${path(locale)}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      // Each locale gets its OWN segment (`/de/…/durchschnittliche-wartezeiten`), not the
      // canonical English folder — the localized URL is what the rewrite serves and what a reader
      // sees. Same shape `app/sitemap.ts` writes for these URLs; a page and the sitemap
      // disagreeing about x-default is an hreflang conflict.
      languages: {
        ...generateAlternateLanguages((l) => `/${l}${path(l)}`),
        'x-default': `${SITE_URL}/en${path('en')}`,
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

/**
 * A park's wait-time record: what it is normally like, rather than what it is like right now.
 *
 * The park page server-renders the live answer already — every attraction, its link, its snapshot
 * wait and the reading's timestamp — so a second page showing that table would be a duplicate
 * competing with the page it copied for the query that page already ranks for. What the park page
 * does NOT put into its first HTML is the historical half, and in two different ways: its
 * statistics section is mounted client-side on purpose (a cold aggregate would have failed the
 * prerender and pushed the route to `no-store`), and the typical-day curve is not on it at all —
 * `ParkHourlyProfileCard` was rendered only by a blog fence and the guide page's demos.
 *
 * So this page is that half, server-rendered, on its own URL: crowd by month and weekday over two
 * years, the rides ranked by the queue they normally carry, the typical day hour by hour, and the
 * sample size behind all of it. The park page keeps every section it has — a reader already there
 * should not have to navigate for numbers they can see in place — and gains one link.
 *
 * **The route is gated on `meta.displayable`.** 119 of the 201 parks with attractions passed on
 * 2026-09-21; the other 82 would have contributed 492 URLs built from a handful of measured days,
 * 222 of them from none. A park below the line 404s here rather than publishing a thin table
 * under a real-looking title, and no link anywhere points at it — see `hasParkStatsPage`.
 */
export default async function ParkStatsPage({ params }: ParkStatsPageProps) {
  const { locale, continent, country, city, park: parkSlug } = await params;
  assertServableRoute(locale, continent, country, city, parkSlug);
  setRequestLocale(locale);

  // Not `catchNonFatal`, for the reason `getParkStatsForPage` below throws: swallowed, an outage
  // became a `notFound()` this ISR route then stored for a day.
  const parkFull = await getParkByGeoPath(continent, country, city, parkSlug);

  // The same three redirects the park page and the calendar run, for the same reason: this URL is
  // reachable directly from search and a stale geo path must transfer rather than 404. The
  // segment is rebuilt from `parkStatsPath` with throwaway geo segments so the two can never
  // disagree about how it is spelled.
  const suffix = statsSuffix(locale);
  const malformed = await findParkPageRedirect(continent, country, city, parkSlug);
  if (malformed) permanentRedirect(`/${locale}${malformed}${suffix}`);

  if (!parkFull) {
    const relocated = await findRelocatedParkRedirect(continent, country, city, parkSlug);
    if (relocated) permanentRedirect(`/${locale}${relocated}${suffix}`);
    notFound();
  }

  const renamed = findRenamedParkRedirect(parkFull, { continent, country, city, parkSlug });
  if (renamed) permanentRedirect(`/${locale}${renamed}${suffix}`);

  const stats = await getParkStatsForPage(continent, country, city, parkSlug);
  // The aggregate IS the page, so an absent or thin one is a 404 and not an empty chapter. A
  // FAILURE is neither: `getParkStatsForPage` throws on anything that is not a 404, which leaves
  // the ISR entry unwritten and the next request trying again, rather than storing our own outage
  // as "this park has no record" for a day.
  if (!stats?.meta.displayable) notFound();

  // The typical-day chapter, on the same terms: `null` is the API's 404 — a settled "no readable
  // profile", which 4 of the 119 qualifying parks genuinely are — and every other failure throws.
  // Not caught to `null` here, deliberately: a swallowed outage would bake a page WITHOUT the one
  // chapter no other park URL renders, and bake it for a day, invisibly. A throw leaves the ISR
  // entry unwritten and the next request tries again.
  const profile = await getParkHourlyProfileForPage(continent, country, city, parkSlug);
  // Gated on its content, not on the fetch, and through the card's OWN predicate: it returns
  // `null` for a thin profile or one with no measurable hours, and a chapter heading over nothing
  // is worse than no chapter. The method section below reads the same predicate, so its paragraph
  // about the hourly window cannot describe a table this page did not draw.
  const showHourly = hasReadableHourlyProfile(profile);

  const [seasons, t, tStats, tOverview, tDataset, tGeo, tCommon, tNav] = await Promise.all([
    getParkSeasons(continent, country, city, parkSlug),
    getTranslations('parks.statsPage'),
    getTranslations('parks.stats'),
    getTranslations('parks.overview'),
    getTranslations('parks.statsPage.dataset'),
    getTranslations('geo'),
    getTranslations('common'),
    getTranslations('navigation'),
  ]);

  // This page draws no attraction cards either, so it ships none of their data — the same twelve
  // fields the calendar shell keeps, for the same two components.
  const park = leanParkForCalendarShell(parkFull);
  const parkName = stripNewPrefix(park.name);
  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  const countryName = translateCountry(tGeo, country, locale, park.country ?? undefined);
  const parkPath = `/parks/${continent}/${country}/${city}/${parkSlug}`;
  const pagePath = parkStatsPath(locale, continent, country, city, parkSlug);
  const canonicalUrl = `${SITE_URL}/${locale}${pagePath}`;
  const parkPhrases = parkArgs(locale as Locale, parkName, park.nameArticleDe);

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
  // The park page's own trail plus the park itself as a link, so the way back up one level is a
  // real link rather than the browser's back button.
  const breadcrumbs = [...parkBreadcrumbs, { name: parkCurrentPage, url: parkPath }];

  const lead = buildLead({
    stats,
    locale,
    parkPhrases,
    sentence: (key, values) => t(key, values),
  });

  return (
    <RouteMessages route="/parks/[continent]/[country]/[city]/[park]/average-wait-times">
      {/* Tells the planner which park this route is about — see `lib/planner/page-park.ts`. The
          panel lives in the layout and otherwise cannot tell one park's record from another's. */}
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
        currentPage={t('breadcrumb')}
        pagePath={pagePath}
        // The statistics chapter is this page's subject and is rendered below, seeded from the
        // server. The shell's own client-fetched copy would be the same three tables again.
        hideStats
        head={
          <>
            {/* The page is a table of one row per month, per weekday, per ride and per hour,
              which is what `Dataset` is for. Its interval is the aggregate's own window, ending
              today — `windowYears` is what the API measured over, so the coverage is a fact about
              the payload rather than a claim about the archive. */}
            <ParkDatasetStructuredData
              url={canonicalUrl}
              parkUrl={`${SITE_URL}/${locale}${parkPath}`}
              parkName={parkName}
              name={tDataset('name', parkPhrases)}
              description={tDataset('description', {
                ...parkPhrases,
                days: stats.meta.totalSampleDays,
                years: stats.meta.windowYears,
              })}
              temporalCoverage={windowTemporalCoverage(stats.meta.windowYears)}
              variableMeasured={[
                tDataset('varTypical'),
                tDataset('varPeak'),
                tDataset('varCrowd'),
                tDataset('varSampleDays'),
              ]}
              locale={locale}
            />
            {/* What this page is about, pointing at the park's own `AmusementPark` node rather
              than restating it. */}
            <ParkSubPageStructuredData
              url={canonicalUrl}
              parkUrl={`${SITE_URL}/${locale}${parkPath}`}
              parkName={parkName}
              name={`${parkName} – ${t('breadcrumb')}`}
              locale={locale}
            />
            <BreadcrumbStructuredData
              breadcrumbs={breadcrumbs}
              currentPage={{ name: t('breadcrumb'), url: pagePath }}
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
            suffix={t('h1Suffix')}
            intro={lead}
          />
        }
      >
        {/* The same header card every park page opens with, built with LINK cells — there is no
          `<Tabs>` on this page to switch. `statsAvailable` is not a question here: this page only
          renders for a park that has one. */}
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
              current="stats"
              park={park}
              continent={continent}
              country={country}
              city={city}
              parkSlug={parkSlug}
              showsAvailable={(park.shows?.length ?? 0) > 0}
              restaurantsAvailable={(park.restaurants?.length ?? 0) > 0}
              weatherAvailable={!!park.weather?.current}
              statsAvailable
            />
          }
        />

        {/* The ranking and the two crowd tables, in the one panel the park page already draws
          them in — same component, same order, same colour scale. What differs is `initialStats`:
          here the aggregate is fetched on the server, so these numbers are in the first HTML
          instead of arriving with the client query. That query still runs and replaces them,
          which is also what keeps the live "jetzt" column working. */}
        <ParkStatsSection
          continent={continent}
          country={country}
          city={city}
          parkSlug={parkSlug}
          locale={locale}
          hasLiveWaitTimes={hasReadableWaitTimes(park)}
          initialStats={stats}
        />

        {/* The typical day. The one table on this site whose answer is a POSITION rather than a
          value — when to walk to the headliner, not how long its queue is — and the only chapter
          here that no park URL rendered before. */}
        {showHourly && (
          <section className="mt-8" aria-labelledby="stats-hourly-heading">
            <ChapterHeading
              icon={Clock}
              title={t('hourlyTitle')}
              id="stats-hourly-heading"
              frosted
              hint={t('hourlyHint', { days: profile.meta.totalSampleDays })}
            />
            <ParkHourlyProfileCard
              continent={continent}
              country={country}
              city={city}
              parkSlug={parkSlug}
              basePath={parkPath}
              locale={locale}
              topN={PARK_STATS_PAGE_QUERY.hourlyTopN}
              initialProfile={profile}
              labels={{
                title: tStats('hourlyProfileTitle'),
                ride: tStats('rideWaitsRide'),
                hour: tStats('hourlyProfileHour'),
                minutes: tOverview('minutesUnit'),
                peakNote: tStats('hourlyProfilePeakNote'),
                // `t.raw`: the message keeps its `{days}` placeholder and the card fills it in
                // from the profile's own meta. Run through `t` the formatter is handed no `days`
                // argument, throws FORMATTING_ERROR and next-intl returns the key path.
                footnote: tStats.raw('hourlyProfileFootnote') as string,
              }}
            />
          </section>
        )}

        <ParkStatsMethod
          stats={stats}
          profile={profile}
          locale={locale as Locale}
          parkName={parkName}
          articleDe={park.nameArticleDe}
        />

        {/* Where to go next. Three questions this page deliberately does not answer: what the
          queues are doing right now, what a particular date looks like, and what to ride in which
          order. Each already has a page, and this is the only place on the site that arrives at
          them from the historical side. */}
        <section className="mt-8" aria-labelledby="stats-next-heading">
          <ChapterHeading
            icon={ArrowRight}
            title={t('nextTitle')}
            id="stats-next-heading"
            frosted
          />
          <GlassCard variant="tile">
            <ul className="grid gap-4 sm:grid-cols-2">
              <NextStep
                icon={Zap}
                href={parkPath}
                title={t('nextLive', parkPhrases)}
                body={t('nextLiveBody', parkPhrases)}
              />
              <NextStep
                icon={CalendarDays}
                href={parkCalendarPath(locale, continent, country, city, parkSlug)}
                title={t('nextCalendar', parkPhrases)}
                body={t('nextCalendarBody', parkPhrases)}
              />
            </ul>
          </GlassCard>
        </section>
      </ParkPageShell>
    </RouteMessages>
  );
}

/** One card in "where to go next": an icon, the destination, and what it answers. */
function NextStep({
  icon: Icon,
  href,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  href: string;
  title: string;
  body: string;
}) {
  return (
    <li>
      <Link href={href} className="group flex items-start gap-3">
        <Icon className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden={true} />
        <span className="min-w-0">
          <span className="block font-medium group-hover:underline">{title}</span>
          <span className="text-muted-foreground block text-sm leading-relaxed">{body}</span>
        </span>
      </Link>
    </li>
  );
}

/**
 * The lead paragraph: up to three findings from the payload, as sentences with the numbers in
 * them, or the plain description of the page when the aggregate supports none of them.
 *
 * Three independent clauses rather than one templated sentence, because each can be refused on
 * its own. `deriveParkStatsFindings` is the same derivation the cross-park comparison table uses,
 * with the same four refusals — a weekday measured too rarely to stand alone, too few
 * evenly-measured buckets left, a week or a season so flat that three values tie at its extreme,
 * and an extreme that is not actually past the park's own median. A second implementation of that
 * is exactly what the quietest-weekday rule exists to prevent, so this reads its answers rather
 * than computing new ones.
 *
 * Both ties are named where they occur: two quiet weekdays is a finding about the park, not a
 * reason to say nothing.
 */
function buildLead({
  stats,
  locale,
  parkPhrases,
  sentence,
}: {
  stats: Parameters<typeof deriveParkStatsFindings>[0];
  locale: string;
  parkPhrases: ReturnType<typeof parkArgs>;
  sentence: (key: string, values?: Record<string, string | number>) => string;
}): string {
  const findings = deriveParkStatsFindings(stats);
  const parts: string[] = [];

  const monthName = getDateTimeFormat(locale, { month: 'long', timeZone: 'UTC' });
  // A Monday, so adding 0…6 days walks Monday→Sunday. `dayOfWeek` is 0 = Sunday, which is why
  // the offset is `(d - 1 + 7) % 7` — the same arithmetic `ParkStatsSection` sorts its rows by.
  const weekdayName = getDateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' });
  const listFormat = new Intl.ListFormat(locale, { type: 'conjunction' });

  if (findings.busiestMonths.length > 0 && findings.busiestP50 != null) {
    parts.push(
      sentence('leadBusiest', {
        ...parkPhrases,
        // Both ties are named rather than refused, so both messages are plural-aware: German and
        // English read the same either way, Italian and Spanish do not ("il mese è" against "i
        // mesi sono"). ICU ignores an argument a string does not use.
        count: findings.busiestMonths.length,
        months: listFormat.format(
          findings.busiestMonths.map((m) => monthName.format(new Date(Date.UTC(2024, m - 1, 1))))
        ),
        minutes: roundWaitTo5(findings.busiestP50),
      })
    );
  }

  if (findings.quietestDays.length > 0 && findings.quietestP50 != null) {
    parts.push(
      sentence('leadQuietest', {
        count: findings.quietestDays.length,
        days: listFormat.format(
          findings.quietestDays.map((d) =>
            weekdayName.format(new Date(Date.UTC(2024, 0, 1 + ((d - 1 + 7) % 7))))
          )
        ),
        minutes: roundWaitTo5(findings.quietestP50),
      })
    );
  }

  if (findings.longestName && findings.longestP50 != null) {
    parts.push(
      sentence('leadLongest', {
        ride: findings.longestName,
        minutes: roundWaitTo5(findings.longestP50),
      })
    );
  }

  if (parts.length === 0) {
    return sentence('leadFallback', { ...parkPhrases, days: stats?.meta.totalSampleDays ?? 0 });
  }
  return parts.join(' ');
}

/**
 * ISO-8601 interval the aggregate covers: `windowYears` back from today, to today.
 *
 * Read off the payload rather than written down, because the API decides the window and a
 * `Dataset` that claims two years where one was measured is a claim the page cannot honour. UTC
 * throughout so a server in a zone with a midnight DST jump cannot land the interval a day short.
 */
function windowTemporalCoverage(windowYears: number): string {
  const to = new Date();
  const from = new Date(
    Date.UTC(to.getUTCFullYear() - windowYears, to.getUTCMonth(), to.getUTCDate())
  );
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return `${iso(from)}/${iso(to)}`;
}

/**
 * The part of this URL after the park — `/durchschnittliche-wartezeiten` — for the redirects that
 * rebuild it under a park's new geo path. Built from `parkStatsPath` with throwaway geo segments
 * rather than reassembled by hand, so the two can never disagree about how the segment is spelled.
 */
function statsSuffix(locale: string): string {
  const full = parkStatsPath(locale, 'c', 'c', 'c', 'p');
  return full.slice(full.lastIndexOf('/'));
}
