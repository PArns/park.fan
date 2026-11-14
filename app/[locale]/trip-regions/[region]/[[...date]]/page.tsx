import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages, isValidLocale, SITE_URL } from '@/i18n/config';
import { RouteMessages } from '@/i18n/route-messages';
import { catchNonFatal } from '@/lib/api/client';
import {
  buildOpenGraphMetadata,
  fitWithin,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
} from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { getListFormat } from '@/lib/utils/intl-format';
import {
  BreadcrumbStructuredData,
  ParkDatasetStructuredData,
} from '@/components/seo/structured-data';
import { TripRegionHubPage } from '@/components/trip-regions/hub/trip-region-hub-page';
import {
  getTripRegion,
  getTripRegionBestDays,
  getTripRegionCalendar,
  getTripRegionWhen,
} from '@/lib/trip-regions/api';
import {
  formatHubDate,
  formatHubMonth,
  hubWindow,
  shortGroupName,
  tripRegionToday,
  withGroupNames,
} from '@/lib/trip-regions/hub-data';
import {
  bestTimeRange,
  bestTimeWhenQuery,
  REGION_BEST_TIME_PAGE,
} from '@/lib/trip-regions/best-time';
import {
  currentTripRegionMonth,
  isSameMonth,
  parseTripRegionMonth,
  tripMonthRange,
  tripRegionPath,
} from '@/lib/trip-regions/paths';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { liveTripRegion, type TripRegionConfig } from '@/lib/trip-regions/registry';
import type { TripMonth, TripBestDays, TripRegion } from '@/lib/trip-regions/types';

interface TripRegionRouteProps {
  params: Promise<{ locale: string; region: string; date?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Rendered per request behind its edge window (`next.config.ts`), like the park calendar: the
 * page names the region's today, and its figures come from the Data Cache, an hour at most.
 */
export const dynamic = 'force-dynamic';

/** The month the URL asks for and the window its figures cover, shared by metadata and page. */
function resolve(region: string, date: string[] | undefined) {
  const nowMs = Date.now();
  const todayIso = tripRegionToday(region, nowMs);
  const current = currentTripRegionMonth(region);
  const parsed = parseTripRegionMonth(date, current);
  if (parsed === 'invalid' || parsed.padded) return null;
  const month = parsed.month;
  const window = month ? hubWindow(todayIso, tripMonthRange(month)) : hubWindow(todayIso);
  return { nowMs, todayIso, current, month, window };
}

/** The canonical month: none for the hub and for the current month, whose canonical is the hub. */
function canonicalMonth(month: TripMonth | null, current: TripMonth) {
  return month && !isSameMonth(month, current) ? month : null;
}

/**
 * The verdict the description carries: each resort's quietest date in the window, "Disney Tue 8
 * Dec and Universal Wed 9 Dec", a resort named by the region's `resortWords`. Empty when
 * `/best-days` has none.
 */
function verdict(
  config: TripRegionConfig,
  region: TripRegion | null,
  bestDays: TripBestDays | null,
  locale: string
) {
  if (!region || !bestDays) return '';
  // The resorts with headliner parks: a resort whose one park has a figure is no verdict.
  const parts = bestDays.groups
    .filter((g) => region.parks.some((p) => p.group === g.key && p.headliner))
    .map((g) => {
      const group = region.groups.find((x) => x.key === g.key);
      const first = g.quiet[0];
      return group && first
        ? `${config.resortWords[group.key] ?? shortGroupName(group.name)} ${formatHubDate(first.date, locale)}`
        : null;
    })
    .filter((p): p is string => p !== null)
    .slice(0, 2);
  return getListFormat(locale, { type: 'conjunction' }).format(parts);
}

export async function generateMetadata({
  params,
  searchParams,
}: TripRegionRouteProps): Promise<Metadata> {
  const { locale, region: slug, date } = await params;
  const config = liveTripRegion(slug);
  if (!isValidLocale(locale) || !config) return {};
  const resolved = resolve(slug, date);
  const t = await getRegionTranslations(slug, 'hub', locale);
  if (!resolved) return { title: t('title'), robots: { index: false } };
  const { month, current, window } = resolved;
  const [region, bestDays] = await Promise.all([
    catchNonFatal(getTripRegion(slug)),
    catchNonFatal(getTripRegionBestDays(slug, window)),
  ]);
  const monthLabel = month ? formatHubMonth(month.year, month.month, locale) : null;
  const found = verdict(config, region, bestDays, locale);
  const title = monthLabel
    ? fitWithin(
        MAX_TITLE_LENGTH,
        t('metaTitleMonth', { month: monthLabel }),
        t('metaTitleMonthShort', { month: monthLabel })
      )
    : t('metaTitle');
  let description = fitWithin(
    MAX_DESCRIPTION_LENGTH,
    ...(monthLabel
      ? [
          ...(found ? [t('metaDescriptionMonth', { month: monthLabel, verdict: found })] : []),
          t('metaDescriptionMonthPlain', { month: monthLabel }),
        ]
      : [...(found ? [t('metaDescription', { verdict: found })] : []), t('metaDescriptionPlain')])
  );
  const pathIn = (l: string) => tripRegionPath(slug, l, canonicalMonth(month, current));
  const canonicalPath = pathIn(locale);
  const canonical = `${SITE_URL}/${locale}${canonicalPath}`;
  // A German or Dutch date ends in a full stop ("16. Nov."), and so does the sentence around it.
  description = description.replace(/\.\./g, '.');
  // A planner link (`?from=…#planner`) is somebody's trip: the page answers it, an index does not.
  const hasQuery = Object.keys(await searchParams).length > 0;
  return {
    title,
    description,
    ...(hasQuery ? { robots: { index: false, follow: true } } : {}),
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
      ogImageUrl: getOgImageUrl([locale, slug]),
    }),
  };
}

/**
 * A trip region's hub (`/orlando`, `/kalifornien`) and its twelve month pages (`/orlando/2026/12`):
 * which park on which day at each of the region's resorts, the best time to go, a planner for the
 * whole trip, and each park's best days. The localized segments are rewritten onto this folder in
 * `next.config.ts`, the folder itself redirects there, and a region that is not live is a 404. The
 * proxy has already sent out-of-range and padded months on; anything else that is not a month is
 * a 404. See docs/features/trip-regions.md and docs/features/orlando-hub.md.
 */
export default async function TripRegionRoute({ params }: TripRegionRouteProps) {
  const { locale, region: slug, date } = await params;
  const config = liveTripRegion(slug);
  if (!isValidLocale(locale) || !config) notFound();
  setRequestLocale(locale);
  const resolved = resolve(slug, date);
  if (!resolved) notFound();
  const { nowMs, todayIso, current, month, window } = resolved;

  const [t, tRegion] = await Promise.all([
    getTranslations('tripHub'),
    getRegionTranslations(slug, 'hub'),
  ]);
  const [region, calendar, bestDays] = await Promise.all([
    getTripRegion(slug).then((r) => withGroupNames(r, t('dayTripsGroup'))),
    catchNonFatal(getTripRegionCalendar(slug, window)),
    catchNonFatal(getTripRegionBestDays(slug, window)),
  ]);
  // The best-time page's own query for the region's page, so the teaser shows its figures.
  const when = await catchNonFatal(
    getTripRegionWhen(
      slug,
      bestTimeWhenQuery(region, REGION_BEST_TIME_PAGE, bestTimeRange(todayIso))
    )
  );

  const tNav = await getTranslations('navigation');
  const monthLabel = month ? formatHubMonth(month.year, month.month, locale) : null;
  const hubPath = tripRegionPath(slug, locale);
  const canonicalUrl = `${SITE_URL}/${locale}${tripRegionPath(slug, locale, canonicalMonth(month, current))}`;
  const coverage = calendar
    ? `${calendar.meta.from}/${calendar.meta.to}`
    : `${window.from}/${window.to}`;
  const period = monthLabel ?? t('nextDays');

  return (
    <RouteMessages route="/trip-regions/[region]/[[...date]]" region={slug}>
      <BreadcrumbStructuredData
        breadcrumbs={[
          { name: tNav('home'), url: '/' },
          ...(month ? [{ name: tRegion('title'), url: hubPath }] : []),
        ]}
        currentPage={{
          name: monthLabel ? tRegion('monthTitle', { month: monthLabel }) : tRegion('title'),
          url: tripRegionPath(slug, locale, month),
        }}
        locale={locale}
      />
      <ParkDatasetStructuredData
        url={canonicalUrl}
        parkUrl={`${SITE_URL}/${locale}${hubPath}`}
        parkName={region.name}
        parkLatitude={config.centre.latitude}
        parkLongitude={config.centre.longitude}
        name={tRegion('dataset.name', { period })}
        description={tRegion('dataset.description', { period })}
        temporalCoverage={coverage}
        variableMeasured={[t('dataset.varWait'), t('dataset.varCrowd'), t('dataset.varHours')]}
        locale={locale}
      />
      <TripRegionHubPage
        locale={locale}
        month={month}
        current={current}
        region={region}
        calendar={calendar}
        bestDays={bestDays}
        when={when}
        todayIso={todayIso}
        nowMs={nowMs}
      />
    </RouteMessages>
  );
}
