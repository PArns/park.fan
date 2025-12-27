import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { MapPin, TreePalm, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { getCitiesWithParks } from '@/lib/api/discovery';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import type { Metadata } from 'next';

interface CountryPageProps {
  params: Promise<{ locale: string; continent: string; country: string }>;
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { country } = await params;
  const countryName = country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');

  return {
    title: `Theme Parks in ${countryName}`,
    description: `Discover theme parks in ${countryName} with live wait times, crowd predictions, and schedules.`,
  };
}

export const revalidate = 300; // 5 minutes (matches live stats cache)

export default async function CountryPage({ params }: CountryPageProps) {
  const { locale, continent, country } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('geo');
  const tCommon = await getTranslations('common');

  // Fetch cities with full park data and breadcrumbs in a single call
  const response = await getCitiesWithParks(continent, country).catch(() => null);

  if (!response || !response.data || response.data.length === 0) {
    notFound();
  }

  const { data: cities, breadcrumbs } = response;

  // Calculate totals
  const totalParks = cities.reduce((sum, c) => sum + c.parkCount, 0);

  // Get country name from first park or translation
  const countryName = t.has(`countries.${country}`)
    ? t(`countries.${country}`)
    : country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={countryName} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{t('parksIn', { location: countryName })}</h1>
        <p className="text-muted-foreground">
          {t('parkCount', { count: totalParks })} • {cities.length}{' '}
          {cities.length === 1 ? 'city' : 'cities'}
        </p>
      </div>

      {/* Cities with Parks */}
      <div className="space-y-8">
        {cities.map((city) => (
          <div key={city.slug}>
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="text-primary h-5 w-5" />
              <h2 className="text-xl font-semibold">{city.name}</h2>
              <Badge variant="secondary">{t('parkCount', { count: city.parkCount })}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {city.parks.map((park) => (
                <Link
                  key={park.id}
                  href={
                    `/parks/${continent}/${country}/${city.slug}/${park.slug}` as '/parks/europe/germany/rust/europa-park'
                  }
                  className="group"
                >
                  <Card className="hover:border-primary/50 h-full transition-all hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                          <TreePalm className="text-primary h-6 w-6" />
                        </div>
                        {park.status && <ParkStatusBadge status={park.status} />}
                      </div>
                      <h3 className="group-hover:text-primary mb-2 text-lg font-semibold transition-colors">
                        {park.name}
                      </h3>
                      <p className="text-muted-foreground mb-3 text-sm">
                        {city.name}, {countryName}
                      </p>

                      {/* Stats */}
                      {park.analytics?.statistics && park.status === 'OPERATING' ? (
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground hover:text-foreground transition-colors">
                            {park.analytics.statistics.avgWaitTime} {tCommon('minutes')}{' '}
                            {tCommon('avgWait')}
                          </span>
                          <span className="text-muted-foreground hover:text-foreground transition-colors">
                            {park.analytics.statistics.operatingAttractions}/
                            {park.analytics.statistics.totalAttractions} {tCommon('open')}
                          </span>
                        </div>
                      ) : (
                        park.attractionCount > 0 && (
                          <div className="mt-3 flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {park.attractionCount} {tCommon('rides')}
                            </span>
                          </div>
                        )
                      )}

                      {/* Crowd Level */}
                      {park.currentLoad && park.status === 'OPERATING' && (
                        <div className="mt-3">
                          <CrowdLevelBadge level={park.currentLoad.crowdLevel} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
