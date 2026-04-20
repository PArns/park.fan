import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { translateCountry, translateContinent } from '@/lib/i18n/helpers';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Clock, MapPin, AlertTriangle, Wrench, XCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LocalTime } from '@/components/ui/local-time';
import { Badge } from '@/components/ui/badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { SeasonalBadge } from '@/components/parks/seasonal-badge';
import { Separator } from '@/components/ui/separator';
import { getParkByGeoPath, getAttractionByGeoPath } from '@/lib/api/parks';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import type { Metadata } from 'next';
import type {
  AttractionStatus,
  QueueDataItem,
  QueueType,
  QueueStatus,
  AccuracyBadge,
  StandbyQueue,
} from '@/lib/api/types';

// Typed lookup maps — avoid `as any` when translating dynamic enum values
const QUEUE_TYPE_KEYS = {
  STANDBY: 'queue.STANDBY',
  SINGLE_RIDER: 'queue.SINGLE_RIDER',
  RETURN_TIME: 'queue.RETURN_TIME',
  PAID_RETURN_TIME: 'queue.PAID_RETURN_TIME',
  BOARDING_GROUP: 'queue.BOARDING_GROUP',
  PAID_STANDBY: 'queue.PAID_STANDBY',
} as const satisfies Record<QueueType, string>;

/** Maps API queue types to their glossary term IDs for tooltip linking. */
const QUEUE_TYPE_TERM: Partial<Record<QueueType, string>> = {
  SINGLE_RIDER: 'single-rider',
  RETURN_TIME: 'virtual-queue',
  PAID_RETURN_TIME: 'lightning-lane',
  PAID_STANDBY: 'express-pass',
  BOARDING_GROUP: 'boarding-group',
};

const QUEUE_STATUS_KEYS = {
  OPERATING: 'queue.status.OPERATING',
  DOWN: 'queue.status.DOWN',
  CLOSED: 'queue.status.CLOSED',
  REFURBISHMENT: 'queue.status.REFURBISHMENT',
} as const satisfies Record<QueueStatus, string>;

const ACCURACY_BADGE_KEYS = {
  excellent: 'accuracy.excellent',
  good: 'accuracy.good',
  fair: 'accuracy.fair',
  poor: 'accuracy.poor',
  insufficient_data: 'accuracy.insufficient_data',
} as const satisfies Record<AccuracyBadge, string>;

const ACCURACY_BORDER: Record<AccuracyBadge, string> = {
  excellent: 'border-status-operating/40',
  good: 'border-status-operating/40',
  fair: 'border-status-down/40',
  poor: 'border-destructive/40',
  insufficient_data: 'border-border',
};
import { ParkBackground } from '@/components/parks/park-background';
import { FavoriteStar } from '@/components/common/favorite-star';
import { getAttractionBackgroundImage, getParkBackgroundImage } from '@/lib/utils/park-assets';
import {
  AttractionStructuredData,
  BreadcrumbStructuredData,
} from '@/components/seo/structured-data';
import { AttractionFAQStructuredData } from '@/components/seo/attraction-faq-structured-data';
import { AttractionFAQSection } from '@/components/faq/attraction-faq-section';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { PageContainer } from '@/components/common/page-container';
import { GlassCard } from '@/components/common/glass-card';
import { StatusInfoCard } from '@/components/common/status-info-card';
import { AttractionCalendar } from '@/components/parks/attraction-calendar';
import { DailyWaitTimeChartServer } from '@/components/parks/daily-wait-time-chart-server';
import { WaitTimeInfoCard } from '@/components/parks/wait-time-info-card';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { generateAttractionBreadcrumbs } from '@/lib/utils/breadcrumb-utils';
import { stripNewPrefix } from '@/lib/utils';

interface AttractionPageProps {
  params: Promise<{
    locale: string;
    continent: string;
    country: string;
    city: string;
    park: string;
    attraction: string;
  }>;
}

export async function generateMetadata({ params }: AttractionPageProps): Promise<Metadata> {
  const {
    continent,
    country,
    city,
    park: parkSlug,
    attraction: attractionSlug,
    locale,
  } = await params;

  const park = await getParkByGeoPath(continent, country, city, parkSlug).catch(() => null);
  const attraction = park?.attractions?.find((a) => a.slug === attractionSlug);

  if (!attraction) {
    const tNotFound = await getTranslations({ locale, namespace: 'seo.notFound' });
    return { title: tNotFound('attraction') };
  }

  // Numbered-suffix slugs (e.g. playground-2, behind-the-seams-3) are backend
  // duplicates of the base attraction. Mark them noindex and point canonical at
  // the base slug so Google consolidates signals on the primary page.
  const isVariantSlug = /^.+-\d+$/.test(attractionSlug);
  const baseSlug = isVariantSlug ? attractionSlug.replace(/-\d+$/, '') : attractionSlug;
  const canonicalAttractionSlug = park?.attractions?.some((a) => a.slug === baseSlug)
    ? baseSlug
    : attractionSlug;
  // Only noindex when we actually resolved a different canonical — avoids
  // incorrectly noindexing legitimate slugs like "area-51" or "coaster-360".
  const isDeduplicatedVariant = isVariantSlug && canonicalAttractionSlug !== attractionSlug;

  const t = await getTranslations({ locale, namespace: 'seo.attraction' });
  const tGlobal = await getTranslations({ locale, namespace: 'seo.global' });
  const tImageAlt = await getTranslations({ locale, namespace: 'seo.imageAlt' });

  const ogImageUrl = getOgImageUrl([locale, continent, country, city, parkSlug, attractionSlug]);
  const attractionName = stripNewPrefix(attraction.name);
  const parkName = stripNewPrefix(park?.name || '');

  const cityName = park?.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');

  const keywords = [
    attractionName,
    `${attractionName} wait times`,
    parkName,
    `${parkName} ${cityName}`,
    cityName,
    tGlobal('keywords'),
  ]
    .filter(Boolean)
    .join(', ');

  return {
    title: t('titleTemplate', {
      attraction: attractionName,
      park: parkName,
      city: cityName,
    }),
    description: t('metaDescriptionTemplate', {
      attraction: attractionName,
      park: parkName,
      city: cityName,
    }),
    keywords,
    ...(isDeduplicatedVariant && { robots: { index: false, follow: true } }),
    ...buildOpenGraphMetadata({
      locale,
      title: t('titleTemplate', {
        attraction: attractionName,
        park: parkName,
        city: cityName,
      }),
      description: t('metaDescriptionTemplate', {
        attraction: attractionName,
        park: parkName,
        city: cityName,
      }),
      url: `https://park.fan/${locale}/parks/${continent}/${country}/${city}/${parkSlug}/${canonicalAttractionSlug}`,
      ogImageUrl,
      imageAlt: tImageAlt('attraction', {
        attraction: attractionName,
        park: parkName,
      }),
    }),
    alternates: {
      canonical: `https://park.fan/${locale}/parks/${continent}/${country}/${city}/${parkSlug}/${canonicalAttractionSlug}`,
      languages: {
        ...generateAlternateLanguages(
          (l) =>
            `/${l}/parks/${continent}/${country}/${city}/${parkSlug}/${canonicalAttractionSlug}`
        ),
        'x-default': `https://park.fan/en/parks/${continent}/${country}/${city}/${parkSlug}/${canonicalAttractionSlug}`,
      },
    },
  };
}

export const revalidate = 3600; // 1 hour — live data via React Query on client

// Status config will be created inside the component to use translations

function getMainQueue(queues?: QueueDataItem[]): QueueDataItem | null {
  if (!queues || queues.length === 0) return null;
  return queues.find((q) => q.queueType === 'STANDBY') || queues[0];
}

export default async function AttractionPage({ params }: AttractionPageProps) {
  const {
    locale,
    continent,
    country,
    city,
    park: parkSlug,
    attraction: attractionSlug,
  } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('attractions');
  const tCommon = await getTranslations('common');
  const tGeo = await getTranslations('geo');
  const tSeo = await getTranslations('seo.attraction');

  // Fetch park and attraction data
  const [park, attractionData] = await Promise.all([
    getParkByGeoPath(continent, country, city, parkSlug).catch(() => null),
    getAttractionByGeoPath(continent, country, city, parkSlug, attractionSlug).catch(() => null),
  ]);

  // Find attraction in park data and merge with full attraction data (including history)
  const parkAttraction = park?.attractions?.find((a) => a.slug === attractionSlug);

  // Merge history, schedule and forecast data from attractionData into parkAttraction
  const attraction = parkAttraction
    ? {
        ...parkAttraction,
        history: attractionData?.history || parkAttraction.history,
        schedule: attractionData?.schedule,
        hourlyForecast: attractionData?.hourlyForecast,
        predictionAccuracy: attractionData?.predictionAccuracy,
        statistics: attractionData?.statistics || parkAttraction.statistics,
        bestVisitTimes: attractionData?.bestVisitTimes ?? parkAttraction.bestVisitTimes,
      }
    : null;

  if (!park || !attraction) {
    notFound();
  }

  // Get queue data
  const mainQueue = getMainQueue(attraction.queues);
  // Force closed status if park is not operating
  const isParkClosed = park.status !== 'OPERATING';
  const status = isParkClosed ? 'CLOSED' : mainQueue?.status || attraction.status || 'CLOSED';

  // Calculate min/max from raw history (same source as sparkline)
  const history = attraction.statistics?.history;
  const calculatedMinWaitToday = history?.length
    ? Math.min(...history.map((h) => h.waitTime))
    : null;
  const calculatedMaxWaitToday = history?.length
    ? Math.max(...history.map((h) => h.waitTime))
    : null;

  // Create status config with translations
  const statusConfig: Record<
    AttractionStatus,
    { icon: typeof Clock; color: string; label: string }
  > = {
    OPERATING: { icon: Clock, color: 'text-status-operating', label: t('status.operating') },
    DOWN: { icon: AlertTriangle, color: 'text-status-down', label: t('status.down') },
    CLOSED: { icon: XCircle, color: 'text-status-closed', label: t('status.closed') },
    REFURBISHMENT: {
      icon: Wrench,
      color: 'text-status-refurbishment',
      label: t('status.refurbishment'),
    },
  };
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  // Format names - use actual names from park data (proper umlauts)
  const continentName = translateContinent(tGeo, continent, locale);
  const countryName = translateCountry(tGeo, country, locale, park.country ?? undefined);
  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  const attractionName = stripNewPrefix(attraction.name);
  const parkName = stripNewPrefix(park.name);

  // Construct breadcrumbs using utility
  const tNav = await getTranslations('navigation');
  const { breadcrumbs, currentPage: attractionCurrentPage } = generateAttractionBreadcrumbs({
    continent,
    country,
    city,
    parkSlug,
    continentName,
    countryName,
    cityName,
    parkName,
    attractionName,
    homeLabel: tCommon('home'),
    continentsLabel: tNav('continents'),
  });

  const attractionUrl = `https://park.fan/${locale}/parks/${continent}/${country}/${city}/${parkSlug}/${attractionSlug}`;

  // Get background image with fallback: attraction → park → null
  const backgroundImage =
    getAttractionBackgroundImage(parkSlug, attractionSlug) ?? getParkBackgroundImage(parkSlug);

  return (
    <>
      <AttractionStructuredData
        attraction={attraction}
        park={park}
        url={attractionUrl}
        locale={locale}
        description={tSeo('metaDescriptionTemplate', {
          attraction: attractionName,
          park: parkName,
          city: cityName,
        })}
      />
      <AttractionFAQStructuredData attraction={attraction} park={park} locale={locale} />
      <BreadcrumbStructuredData breadcrumbs={breadcrumbs} locale={locale} />
      <ParkBackground imageSrc={backgroundImage} alt={attractionName} />
      <PageContainer>
        {/* Breadcrumb */}
        <BreadcrumbNav
          breadcrumbs={breadcrumbs}
          currentPage={attractionCurrentPage}
          pinLastBreadcrumb
        />

        <article itemScope itemType="https://schema.org/TouristAttraction">
          {/* Header */}
          <div className="mb-8">
            <GlassCard variant="medium" className="relative">
              {/* Favorite Star */}
              {attraction.id && (
                <div className="absolute top-4 right-4 z-20 flex items-center justify-center">
                  <FavoriteStar type="attraction" id={attraction.id} size="lg" />
                </div>
              )}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex flex-wrap items-baseline">
                    <h1 className="text-3xl font-bold md:text-4xl">{attractionName}</h1>
                    <span className="text-muted-foreground ml-2 text-xl font-normal md:text-2xl">
                      – {t('h1Suffix')}
                    </span>
                  </div>
                  <div className="text-foreground flex flex-wrap items-center gap-3">
                    <Link
                      href={
                        `/parks/${continent}/${country}/${city}/${parkSlug}` as '/parks/europe/germany/rust/europa-park'
                      }
                      prefetch={park.status === 'OPERATING'}
                      className="hover:text-foreground flex items-center gap-1"
                    >
                      <MapPin className="h-4 w-4" />
                      {parkName}
                    </Link>
                    {attraction.land && <Badge variant="outline">{attraction.land}</Badge>}
                    {attraction.isSeasonal && (
                      <SeasonalBadge
                        seasonMonths={attraction.seasonMonths}
                        isCurrentlyInSeason={attraction.isCurrentlyInSeason}
                      />
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Status & Wait Time */}
          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Current Wait Time */}
            <WaitTimeInfoCard
              waitTime={
                status === 'OPERATING' && !isParkClosed && mainQueue && 'waitTime' in mainQueue
                  ? ((mainQueue as StandbyQueue).waitTime ?? null)
                  : null
              }
              trend={attraction.trend ?? undefined}
              minWaitToday={calculatedMinWaitToday}
              maxWaitToday={calculatedMaxWaitToday}
              sparklineHistory={attraction.statistics?.history}
              timezone={park.timezone}
              statusIcon={StatusIcon}
              statusLabel={config.label}
              labels={{
                title: t('waitTime'),
                minutes: tCommon('minutes'),
                todayMin: t('todayChart.todayMin'),
                todayMax: t('todayChart.todayMax'),
                min: t('todayChart.min'),
                trendLabel: attraction.trend
                  ? tCommon(attraction.trend.toLowerCase() as string)
                  : undefined,
              }}
            />

            {/* Status */}
            <StatusInfoCard title={tCommon('status')} icon={StatusIcon} className="gap-3">
              <ParkStatusBadge status={status} className="text-base" />
              {mainQueue?.lastUpdated && (
                <p className="text-muted-foreground mt-2 text-xs">
                  {tCommon('updated')}{' '}
                  <LocalTime time={mainQueue.lastUpdated} timeZone={park.timezone} />
                </p>
              )}
            </StatusInfoCard>

            {/* Prediction Accuracy */}
            {attraction.predictionAccuracy && (
              <StatusInfoCard
                title={t('predictionAccuracy')}
                icon={BarChart3}
                className={cn(
                  'gap-3 border-2',
                  ACCURACY_BORDER[attraction.predictionAccuracy.badge]
                )}
              >
                <Badge
                  className={cn('text-base', {
                    'bg-destructive/15 text-destructive':
                      attraction.predictionAccuracy.badge === 'poor',
                    'bg-status-down/15 text-status-down':
                      attraction.predictionAccuracy.badge === 'fair',
                    'bg-status-operating/15 text-status-operating':
                      attraction.predictionAccuracy.badge === 'good' ||
                      attraction.predictionAccuracy.badge === 'excellent',
                  })}
                >
                  {t(ACCURACY_BADGE_KEYS[attraction.predictionAccuracy.badge])}{' '}
                </Badge>
                <p className="text-muted-foreground mt-2 text-sm">
                  {attraction.predictionAccuracy.message}
                </p>
              </StatusInfoCard>
            )}
          </div>

          <Separator className="my-8" />

          {/* Daily Wait Time Chart */}
          {(attraction.hourlyForecast?.length || attraction.history?.length) && (
            <section className="mb-8">
              <DailyWaitTimeChartServer
                history={attraction.history}
                hourlyForecast={attraction.hourlyForecast}
                timezone={park.timezone}
                schedule={attraction.schedule}
                bestVisitTimes={attraction.bestVisitTimes}
              />
            </section>
          )}

          {/* Other Queue Types */}
          {attraction.queues && attraction.queues.length > 1 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">{t('otherQueues')}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {attraction.queues
                  .filter((q) => q.queueType !== 'STANDBY')
                  .map((queue, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium">
                            {QUEUE_TYPE_TERM[queue.queueType] ? (
                              <GlossaryTermLink termId={QUEUE_TYPE_TERM[queue.queueType]!}>
                                {t(QUEUE_TYPE_KEYS[queue.queueType])}
                              </GlossaryTermLink>
                            ) : (
                              t(QUEUE_TYPE_KEYS[queue.queueType])
                            )}{' '}
                          </span>
                          <Badge variant="outline">{t(QUEUE_STATUS_KEYS[queue.status])}</Badge>
                        </div>
                        {'waitTime' in queue && queue.waitTime !== null && (
                          <p className="text-2xl font-bold">
                            {queue.waitTime}{' '}
                            <span className="text-muted-foreground text-sm">min</span>
                          </p>
                        )}
                        {'returnStart' in queue &&
                          queue.returnStart &&
                          'returnEnd' in queue &&
                          queue.returnEnd && (
                            <p className="text-muted-foreground text-sm">
                              {t('returnTime')}:{' '}
                              <LocalTime time={queue.returnStart || ''} timeZone={park.timezone} />{' '}
                              - <LocalTime time={queue.returnEnd || ''} timeZone={park.timezone} />
                            </p>
                          )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </section>
          )}

          {/* History Calendar */}
          <section className="mb-8">
            <AttractionCalendar attraction={attraction} park={park} />
          </section>

          {/* FAQ Section */}
          <Separator className="my-8" />
          <AttractionFAQSection attraction={attraction} park={park} />
        </article>
      </PageContainer>
    </>
  );
}
