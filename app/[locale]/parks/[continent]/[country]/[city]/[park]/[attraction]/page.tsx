import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Wrench,
  XCircle,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LocalTime } from '@/components/ui/local-time';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getParkByGeoPath, getAttractionByGeoPath } from '@/lib/api/parks';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import type { Metadata } from 'next';
import type { AttractionStatus, QueueDataItem, StandbyQueue } from '@/lib/api/types';
import { ParkBackground } from '@/components/parks/park-background';
import { FavoriteStar } from '@/components/common/favorite-star';
import { getAttractionBackgroundImage, getParkBackgroundImage } from '@/lib/utils/park-assets';
import {
  AttractionStructuredData,
  BreadcrumbStructuredData,
} from '@/components/seo/structured-data';
import { PageContainer } from '@/components/common/page-container';
import { GlassCard } from '@/components/common/glass-card';
import { StatusInfoCard } from '@/components/common/status-info-card';
import { AttractionCalendar } from '@/components/parks/attraction-calendar';
import { WaitTimeSparkline } from '@/components/parks/wait-time-sparkline';
import { getOgImageUrl } from '@/lib/utils/og-image';

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

  const t = await getTranslations({ locale, namespace: 'seo.attraction' });
  const tImageAlt = await getTranslations({ locale, namespace: 'seo.imageAlt' });

  const ogImageUrl = getOgImageUrl([locale, continent, country, city, parkSlug, attractionSlug]);

  return {
    title: t('titleTemplate', { attraction: attraction.name, park: park?.name || '' }),
    description: t('metaDescriptionTemplate', {
      attraction: attraction.name,
      park: park?.name || '',
    }),
    openGraph: {
      title: attraction.name,
      description: t('metaDescriptionTemplate', {
        attraction: attraction.name,
        park: park?.name || '',
      }),
      locale: locale === 'de' ? 'de_DE' : 'en_US',
      alternateLocale: locale === 'de' ? 'en_US' : 'de_DE',
      url: `https://park.fan/${locale}/parks/${continent}/${country}/${city}/${parkSlug}/${attractionSlug}`,
      siteName: 'park.fan',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: tImageAlt('attraction', {
            attraction: attraction.name,
            park: park?.name || '',
          }),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: attraction.name,
      description: t('metaDescriptionTemplate', {
        attraction: attraction.name,
        park: park?.name || '',
      }),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `/${locale}/parks/${continent}/${country}/${city}/${parkSlug}/${attractionSlug}`,
      languages: {
        en: `/en/parks/${continent}/${country}/${city}/${parkSlug}/${attractionSlug}`,
        de: `/de/parks/${continent}/${country}/${city}/${parkSlug}/${attractionSlug}`,
      },
    },
  };
}

export const revalidate = 300; // 5 minutes

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

  // Fetch park and attraction data
  const [park, attractionData] = await Promise.all([
    getParkByGeoPath(continent, country, city, parkSlug).catch(() => null),
    getAttractionByGeoPath(continent, country, city, parkSlug, attractionSlug).catch(() => null),
  ]);

  // Find attraction in park data and merge with full attraction data (including history)
  const parkAttraction = park?.attractions?.find((a) => a.slug === attractionSlug);

  // Merge history and schedule data from attractionData into parkAttraction
  const attraction = parkAttraction
    ? {
      ...parkAttraction,
      history: attractionData?.history || parkAttraction.history,
      schedule: attractionData?.schedule,
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
  const continentName = tGeo.has(`continents.${continent}`)
    ? tGeo(`continents.${continent}`)
    : continent.charAt(0).toUpperCase() + continent.slice(1).replace(/-/g, ' ');
  const countryName = tGeo.has(`countries.${country}`)
    ? tGeo(`countries.${country}`)
    : park.country || country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');
  const cityName = park.city || city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');

  // Construct breadcrumbs using utility
  const { generateAttractionBreadcrumbs } = await import('@/lib/utils/breadcrumb-utils');
  const tNav = await getTranslations('navigation');
  const breadcrumbs = generateAttractionBreadcrumbs({
    locale: locale as 'en' | 'de',
    continent,
    country,
    city,
    parkSlug,
    continentName,
    countryName,
    cityName,
    parkName: park.name,
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
        description={`${attraction.name} at ${park.name} - Real-time wait times, status, and predictions.`}
      />
      <BreadcrumbStructuredData breadcrumbs={breadcrumbs} />
      <ParkBackground imageSrc={backgroundImage} alt={attraction.name} />
      <PageContainer>
        {/* Breadcrumb */}
        <BreadcrumbNav
          breadcrumbs={breadcrumbs}
          currentPage={attraction.name}
          className="bg-background/60 text-primary w-fit rounded-lg border px-3 py-1 shadow-sm backdrop-blur-md"
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
                  <h1 className="mb-2 text-3xl font-bold md:text-4xl">{attraction.name}</h1>
                  <div className="text-foreground flex flex-wrap items-center gap-3">
                    <Link
                      href={
                        `/parks/${continent}/${country}/${city}/${parkSlug}` as '/parks/europe/germany/rust/europa-park'
                      }
                      className="hover:text-foreground flex items-center gap-1"
                    >
                      <MapPin className="h-4 w-4" />
                      {park.name}
                    </Link>
                    {attraction.land && <Badge variant="outline">{attraction.land}</Badge>}
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Status & Wait Time */}
          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Current Wait Time */}
            <StatusInfoCard
              title={t('waitTime')}
              icon={Clock}
              className="relative min-h-[160px] gap-1 overflow-hidden"
            >
              <div className="relative z-10 pb-12">
                {status === 'OPERATING' &&
                  !isParkClosed &&
                  mainQueue &&
                  'waitTime' in mainQueue &&
                  mainQueue.waitTime !== null ? (
                  <div className="flex flex-row items-center gap-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">
                        {(mainQueue as StandbyQueue).waitTime}
                      </span>
                      <span className="text-muted-foreground text-xl">{tCommon('minutes')}</span>
                    </div>
                    {attraction.trend && (
                      <div
                        className={cn(
                          'text-muted-foreground flex items-center gap-1.5 text-sm font-medium',
                          {
                            'text-emerald-500':
                              attraction.trend.toLowerCase() === 'down' ||
                              attraction.trend.toLowerCase() === 'decreasing',
                            'text-rose-500':
                              attraction.trend.toLowerCase() === 'up' ||
                              attraction.trend.toLowerCase() === 'increasing',
                          }
                        )}
                      >
                        {attraction.trend.toLowerCase() === 'down' ||
                          attraction.trend.toLowerCase() === 'decreasing' ? (
                          <TrendingDown className="h-5 w-5" />
                        ) : attraction.trend.toLowerCase() === 'up' ||
                          attraction.trend.toLowerCase() === 'increasing' ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <Minus className="h-5 w-5" />
                        )}
                        { }
                        <span className="capitalize">
                          {tCommon(attraction.trend.toLowerCase() as string)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-6 w-6 ${config.color}`} />
                    <span className="text-lg font-medium">{config.label}</span>
                  </div>
                )}
              </div>

              {/* Sparkline Background */}
              {status === 'OPERATING' &&
                attraction.statistics?.history &&
                attraction.statistics.history.length > 0 && (
                  <div className="mask-linear-gradient-to-t absolute right-0 bottom-0 left-0 h-16 w-full opacity-30">
                    <WaitTimeSparkline
                      history={attraction.statistics.history}
                      className="text-primary"
                    />
                  </div>
                )}
            </StatusInfoCard>

            {/* Status */}
            <StatusInfoCard title={tCommon('status')} icon={StatusIcon}>
              <Badge
                className={`text-base ${status === 'OPERATING'
                    ? 'bg-status-operating'
                    : status === 'DOWN'
                      ? 'bg-status-down'
                      : status === 'REFURBISHMENT'
                        ? 'bg-status-refurbishment'
                        : 'bg-status-closed'
                  } text-white`}
              >
                <StatusIcon className="mr-1 h-4 w-4" />
                {config.label}
              </Badge>
              {mainQueue?.lastUpdated && (
                <p className="text-muted-foreground mt-2 text-xs">
                  {tCommon('updated')}{' '}
                  <LocalTime time={mainQueue.lastUpdated} timeZone={park.timezone} />
                </p>
              )}
            </StatusInfoCard>

            {/* Prediction Accuracy */}
            {attraction.predictionAccuracy && (
              <StatusInfoCard title={t('predictionAccuracy')} icon={BarChart3}>
                <Badge
                  variant="outline"
                  className={cn('text-base', {
                    'border-red-500 bg-red-500/10 text-red-500':
                      attraction.predictionAccuracy.badge === 'poor',
                    'border-yellow-500 bg-yellow-500/10 text-yellow-500':
                      attraction.predictionAccuracy.badge === 'fair',
                    'border-emerald-500 bg-emerald-500/10 text-emerald-500':
                      attraction.predictionAccuracy.badge === 'good',
                    'border-blue-500 bg-blue-500/10 text-blue-500':
                      attraction.predictionAccuracy.badge === 'excellent',
                  })}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {t(`accuracy.${attraction.predictionAccuracy.badge}` as any)}{' '}
                </Badge>
                <p className="text-muted-foreground mt-2 text-sm">
                  {attraction.predictionAccuracy.message}
                </p>
              </StatusInfoCard>
            )}
          </div>

          <Separator className="my-8" />

          {/* Hourly Forecast */}
          {attraction.hourlyForecast && attraction.hourlyForecast.length > 0 && (
            <section className="mb-8">
              <Card className="p-6">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">{t('predictions')}</h2>

                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {attraction.hourlyForecast.slice(0, 12).map((forecast, i) => (
                      <div
                        key={i}
                        className="bg-muted/50 flex min-w-[80px] flex-col items-center rounded-lg p-3"
                      >
                        <span className="text-muted-foreground text-xs">
                          <LocalTime time={forecast.predictedTime} timeZone={park.timezone} />
                        </span>
                        <span className="mt-1 text-lg font-bold">{forecast.predictedWaitTime}</span>
                        <span className="text-muted-foreground text-xs">{tCommon('minutes')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
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
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {t(`queue.${queue.queueType}` as any)}{' '}
                          </span>
                          <Badge variant="outline">
                            {queue.status === 'OPEN' ||
                              queue.status === 'CLOSED' ||
                              queue.status === 'FINISHED'
                              ? t(`queue.status.${queue.status}` as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                              : queue.status}
                          </Badge>
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
        </article>
      </PageContainer>
    </>
  );
}
