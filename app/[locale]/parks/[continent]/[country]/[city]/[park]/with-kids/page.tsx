import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowRight, CalendarDays, Ruler, Zap } from 'lucide-react';

import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import type { Locale } from '@/i18n/config';
import { Link } from '@/i18n/navigation';
import { RouteMessages } from '@/i18n/route-messages';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';
import { catchNonFatal } from '@/lib/api/client';
import { getParkByGeoPath, getParkSeasons, leanParkForCalendarShell } from '@/lib/api/parks';
import { hasParkStatsPage } from '@/lib/api/stats';
import { kidsPageData } from '@/lib/parks/kids-page';
import { parkCalendarPath } from '@/lib/parks/calendar-segments';
import { parkKidsPath } from '@/lib/parks/kids-segments';
import { getCardObjectPosition, getParkBackgroundImage } from '@/lib/utils/park-assets';
import {
  cityHasOwnPage,
  findParkPageRedirect,
  findRelocatedParkRedirect,
  findRenamedParkRedirect,
} from '@/lib/utils/redirect-utils';
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
import { parkArgs } from '@/lib/i18n/park-phrase';

import {
  BreadcrumbStructuredData,
  ParkSubPageStructuredData,
} from '@/components/seo/structured-data';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { GlassCard } from '@/components/common/glass-card';
import { PlannerPageParkBeacon } from '@/components/planner/planner-page-park-beacon';
import { ParkHeaderCard } from '@/components/parks/park-header-card';
import { ParkKidsTiers } from '@/components/parks/park-kids-tiers';
import { ParkNavTiles } from '@/components/parks/park-nav-tiles';
import { ParkPageShell } from '@/components/parks/park-page-shell';
import { ParkTitleHeader } from '@/components/parks/park-title-header';
import { ParkTodayPanel } from '@/components/parks/park-today-panel';

interface ParkKidsPageProps {
  params: Promise<{
    locale: string;
    continent: string;
    country: string;
    city: string;
    park: string;
  }>;
}

/**
 * ISR with a one-day window, on the terms `average-wait-times` documents: nothing here is live,
 * and the park payload this page reads is data-cached for a day (`getParkByGeoPath`), so a day is
 * the data's own cadence. Both halves are needed, the `revalidate` and the empty
 * `generateStaticParams` under it — see `docs/rules/an-isr-route-needs-both-halves.md`.
 */
export const revalidate = 86400;

/** Empty on purpose: registers the route for ISR without building 192 pages at deploy time. */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: ParkKidsPageProps): Promise<Metadata> {
  const { continent, country, city, park: parkSlug, locale } = await params;
  if (!isServableRoute(locale, continent, country, city, parkSlug)) return {};

  const t = await getTranslations({ locale, namespace: 'parks.kidsPage' });
  const tNotFound = await getTranslations({ locale, namespace: 'seo.notFound' });

  const park = await catchNonFatal(getParkByGeoPath(continent, country, city, parkSlug));
  if (!park) return { title: tNotFound('park') };

  // The gate the page 404s on, asked here so a park below it never gets a title, a canonical or
  // an hreflang set pointing at a page that does not exist.
  const data = kidsPageData(park.attractions ?? []);
  if (!data) return { title: tNotFound('park'), robots: { index: false } };

  const parkName = stripNewPrefix(park.name);
  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  const parkPhrases = parkArgs(locale as Locale, parkName, park.nameArticleDe);

  const title = fitWithin(
    MAX_TITLE_LENGTH,
    t('metaTitle', { park: parkName }),
    t('metaTitleShort', { park: parkName })
  );
  const values = {
    ...parkPhrases,
    withHeight: data.withHeight,
    total: data.total,
    low: data.tiers[0].cm,
  };
  const description = fitWithin(
    MAX_DESCRIPTION_LENGTH,
    t('metaDescription', { ...values, city: cityName }),
    t('metaDescriptionNoCity', values)
  );

  const path = (l: string) => parkKidsPath(l, continent, country, city, parkSlug);
  const canonical = `${SITE_URL}/${locale}${path(locale)}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      // Each locale gets its own segment, the same shape `app/sitemap.ts` writes for these URLs;
      // a page and the sitemap disagreeing about x-default is an hreflang conflict.
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
 * A park's height ladder for parents: which rides a child may take at which height.
 *
 * The park page has the same numbers behind a slider, which is state and not text. This page
 * prints them, one step per height the park posts, so that "phantasialand mit kindern" lands on a
 * page that answers it in the first HTML — see `docs/seo/dedicated-landing-pages.md` §12 and the
 * rule of §2 there: a new park URL earns its place by rendering what no other URL renders.
 *
 * **Gated** on `kidsPageData` (PAR-356, PO decision of 2026-09-29): a park below the line 404s
 * here and is linked from nowhere.
 */
export default async function ParkKidsPage({ params }: ParkKidsPageProps) {
  const { locale, continent, country, city, park: parkSlug } = await params;
  assertServableRoute(locale, continent, country, city, parkSlug);
  setRequestLocale(locale);

  // Not `catchNonFatal`: swallowed, an outage became a `notFound()` this ISR route then stored
  // for a day.
  const parkFull = await getParkByGeoPath(continent, country, city, parkSlug);

  // The same three redirects the park page and the record page run: this URL is reachable
  // directly from search and a stale geo path must transfer rather than 404.
  const suffix = kidsSuffix(locale);
  const malformed = await findParkPageRedirect(continent, country, city, parkSlug);
  if (malformed) permanentRedirect(`/${locale}${malformed}${suffix}`);

  if (!parkFull) {
    const relocated = await findRelocatedParkRedirect(continent, country, city, parkSlug);
    if (relocated) permanentRedirect(`/${locale}${relocated}${suffix}`);
    notFound();
  }

  const renamed = findRenamedParkRedirect(parkFull, { continent, country, city, parkSlug });
  if (renamed) permanentRedirect(`/${locale}${renamed}${suffix}`);

  const data = kidsPageData(parkFull.attractions ?? []);
  if (!data) notFound();

  const [seasons, statsAvailable, t, tGeo, tCommon, tNav] = await Promise.all([
    getParkSeasons(continent, country, city, parkSlug),
    // The tile row is the park's navigation and every page of the park draws the same row, so
    // this page asks the question the park page and the calendar ask. One day-cached entry.
    hasParkStatsPage(continent, country, city, parkSlug),
    getTranslations('parks.kidsPage'),
    getTranslations('geo'),
    getTranslations('common'),
    getTranslations('navigation'),
  ]);

  // The ride list is read above and printed by `ParkKidsTiers`; everything else on the page needs
  // only the twelve fields the calendar shell keeps.
  const park = leanParkForCalendarShell(parkFull);
  const parkName = stripNewPrefix(park.name);
  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  const countryName = translateCountry(tGeo, country, locale, park.country ?? undefined);
  const parkPath = `/parks/${continent}/${country}/${city}/${parkSlug}`;
  const pagePath = parkKidsPath(locale, continent, country, city, parkSlug);
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
  const breadcrumbs = [...parkBreadcrumbs, { name: parkCurrentPage, url: parkPath }];

  const lead = t('lead', {
    ...parkPhrases,
    withHeight: data.withHeight,
    total: data.total,
    steps: data.tiers.length,
  });

  return (
    <RouteMessages route="/parks/[continent]/[country]/[city]/[park]/with-kids">
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
        // Nothing on this page is about the statistics chapter, and the shell's copy is a client
        // fetch of three tables the visitor did not come for.
        hideStats
        head={
          <>
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
              // No cell is this page: it has none of its own in the row, and the row is the
              // park's navigation, not this page's.
              current={null}
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

        <ParkKidsTiers
          data={data}
          locale={locale as Locale}
          parkSlug={parkSlug}
          parkPath={parkPath}
        />

        <section className="mt-8" aria-labelledby="kids-method-heading">
          <ChapterHeading icon={Ruler} title={t('method.title')} id="kids-method-heading" frosted />
          <GlassCard variant="tile">
            <div className="text-muted-foreground max-w-3xl space-y-4 text-sm leading-relaxed">
              <p>{t('method.limits')}</p>
              <p>{t('method.stand')}</p>
            </div>
          </GlassCard>
        </section>

        <section className="mt-8" aria-labelledby="kids-next-heading">
          <ChapterHeading icon={ArrowRight} title={t('nextTitle')} id="kids-next-heading" frosted />
          <GlassCard variant="tile">
            <ul className="grid gap-4 sm:grid-cols-2">
              <NextStep icon={Zap} href={parkPath} title={t('nextPark')} body={t('nextParkBody')} />
              <NextStep
                icon={CalendarDays}
                href={parkCalendarPath(locale, continent, country, city, parkSlug)}
                title={t('nextCalendar')}
                body={t('nextCalendarBody')}
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
 * The part of this URL after the park — `/mit-kindern` — for the redirects that rebuild it under
 * a park's new geo path. Built from `parkKidsPath` with throwaway geo segments so the two can
 * never disagree about how the segment is spelled.
 */
function kidsSuffix(locale: string): string {
  const full = parkKidsPath(locale, 'c', 'c', 'c', 'p');
  return full.slice(full.lastIndexOf('/'));
}
