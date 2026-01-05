import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Clock, TrendingUp, AlertTriangle, Wrench, XCircle, MapPin, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocalTime } from '@/components/ui/local-time';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getParkByGeoPath } from '@/lib/api/parks';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import type { Metadata } from 'next';
import type { AttractionStatus, QueueDataItem, Breadcrumb, StandbyQueue } from '@/lib/api/types';
import { ParkBackground } from '@/components/parks/park-background';
import { getAttractionBackgroundImage } from '@/lib/utils/park-assets';

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
    return { title: 'Attraction Not Found' };
  }

  const t = await getTranslations({ locale, namespace: 'seo.attraction' });

  return {
    title: t('titleTemplate', { attraction: attraction.name, park: park?.name || '' }),
    description: t('metaDescriptionTemplate', {
      attraction: attraction.name,
      park: park?.name || '',
    }),
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

const statusConfig: Record<AttractionStatus, { icon: typeof Clock; color: string; label: string }> =
  {
    OPERATING: { icon: Clock, color: 'text-status-operating', label: 'Operating' },
    DOWN: { icon: AlertTriangle, color: 'text-status-down', label: 'Temporarily Down' },
    CLOSED: { icon: XCircle, color: 'text-status-closed', label: 'Closed' },
    REFURBISHMENT: {
      icon: Wrench,
      color: 'text-status-refurbishment',
      label: 'Under Refurbishment',
    },
  };

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

  // Fetch park and find attraction
  const park = await getParkByGeoPath(continent, country, city, parkSlug).catch(() => null);
  const attraction = park?.attractions?.find((a) => a.slug === attractionSlug);

  if (!park || !attraction) {
    notFound();
  }

  // Get queue data
  const mainQueue = getMainQueue(attraction.queues);
  // Force closed status if park is not operating
  const isParkClosed = park.status !== 'OPERATING';
  const status = isParkClosed ? 'CLOSED' : mainQueue?.status || attraction.status || 'CLOSED';
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

  // Construct breadcrumbs manually
  const breadcrumbs: Breadcrumb[] = [
    { name: tCommon('home'), url: '/' },
    { name: continentName, url: `/parks/${continent}` },
    { name: countryName, url: `/parks/${continent}/${country}` },
    { name: cityName, url: `/parks/${continent}/${country}/${city}` },
    { name: park.name, url: `/parks/${continent}/${country}/${city}/${parkSlug}` },
  ];

  return (
    <>
      <ParkBackground
        imageSrc={getAttractionBackgroundImage(parkSlug, attractionSlug)}
        alt={attraction.name}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <BreadcrumbNav
          breadcrumbs={breadcrumbs}
          currentPage={attraction.name}
          className="bg-background/60 w-fit rounded-lg border px-3 py-1 shadow-sm backdrop-blur-md"
        />

        {/* Header */}
        <div className="mb-8">
          <div className="bg-background/60 rounded-xl border p-6 shadow-sm backdrop-blur-md">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="mb-2 text-3xl font-bold md:text-4xl">{attraction.name}</h1>
                <div className="text-muted-foreground flex flex-wrap items-center gap-3">
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
          </div>
        </div>

        {/* Status & Wait Time */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Current Wait Time */}
          <Card className="bg-background/60 border-primary/10 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                {t('waitTime')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status === 'OPERATING' &&
              !isParkClosed &&
              mainQueue &&
              'waitTime' in mainQueue &&
              mainQueue.waitTime !== null ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{(mainQueue as StandbyQueue).waitTime}</span>
                  <span className="text-muted-foreground text-xl">{tCommon('minutes')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-6 w-6 ${config.color}`} />
                  <span className="text-lg font-medium">{config.label}</span>
                </div>
              )}
              {attraction.trend && (
                <div className="text-muted-foreground mt-2 flex items-center gap-1 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span className="capitalize">{attraction.trend}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="bg-background/60 border-primary/10 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                className={`text-base ${
                  status === 'OPERATING'
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
            </CardContent>
          </Card>

          {/* Prediction Accuracy */}
          {attraction.predictionAccuracy && (
            <Card className="bg-background/60 border-primary/10 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" />
                  Prediction Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant="outline"
                  className={`text-base ${
                    attraction.predictionAccuracy.badge === 'excellent'
                      ? 'border-crowd-very-low text-crowd-very-low'
                      : attraction.predictionAccuracy.badge === 'good'
                        ? 'border-crowd-low text-crowd-low'
                        : attraction.predictionAccuracy.badge === 'fair'
                          ? 'border-crowd-moderate text-crowd-moderate'
                          : 'border-muted-foreground'
                  }`}
                >
                  {attraction.predictionAccuracy.badge}
                </Badge>
                <p className="text-muted-foreground mt-2 text-sm">
                  {attraction.predictionAccuracy.message}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="my-8" />

        {/* Hourly Forecast */}
        {attraction.hourlyForecast && attraction.hourlyForecast.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">{t('predictions')}</h2>
            <Card>
              <CardContent className="p-4">
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
              </CardContent>
            </Card>
          </section>
        )}

        {/* Other Queue Types */}
        {attraction.queues && attraction.queues.length > 1 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold">Other Queue Options</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {attraction.queues
                .filter((q) => q.queueType !== 'STANDBY')
                .map((queue, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">
                          {queue.queueType.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        <Badge variant="outline">{queue.status}</Badge>
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
                            <LocalTime time={queue.returnStart || ''} timeZone={park.timezone} /> -{' '}
                            <LocalTime time={queue.returnEnd || ''} timeZone={park.timezone} />
                          </p>
                        )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
