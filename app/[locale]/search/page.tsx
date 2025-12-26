import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Search, TreePalm, Cog, Utensils, Music, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { search } from '@/lib/api/search';
import type { Metadata } from 'next';
import type { SearchResultItem } from '@/lib/api/types';

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : 'Search',
    description: 'Search theme parks, attractions, shows, and restaurants worldwide.',
  };
}

// No caching for search - always fresh results
export const dynamic = 'force-dynamic';

const typeIcons = {
  park: TreePalm,
  attraction: Cog,
  show: Music,
  restaurant: Utensils,
};

const typeLabels = {
  park: 'Park',
  attraction: 'Attraction',
  show: 'Show',
  restaurant: 'Restaurant',
};

function SearchResultCard({ result, locale }: { result: SearchResultItem; locale: string }) {
  const Icon = typeIcons[result.type];

  // Build the link URL
  let href = '/';
  if (result.url) {
    href = result.url;
  } else if (result.type === 'park') {
    href = `/search`; // Fallback if no URL
  }

  return (
    <Link href={href as '/europe'} className="group">
      <Card className="hover:border-primary/50 h-full transition-all hover:shadow-md">
        <CardContent className="p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <Icon className="text-primary h-4 w-4" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {typeLabels[result.type]}
              </Badge>
            </div>
            {result.status && (
              <Badge
                variant="outline"
                className={
                  result.status === 'OPERATING'
                    ? 'border-status-operating text-status-operating'
                    : 'border-status-closed text-status-closed'
                }
              >
                {result.status === 'OPERATING' ? 'Open' : 'Closed'}
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
              {[result.city, result.country].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Parent Park (for attractions) */}
          {result.parentPark && (
            <p className="text-muted-foreground mb-2 text-sm">at {result.parentPark.name}</p>
          )}

          {/* Wait Time (for attractions) */}
          {result.type === 'attraction' && result.waitTime !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3" />
              <span className="font-medium">{result.waitTime} min</span>
            </div>
          )}

          {/* Park Hours */}
          {result.type === 'park' && result.parkHours && (
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3" />
              <span>
                {new Date(result.parkHours.open).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {new Date(result.parkHours.close).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {/* Show Times */}
          {result.type === 'show' && result.showTimes && result.showTimes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {result.showTimes.slice(0, 3).map((time, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {new Date(time).toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
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
    <div className="container mx-auto px-4 py-8">
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
    </div>
  );
}
