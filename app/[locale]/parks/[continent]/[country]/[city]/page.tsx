import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { TreePalm, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { getCitiesWithParks } from '@/lib/api/discovery';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import type { Metadata } from 'next';

interface CityPageProps {
  params: Promise<{ locale: string; continent: string; country: string; city: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city, country } = await params;
  const cityName = city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  const countryName = country.charAt(0).toUpperCase() + country.slice(1).replace(/-/g, ' ');

  return {
    title: `Theme Parks in ${cityName}, ${countryName}`,
    description: `Live wait times and crowd levels for theme parks in ${cityName}. Plan your visit with real-time data.`,
  };
}

export const revalidate = 1800; // 30 minutes (matches API cache)

export default async function CityPage({ params }: CityPageProps) {
  const { locale, continent, country, city: citySlug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('geo');
  const tCommon = await getTranslations('common');

  // Fetch cities with parks and breadcrumbs
  const response = await getCitiesWithParks(continent, country).catch(() => null);

  if (!response || !response.data) {
    notFound();
  }

  // Find the specific city we're looking for
  const city = response.data.find((c) => c.slug === citySlug);

  if (!city || city.parks.length === 0) {
    notFound();
  }

  const { parks } = city;
  const { breadcrumbs } = response;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <BreadcrumbNav breadcrumbs={breadcrumbs} currentPage={city.name} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{t('parksIn', { location: city.name })}</h1>
        <p className="text-muted-foreground">{t('parkCount', { count: parks.length })}</p>
      </div>

      {/* Parks Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {parks.map((park) => (
          <Link
            key={park.id}
            href={
              `/parks/${continent}/${country}/${citySlug}/${park.slug}` as '/parks/europe/germany/rust/europa-park'
            }
            className="group"
          >
            <Card className="hover:border-primary/50 h-full transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                    <TreePalm className="text-primary h-6 w-6" />
                  </div>
                  <ParkStatusBadge status={park.status} />
                </div>

                <h2 className="group-hover:text-primary mb-2 text-xl font-semibold transition-colors">
                  {park.name}
                </h2>

                {/* Stats Row */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {park.analytics?.statistics && park.status === 'OPERATING' && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="text-muted-foreground h-4 w-4" />
                        <span>
                          {park.analytics.statistics.avgWaitTime} {tCommon('minutes')}{' '}
                          {tCommon('avgWait')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="text-muted-foreground h-4 w-4" />
                        <span>
                          {park.analytics.statistics.operatingAttractions}/
                          {park.analytics.statistics.totalAttractions} {tCommon('open')}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Crowd Level */}
                {park.currentLoad && park.status === 'OPERATING' && (
                  <div className="mt-4">
                    <CrowdLevelBadge level={park.currentLoad.crowdLevel} />
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
