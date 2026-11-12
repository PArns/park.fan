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
import { OrlandoHubPage } from '@/components/orlando/hub/orlando-hub-page';
import {
  getOrlandoBestDays,
  getOrlandoCalendar,
  getOrlandoRegion,
  getOrlandoWhen,
} from '@/lib/orlando/api';
import {
  formatHubDate,
  formatHubMonth,
  hubWindow,
  orlandoToday,
  shortGroupName,
} from '@/lib/orlando/hub-data';
import {
  currentOrlandoMonth,
  isSameMonth,
  orlandoMonthRange,
  orlandoPath,
  parseOrlandoMonth,
} from '@/lib/orlando/paths';
import type { OrlandoMonth, TripBestDays, TripRegion } from '@/lib/orlando/types';

/** Orlando's middle, for the Dataset's `spatialCoverage`: between the two resorts. */
const ORLANDO_CENTRE = { latitude: 28.42, longitude: -81.51 };

/** How many windows the best-time teaser asks `/when` for. */
const WHEN_WINDOWS = 3;

interface OrlandoPageProps {
  params: Promise<{ locale: string; date?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Rendered per request behind its edge window (`next.config.ts`), like the park calendar: the
 * page names Orlando's today, and its figures come from the Data Cache, an hour at most.
 */
export const dynamic = 'force-dynamic';

/** The month the URL asks for and the window its figures cover, shared by metadata and page. */
function resolve(date: string[] | undefined) {
  const nowMs = Date.now();
  const todayIso = orlandoToday(nowMs);
  const current = currentOrlandoMonth();
  const parsed = parseOrlandoMonth(date, current);
  if (parsed === 'invalid' || parsed.padded) return null;
  const month = parsed.month;
  const window = month ? hubWindow(todayIso, orlandoMonthRange(month)) : hubWindow(todayIso);
  return { nowMs, todayIso, current, month, window };
}

/** The canonical month: none for the hub and for the current month, whose canonical is the hub. */
function canonicalMonth(month: OrlandoMonth | null, current: OrlandoMonth) {
  return month && !isSameMonth(month, current) ? month : null;
}

/**
 * The verdict the description carries: each resort's quietest date in the window, "Walt Disney
 * World Tue 8 Dec, Universal Orlando Wed 9 Dec". Empty when `/best-days` has none.
 */
function verdict(region: TripRegion | null, bestDays: TripBestDays | null, locale: string) {
  if (!region || !bestDays) return '';
  const parts = bestDays.groups
    .map((g) => {
      const group = region.groups.find((x) => x.key === g.key);
      const first = g.quiet[0];
      return group && first
        ? `${shortGroupName(group.name)} ${formatHubDate(first.date, locale)}`
        : null;
    })
    .filter((p): p is string => p !== null)
    .slice(0, 2);
  return getListFormat(locale, { type: 'conjunction' }).format(parts);
}

export async function generateMetadata({
  params,
  searchParams,
}: OrlandoPageProps): Promise<Metadata> {
  const { locale, date } = await params;
  if (!isValidLocale(locale)) return {};
  const resolved = resolve(date);
  const t = await getTranslations({ locale, namespace: 'orlando' });
  if (!resolved) return { title: t('title'), robots: { index: false } };
  const { month, current, window } = resolved;
  const [region, bestDays] = await Promise.all([
    catchNonFatal(getOrlandoRegion()),
    catchNonFatal(getOrlandoBestDays(window)),
  ]);
  const monthLabel = month ? formatHubMonth(month.year, month.month, locale) : null;
  const found = verdict(region, bestDays, locale);
  const title = monthLabel
    ? fitWithin(
        MAX_TITLE_LENGTH,
        t('metaTitleMonth', { month: monthLabel }),
        t('metaTitleMonthShort', { month: monthLabel })
      )
    : t('metaTitle');
  const description = fitWithin(
    MAX_DESCRIPTION_LENGTH,
    ...(monthLabel
      ? [
          ...(found ? [t('metaDescriptionMonth', { month: monthLabel, verdict: found })] : []),
          t('metaDescriptionMonthPlain', { month: monthLabel }),
        ]
      : [...(found ? [t('metaDescription', { verdict: found })] : []), t('metaDescriptionPlain')])
  );
  const canonicalPath = orlandoPath(canonicalMonth(month, current));
  const canonical = `${SITE_URL}/${locale}${canonicalPath}`;
  // A planner link (`?from=…#planner`) is somebody's trip: the page answers it, an index does not.
  const hasQuery = Object.keys(await searchParams).length > 0;
  return {
    title,
    description,
    ...(hasQuery ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}${canonicalPath}`),
        'x-default': `${SITE_URL}/en${canonicalPath}`,
      },
    },
    ...buildOpenGraphMetadata({
      title,
      description,
      url: canonical,
      locale,
      ogImageUrl: getOgImageUrl([locale, 'orlando']),
    }),
  };
}

/**
 * The Orlando hub (`/orlando`) and its twelve month pages (`/orlando/2026/12`): which park on which
 * day at Walt Disney World, Universal, SeaWorld and the day trips, the best time to go, a planner
 * for the whole trip, and each park's best days. The proxy has already sent out-of-range and
 * padded months on; anything else that is not a month is a 404. See docs/features/orlando-hub.md.
 */
export default async function OrlandoPage({ params }: OrlandoPageProps) {
  const { locale, date } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);
  const resolved = resolve(date);
  if (!resolved) notFound();
  const { nowMs, todayIso, current, month, window } = resolved;

  const [region, calendar, bestDays, when] = await Promise.all([
    getOrlandoRegion(),
    catchNonFatal(getOrlandoCalendar(window)),
    catchNonFatal(getOrlandoBestDays(window)),
    catchNonFatal(getOrlandoWhen({ limit: WHEN_WINDOWS })),
  ]);

  const t = await getTranslations('orlando');
  const tNav = await getTranslations('navigation');
  const monthLabel = month ? formatHubMonth(month.year, month.month, locale) : null;
  const canonicalPath = orlandoPath(canonicalMonth(month, current));
  const canonicalUrl = `${SITE_URL}/${locale}${canonicalPath}`;
  const coverage = calendar
    ? `${calendar.meta.from}/${calendar.meta.to}`
    : `${window.from}/${window.to}`;
  const period = monthLabel ?? t('nextDays');

  return (
    <RouteMessages route="/orlando/[[...date]]">
      <BreadcrumbStructuredData
        breadcrumbs={[
          { name: tNav('home'), url: '/' },
          ...(month ? [{ name: t('title'), url: orlandoPath() }] : []),
        ]}
        currentPage={{
          name: monthLabel ? t('monthTitle', { month: monthLabel }) : t('title'),
          url: orlandoPath(month),
        }}
        locale={locale}
      />
      <ParkDatasetStructuredData
        url={canonicalUrl}
        parkUrl={`${SITE_URL}/${locale}${orlandoPath()}`}
        parkName={region.name}
        parkLatitude={ORLANDO_CENTRE.latitude}
        parkLongitude={ORLANDO_CENTRE.longitude}
        name={t('dataset.name', { period })}
        description={t('dataset.description', { period })}
        temporalCoverage={coverage}
        variableMeasured={[t('dataset.varWait'), t('dataset.varCrowd'), t('dataset.varHours')]}
        locale={locale}
      />
      <OrlandoHubPage
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
