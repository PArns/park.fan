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
import { BestTimePage } from '@/components/orlando/best-time/best-time-page';
import { getOrlandoRegion, getOrlandoSchoolBreaks, getOrlandoWhen } from '@/lib/orlando/api';
import { WHEN_HOLIDAY_COUNTRIES } from '@/lib/orlando/plan-when';
import { orlandoToday } from '@/lib/orlando/hub-data';
import { currentOrlandoMonth, orlandoBestTimePath, orlandoPath } from '@/lib/orlando/paths';
import {
  BEST_TIME_TRIP_DAYS,
  BEST_TIME_WINDOWS,
  bestTimeParks,
  bestTimeRange,
  bestTimeWhenQuery,
  bestTimeResort,
  bestTimeYear,
  parseBestTimePage,
  windowList,
  type OrlandoBestTimePage,
} from '@/lib/orlando/best-time';
import type { TripWhen, TripWhenWithMonths } from '@/lib/orlando/types';

/** Orlando's middle, for the Dataset's `spatialCoverage`, as on the hub. */
const ORLANDO_CENTRE = { latitude: 28.42, longitude: -81.51 };

interface BestTimeRouteProps {
  params: Promise<{ locale: string; resort?: string[] }>;
}

/**
 * Rendered per request behind its hour at the edge (`next.config.ts`): the page names the year
 * Orlando's today decides, and its figures come from the Data Cache, an hour old at most.
 */
export const dynamic = 'force-dynamic';

/** Orlando's today, the title's year and the range both routes are asked for. */
function resolve() {
  const todayIso = orlandoToday(Date.now());
  return { todayIso, year: bestTimeYear(todayIso), range: bestTimeRange(todayIso) };
}

/** The page's figures: the region for its parks, then `/when` for those parks. */
async function loadWhen(page: OrlandoBestTimePage, range: { from: string; to: string }) {
  const region = await getOrlandoRegion();
  const parks = bestTimeParks(region, page);
  const answer: Partial<TripWhenWithMonths> & TripWhen = await getOrlandoWhen(
    bestTimeWhenQuery(region, page, range)
  );
  const when: TripWhenWithMonths = { ...answer, months: answer.months ?? [] };
  return { region, parks, when };
}

const pathOf = (locale: string, page: OrlandoBestTimePage) =>
  orlandoBestTimePath(locale, bestTimeResort(page));

export async function generateMetadata({ params }: BestTimeRouteProps): Promise<Metadata> {
  const { locale, resort } = await params;
  const page = parseBestTimePage(resort);
  if (!isValidLocale(locale) || !page) return {};
  const t = await getTranslations({ locale, namespace: 'orlandoBestTime' });
  const { year, range } = resolve();
  const loaded = await catchNonFatal(loadWhen(page, range));
  const windows = loaded?.when.windows.slice(0, BEST_TIME_WINDOWS) ?? [];
  const values = {
    days: BEST_TIME_TRIP_DAYS,
    year,
    parks: t(`resort.${page}`),
    windows: windowList(windows, locale),
  };
  const title = fitWithin(
    MAX_TITLE_LENGTH,
    `${t(`title.${page}`, { year })} | park.fan`,
    t(`title.${page}`, { year })
  );
  const description = fitWithin(
    MAX_DESCRIPTION_LENGTH,
    ...(windows.length
      ? [t('metaDescription', values), t('metaDescriptionShort', values)]
      : [t('metaDescriptionPlain', values)])
  );
  const path = pathOf(locale, page);
  const canonical = `${SITE_URL}/${locale}${path}`;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}${pathOf(l, page)}`),
        'x-default': `${SITE_URL}/en${pathOf('en', page)}`,
      },
    },
    ...buildOpenGraphMetadata({
      title,
      description,
      url: canonical,
      locale,
      ogImageUrl: getOgImageUrl([
        locale,
        'orlando',
        BEST_TIME_SEGMENTS.en,
        ...(page === 'orlando' ? [] : [page]),
      ]),
    }),
  };
}

/**
 * Orlando's best-time pages: when to go to Disney and Universal together
 * (`/orlando/<best-time segment>`), to Walt Disney World or to Universal Orlando
 * (`…/disney-world`, `…/universal-orlando`). The localized segments are rewritten onto this
 * folder in `next.config.ts`. See docs/features/orlando-best-time.md.
 */
export default async function OrlandoBestTimeRoute({ params }: BestTimeRouteProps) {
  const { locale, resort } = await params;
  const page = parseBestTimePage(resort);
  if (!isValidLocale(locale) || !page) notFound();
  setRequestLocale(locale);
  const { todayIso, year, range } = resolve();
  const [{ region, parks, when }, schoolBreaks] = await Promise.all([
    loadWhen(page, range),
    catchNonFatal(getOrlandoSchoolBreaks({ ...range, countries: WHEN_HOLIDAY_COUNTRIES })),
  ]);
  const [t, tNav, tHub] = await Promise.all([
    getTranslations({ locale, namespace: 'orlandoBestTime' }),
    getTranslations({ locale, namespace: 'navigation' }),
    getTranslations({ locale, namespace: 'orlando' }),
  ]);
  const path = pathOf(locale, page);
  const resortName = t(`resort.${page}`);

  return (
    <>
      <BreadcrumbStructuredData
        breadcrumbs={[
          { name: tNav('home'), url: '/' },
          { name: tHub('title'), url: orlandoPath() },
          ...(page === 'orlando'
            ? []
            : [{ name: t('name.orlando'), url: orlandoBestTimePath(locale) }]),
        ]}
        currentPage={{ name: t(`name.${page}`), url: path }}
        locale={locale}
      />
      <ParkDatasetStructuredData
        url={`${SITE_URL}/${locale}${path}`}
        parkUrl={`${SITE_URL}/${locale}${orlandoPath()}`}
        parkName={region.name}
        parkLatitude={ORLANDO_CENTRE.latitude}
        parkLongitude={ORLANDO_CENTRE.longitude}
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
        current={currentOrlandoMonth()}
        region={region}
        parks={parks}
        when={when}
        schoolBreaks={schoolBreaks}
        windows={when.windows.slice(0, BEST_TIME_WINDOWS)}
      />
    </>
  );
}
