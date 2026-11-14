import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages, isValidLocale, SITE_URL, type Locale } from '@/i18n/config';
import { catchNonFatal } from '@/lib/api/client';
import {
  buildOpenGraphMetadata,
  fitWithin,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
} from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import {
  BreadcrumbStructuredData,
  ParkDatasetStructuredData,
} from '@/components/seo/structured-data';
import { BestTimePage } from '@/components/trip-regions/best-time/best-time-page';
import {
  getTripRegion,
  getTripRegionSchoolBreaks,
  getTripRegionWhen,
} from '@/lib/trip-regions/api';
import { WHEN_HOLIDAY_COUNTRIES } from '@/lib/trip-regions/plan-when';
import { tripRegionToday } from '@/lib/trip-regions/hub-data';
import {
  currentTripRegionMonth,
  tripRegionBestTimePath,
  tripRegionPath,
} from '@/lib/trip-regions/paths';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { liveTripRegion } from '@/lib/trip-regions/registry';
import {
  BEST_TIME_TRIP_DAYS,
  BEST_TIME_WINDOWS,
  REGION_BEST_TIME_PAGE,
  bestTimeParks,
  bestTimeRange,
  bestTimeWhenQuery,
  bestTimeYear,
  parseBestTimePage,
  windowList,
  type BestTimePageId,
} from '@/lib/trip-regions/best-time';
import type { TripWhen, TripWhenWithMonths } from '@/lib/trip-regions/types';

interface BestTimeRouteProps {
  params: Promise<{ locale: string; region: string; resort?: string[] }>;
}

/**
 * Rendered per request behind its hour at the edge (`next.config.ts`): the page names the year
 * the region's today decides, and its figures come from the Data Cache, an hour old at most.
 */
export const dynamic = 'force-dynamic';

/** The region's today, the title's year and the range both routes are asked for. */
function resolve(region: string) {
  const todayIso = tripRegionToday(region, Date.now());
  return { todayIso, year: bestTimeYear(todayIso), range: bestTimeRange(todayIso) };
}

/** The page's figures: the region for its parks, then `/when` for those parks. */
async function loadWhen(slug: string, page: BestTimePageId, range: { from: string; to: string }) {
  const region = await getTripRegion(slug);
  const parks = bestTimeParks(region, page);
  const answer: Partial<TripWhenWithMonths> & TripWhen = await getTripRegionWhen(
    slug,
    bestTimeWhenQuery(region, page, range)
  );
  const when: TripWhenWithMonths = { ...answer, months: answer.months ?? [] };
  return { region, parks, when };
}

/** The live region and the page a request names, or `null` for a 404. */
function pageOf(slug: string, resort: string[] | undefined) {
  const config = liveTripRegion(slug);
  const page = config ? parseBestTimePage(config, resort) : null;
  return config && page ? { config, page } : null;
}

export async function generateMetadata({ params }: BestTimeRouteProps): Promise<Metadata> {
  const { locale, region: slug, resort } = await params;
  const found = pageOf(slug, resort);
  if (!isValidLocale(locale) || !found) return {};
  const { page } = found;
  const [t, tOwn] = await Promise.all([
    getTranslations({ locale, namespace: 'tripBestTime' }),
    getRegionTranslations(slug, 'bestTime', locale),
  ]);
  const { year, range } = resolve(slug);
  const loaded = await catchNonFatal(loadWhen(slug, page, range));
  const windows = loaded?.when.windows.slice(0, BEST_TIME_WINDOWS) ?? [];
  const values = {
    days: BEST_TIME_TRIP_DAYS,
    year,
    parks: tOwn(`resort.${page}`),
    windows: windowList(windows, locale),
  };
  const title = fitWithin(
    MAX_TITLE_LENGTH,
    `${tOwn(`title.${page}`, { year })} | park.fan`,
    tOwn(`title.${page}`, { year })
  );
  const description = fitWithin(
    MAX_DESCRIPTION_LENGTH,
    ...(windows.length
      ? [t('metaDescription', values), t('metaDescriptionShort', values)]
      : [t('metaDescriptionPlain', values)])
  );
  const pathIn = (l: string) => tripRegionBestTimePath(slug, l, page);
  const canonical = `${SITE_URL}/${locale}${pathIn(locale)}`;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}${pathIn(l)}`),
        'x-default': `${SITE_URL}/en${pathIn('en')}`,
      },
    },
    ...buildOpenGraphMetadata({
      title,
      description,
      url: canonical,
      locale,
      ogImageUrl: getOgImageUrl([
        locale,
        slug,
        BEST_TIME_SEGMENTS.en,
        ...(page === REGION_BEST_TIME_PAGE ? [] : [page]),
      ]),
    }),
  };
}

/**
 * A region's best-time pages: when to go to the region as a whole (`/orlando/<best-time segment>`)
 * or to one of its resorts (`…/disney-world`, `…/universal-orlando`), as the region's registry
 * entry lists them. The localized segments are rewritten onto this folder in `next.config.ts`.
 * See docs/features/orlando-best-time.md.
 */
export default async function BestTimeRoute({ params }: BestTimeRouteProps) {
  const { locale, region: slug, resort } = await params;
  const found = pageOf(slug, resort);
  if (!isValidLocale(locale) || !found) notFound();
  const { config, page } = found;
  setRequestLocale(locale);
  const { todayIso, year, range } = resolve(slug);
  const [{ region, parks, when }, schoolBreaks] = await Promise.all([
    loadWhen(slug, page, range),
    catchNonFatal(getTripRegionSchoolBreaks(slug, { ...range, countries: WHEN_HOLIDAY_COUNTRIES })),
  ]);
  const [tOwn, tNav, tHubOwn] = await Promise.all([
    getRegionTranslations(slug, 'bestTime', locale),
    getTranslations({ locale, namespace: 'navigation' }),
    getRegionTranslations(slug, 'hub', locale),
  ]);
  const path = tripRegionBestTimePath(slug, locale, page);
  const hubPath = tripRegionPath(slug, locale);
  const resortName = tOwn(`resort.${page}`);
  const t = await getTranslations({ locale, namespace: 'tripBestTime' });

  return (
    <>
      <BreadcrumbStructuredData
        breadcrumbs={[
          { name: tNav('home'), url: '/' },
          { name: tHubOwn('title'), url: hubPath },
          ...(page === REGION_BEST_TIME_PAGE
            ? []
            : [
                {
                  name: tOwn(`name.${REGION_BEST_TIME_PAGE}`),
                  url: tripRegionBestTimePath(slug, locale),
                },
              ]),
        ]}
        currentPage={{ name: tOwn(`name.${page}`), url: path }}
        locale={locale}
      />
      <ParkDatasetStructuredData
        url={`${SITE_URL}/${locale}${path}`}
        parkUrl={`${SITE_URL}/${locale}${hubPath}`}
        parkName={region.name}
        parkLatitude={config.centre.latitude}
        parkLongitude={config.centre.longitude}
        name={t('dataset.name', { parks: resortName, year })}
        description={t('dataset.description', { parks: resortName, year })}
        temporalCoverage={`${when.meta.from}/${when.meta.to}`}
        variableMeasured={[t('dataset.varWait'), t('dataset.varHigh'), t('dataset.varRain')]}
        locale={locale}
      />
      <BestTimePage
        locale={locale as Locale}
        page={page}
        year={year}
        range={range}
        todayIso={todayIso}
        current={currentTripRegionMonth(slug)}
        region={region}
        parks={parks}
        when={when}
        schoolBreaks={schoolBreaks}
        windows={when.windows.slice(0, BEST_TIME_WINDOWS)}
      />
    </>
  );
}
