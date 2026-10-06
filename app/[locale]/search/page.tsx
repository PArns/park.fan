import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternateLanguages, SITE_URL } from '@/i18n/config';
import { buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { Link } from '@/i18n/navigation';
import { Search, TreePalm, Cog, Utensils, Music, MapPin, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { Input } from '@/components/ui/input';
import { LocalTime, LocalTimeRange } from '@/components/ui/local-time';
import { search } from '@/lib/api/search';
import { getContinents } from '@/lib/api/discovery';
import { PageContainer } from '@/components/common/page-container';
import { searchResultHref } from '@/lib/utils/url-utils';
import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
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
  if (!isServableRoute(locale)) return {};
  const { q } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'seo.search' });

  return {
    title: q ? t('titleTemplate', { query: q }) : t('title'),
    description: t('metaDescriptionTemplate'),
    // Never indexed: without a query the page body is a search field and one hint line, and
    // with one it duplicates the park and ride pages it links to.
    robots: { index: false, follow: true },
    ...buildOpenGraphMetadata({
      locale,
      title: q ? t('titleTemplate', { query: q }) : t('title'),
      description: t('metaDescriptionTemplate'),
      url: `${SITE_URL}/${locale}/search${q ? `?q=${encodeURIComponent(q)}` : ''}`,
      ogImageUrl: getOgImageUrl([locale, 'search']),
    }),
    alternates: {
      canonical: `${SITE_URL}/${locale}/search`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/search`),
        'x-default': `${SITE_URL}/en/search`,
      },
    },
  };
}

const typeIcons = {
  park: TreePalm,
  attraction: Cog,
  show: Music,
  restaurant: Utensils,
  location: MapPin,
  glossary: BookOpen,
};

/** Shortest query this page sends. The palette and the hero wait for 3 (`/api/search` refuses less). */
const MIN_QUERY_LENGTH = 2;

import { getParkBackgroundImage } from '@/lib/utils/park-assets';
import { objectPositionForSrc } from '@/lib/media/focus';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import { assertServableRoute, isServableRoute } from '@/lib/utils/route-guards';

/**
 * Park id → IANA zone, for the results that carry clock times. `/v1/search` sends them as UTC
 * instants with no zone, and a `LocalTime` without one formats in the renderer's zone, so the
 * server and the hydrating browser would print different, wrong times. Read from the continents
 * tree the layout already loads (`getContinents()` is request-memoized), so it costs no request.
 */
async function getParkTimezones(): Promise<Map<string, string>> {
  const zones = new Map<string, string>();
  for (const continent of await getContinents().catch(() => [])) {
    for (const country of continent.countries ?? []) {
      for (const city of country.cities ?? []) {
        for (const park of city.parks ?? []) {
          if (park.timezone) zones.set(park.id, park.timezone);
        }
      }
    }
  }
  return zones;
}

function SearchResultCard({
  result,
  locale,
  timezone,
}: {
  result: SearchResultItem;
  locale: Locale;
  /** The zone of the park the result's clock times belong to. Without one they are not shown. */
  timezone?: string;
}) {
  const t = useTranslations('common');
  // `searchPage`, not `search`: the palette's namespace ships in every page's chrome, and these
  // strings are only ever rendered here, on the server.
  const tSearch = useTranslations('searchPage');
  const tGeo = useTranslations('geo');
  const Icon = typeIcons[result.type];

  // The palette and the hero route a picked result through the same resolver.
  const href = searchResultHref(result, locale);

  const backgroundImage = result.type === 'park' ? getParkBackgroundImage(result.slug) : null;

  const card = (
    <Card className="hover:border-primary/50 relative h-full overflow-hidden transition-all hover:shadow-md">
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt={result.name}
            fill
            className="object-cover opacity-40 transition-opacity group-hover:opacity-50"
            style={{ objectPosition: objectPositionForSrc(backgroundImage, '50% 50%') }}
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
              {tSearch(`types.${result.type}`)}
            </Badge>
          </div>
          {result.status && <ParkStatusBadge status={result.status} className="text-xs" />}
        </div>

        <h3 className="group-hover:text-primary mb-1 font-semibold transition-colors">
          {result.name}
        </h3>

        {(result.city || result.country) && (
          <p className="text-muted-foreground mb-2 flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3" />
            {[
              result.city,
              result.country
                ? translateGeoSlug(tGeo, 'countries', result.country, result.country)
                : null,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
        )}

        {result.parentPark && (
          <p className="text-muted-foreground mb-2 text-sm">
            {t('at', { park: result.parentPark.name })}
          </p>
        )}

        {result.type === 'attraction' && result.waitTime !== undefined && (
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3" />
            <span className="font-medium">
              {result.waitTime} {t('minutes')}
            </span>
          </div>
        )}

        {result.type === 'park' && result.parkHours && timezone && (
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3" />
            <span>
              <LocalTimeRange
                start={result.parkHours.open}
                end={result.parkHours.close}
                timeZone={timezone}
              />
            </span>
          </div>
        )}

        {result.type === 'show' && result.showTimes && result.showTimes.length > 0 && timezone && (
          <div className="mt-2 flex flex-wrap gap-1">
            {result.showTimes.slice(0, 3).map((time, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                <LocalTime time={time} timeZone={timezone} />
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
  );

  return href ? (
    <Link href={href as '/europe'} prefetch={false} className="group block h-full">
      {card}
    </Link>
  ) : (
    card
  );
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  assertServableRoute(locale);
  setRequestLocale(locale);

  const t = await getTranslations('common');

  return (
    <PageContainer>
      {/* Static shell — the query-dependent form + results stream below (Cache Components:
          searchParams + the uncached search are dynamic and must sit behind <Suspense>). */}
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">{t('search')}</h1>
      </div>
      <Suspense
        fallback={
          <form action="" method="get" className="relative max-w-xl">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
            {/* No `autoFocus`: this input and the one in `SearchBody` are different elements
                across a Suspense boundary, so a focused fallback opens the keyboard on an input
                that is then replaced, with anything typed into it. Focus once, on the input that
                survives. */}
            <Input
              type="search"
              name="q"
              placeholder={t('searchPlaceholder')}
              className="pl-10 text-lg"
            />
          </form>
        }
      >
        <SearchBody searchParams={searchParams} locale={locale as Locale} />
      </Suspense>
    </PageContainer>
  );
}

async function SearchBody({
  searchParams,
  locale,
}: {
  searchParams: Promise<{ q?: string }>;
  locale: Locale;
}) {
  const { q: query } = await searchParams;
  const t = await getTranslations('common');
  const tSearch = await getTranslations('searchPage');

  let results = null;
  if (query && query.length >= MIN_QUERY_LENGTH) {
    results = await search(query).catch(() => null);
  }
  const timezones = results?.results.some((r) => r.parkHours || r.showTimes?.length)
    ? await getParkTimezones()
    : null;
  // A park carries its own zone; a show reads its park's.
  const timezoneOf = (result: SearchResultItem) =>
    timezones?.get(result.type === 'park' ? result.id : (result.parentPark?.id ?? ''));

  return (
    <>
      <form action="" method="get" className="relative mb-8 max-w-xl">
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

      {query && query.length >= MIN_QUERY_LENGTH && (
        <>
          {results ? (
            <>
              <div className="mb-6 flex flex-wrap gap-4">
                {Object.entries(results.counts).map(([type, count]) => (
                  <Badge key={type} variant="secondary">
                    {tSearch(`types.${type}`)}: {count.total}
                  </Badge>
                ))}
              </div>

              {results.results.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {results.results.map((result) => (
                    <SearchResultCard
                      key={result.id}
                      result={result}
                      locale={locale}
                      timezone={timezoneOf(result)}
                    />
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

      {(!query || query.length < MIN_QUERY_LENGTH) && (
        <div className="py-12 text-center">
          <Search className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <p className="text-muted-foreground text-lg">
            {tSearch('minQueryLength', { count: MIN_QUERY_LENGTH })}
          </p>
        </div>
      )}
    </>
  );
}
