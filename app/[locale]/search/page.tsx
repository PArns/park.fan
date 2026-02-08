import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, generateAlternateLanguages, localeToOpenGraphLocale } from '@/i18n/config';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { Link } from '@/i18n/navigation';
import { Search, TreePalm, Cog, Utensils, Music, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LocalTime } from '@/components/ui/local-time';
import { search } from '@/lib/api/search';
import { PageContainer } from '@/components/common/page-container';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import type { Metadata } from 'next';
import type { SearchResultItem } from '@/lib/api/types';

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'seo.search' });

  return {
    title: q ? t('titleTemplate', { query: q }) : t('title'),
    description: t('metaDescriptionTemplate'),
    ...(q && {
      robots: { index: false, follow: true },
    }),
    openGraph: {
      title: q ? t('titleTemplate', { query: q }) : t('title'),
      description: t('metaDescriptionTemplate'),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `https://park.fan/${locale}/search${q ? `?q=${encodeURIComponent(q)}` : ''}`,
      siteName: 'park.fan',
      images: [
        {
          url: getOgImageUrl([locale, 'search']),
          width: 1200,
          height: 630,
          alt: q ? t('titleTemplate', { query: q }) : t('title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: q ? t('titleTemplate', { query: q }) : t('title'),
      description: t('metaDescriptionTemplate'),
      images: [getOgImageUrl([locale, 'search'])],
    },
    alternates: {
      canonical: `https://park.fan/${locale}/search${q ? `?q=${encodeURIComponent(q)}` : ''}`,
      languages: {
        ...generateAlternateLanguages(
          (l) => `/${l}/search${q ? `?q=${encodeURIComponent(q)}` : ''}`
        ),
        'x-default': `/en/search${q ? `?q=${encodeURIComponent(q)}` : ''}`,
      },
    },
  };
}

// No caching for search - always fresh results
export const dynamic = 'force-dynamic';

const typeIcons = {
  park: TreePalm,
  attraction: Cog,
  show: Music,
  restaurant: Utensils,
  location: MapPin,
};

const typeLabels = {
  park: 'Park',
  attraction: 'Attraction',
  show: 'Show',
  restaurant: 'Restaurant',
  location: 'Location',
};

import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

function SearchResultCard({ result }: { result: SearchResultItem; locale: string }) {
  const t = useTranslations('common');
  const tGeo = useTranslations('geo');
  const Icon = typeIcons[result.type];

  // Build the link URL
  let href = '/';
  if (result.url) {
    // Use centralized utility for URL conversion
    href = convertApiUrlToFrontendUrl(result.url);
  } else if (result.type === 'park') {
    // Fallback URL construction for parks
    if (result.slug && result.city && result.country) {
      href = `/parks/${result.continent?.toLowerCase() || 'europe'}/${result.country.toLowerCase()}/${result.city.toLowerCase().replace(/\s+/g, '-')}/${result.slug}`;
    } else {
      href = `/search?q=${result.name}`;
    }
  } else if (result.parentPark && result.parentPark.url) {
    // Fallback for attractions/shows/restaurants without explicit URL
    const parkUrl = convertApiUrlToFrontendUrl(result.parentPark.url);

    if (result.type === 'restaurant') {
      href = `${parkUrl}#restaurants`;
    } else if (result.type === 'show') {
      href = `${parkUrl}#shows`;
    } else {
      href = `${parkUrl}/${result.slug}`;
    }
  }

  const backgroundImage = result.type === 'park' ? getParkBackgroundImage(result.slug) : null;
  const isOpen = result.status === 'OPERATING';

  return (
    <Link
      href={href as '/europe'}
      prefetch={result.type === 'location' ? false : result.status === 'OPERATING'}
      className="group block h-full"
    >
      <Card className="hover:border-primary/50 relative h-full overflow-hidden transition-all hover:shadow-md">
        {/* Background Image for Parks */}
        {backgroundImage && (
          <div className="absolute inset-0 z-0">
            <Image
              src={backgroundImage}
              alt={result.name}
              fill
              className="object-cover opacity-40 transition-opacity group-hover:opacity-50"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="from-background/90 via-background/40 to-background/30 absolute inset-0 bg-gradient-to-t" />
          </div>
        )}

        <CardContent className="relative z-10 p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg backdrop-blur-sm">
                <Icon className="text-primary h-4 w-4" />
              </div>
              <Badge variant="secondary" className="bg-background/50 text-xs backdrop-blur-sm">
                {typeLabels[result.type]}
              </Badge>
            </div>
            {result.status && (
              <Badge
                variant="outline"
                className={`text-xs ${
                  isOpen
                    ? 'border-status-operating text-status-operating'
                    : 'border-status-closed text-status-closed'
                }`}
              >
                {isOpen ? t('open') : t('closed')}
              </Badge>
            )}
          </div>

          <h3 className="group-hover:text-primary mb-1 font-semibold transition-colors">
            {result.name}
          </h3>

          {/* Location */}
          {(result.city || result.country) && (
            <p className="text-muted-foreground mb-2 flex items-center gap-1 text-sm">
              <MapPin className="h-3 w-3" />
              {[
                result.city,
                result.country
                  ? tGeo(`countries.${result.country.toLowerCase().replace(/\s+/g, '-')}`) ||
                    result.country
                  : null,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}

          {/* Parent Park (for attractions) */}
          {result.parentPark && (
            <p className="text-muted-foreground mb-2 text-sm">
              {t('at', { park: result.parentPark.name })}
            </p>
          )}

          {/* Wait Time (for attractions) */}
          {result.type === 'attraction' && result.waitTime !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3" />
              <span className="font-medium">
                {result.waitTime} {t('minutes')}
              </span>
            </div>
          )}

          {/* Park Hours */}
          {result.type === 'park' && result.parkHours && (
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3" />
              <span>
                <LocalTime time={result.parkHours.open} /> -{' '}
                <LocalTime time={result.parkHours.close} />
              </span>
            </div>
          )}

          {/* Show Times */}
          {result.type === 'show' && result.showTimes && result.showTimes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {result.showTimes.slice(0, 3).map((time, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  <LocalTime time={time} />
                </Badge>
              ))}
              {result.showTimes.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{result.showTimes.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const { q: query } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations('common');

  // Perform search if query is provided
  let results = null;
  if (query && query.length >= 2) {
    results = await search(query).catch(() => null);
  }

  return (
    <PageContainer>
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">{t('search')}</h1>

        {/* Search Form */}
        <form action="" method="get" className="relative max-w-xl">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
          <Input
            type="search"
            name="q"
            defaultValue={query || ''}
            placeholder={t('searchPlaceholder')}
            className="pl-10 text-lg"
            autoFocus
          />
        </form>
      </div>

      {/* Results */}
      {query && query.length >= 2 && (
        <>
          {results ? (
            <>
              {/* Result Counts */}
              <div className="mb-6 flex flex-wrap gap-4">
                {Object.entries(results.counts).map(([type, count]) => (
                  <Badge key={type} variant="secondary">
                    {typeLabels[type as keyof typeof typeLabels]}: {count.total}
                  </Badge>
                ))}
              </div>

              {/* Results Grid */}
              {results.results.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {results.results.map((result) => (
                    <SearchResultCard key={result.id} result={result} locale={locale} />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground text-lg">{t('noResults')}</p>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-lg">{t('error')}</p>
            </div>
          )}
        </>
      )}

      {/* Initial State */}
      {(!query || query.length < 2) && (
        <div className="py-12 text-center">
          <Search className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <p className="text-muted-foreground text-lg">Enter at least 2 characters to search</p>
        </div>
      )}
    </PageContainer>
  );
}
