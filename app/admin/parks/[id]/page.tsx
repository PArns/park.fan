'use client';

import { use, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CalendarRange,
  ExternalLink,
  History,
  Images,
  MapPin,
  Rows3,
  Search,
  Sliders,
  Sparkles,
  ListChecks,
  Ticket,
  TriangleAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminKeys, useAdminQuery } from '../../_lib/api';
import type { AdminAttractionListItem, AdminParkDetail } from '../../_lib/types';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  Meta,
  Panel,
  PanelHeader,
  SkeletonRows,
} from '../../_ui/primitives';
import { TextInput } from '../../_ui/controls';
import { CuratedFieldsPanel } from '../../_ui/curated-fields';
import { HistoryList } from '../../_ui/history-list';
import { EntityMediaPanel } from '../../_ui/entity-media';
import { EntityPostsPanel } from '../../_ui/entity-posts';
import { useCan } from '../../_app/session';
import { SeasonList } from '../_components/season-editor';
import { LocationEditor } from '../_components/location-editor';
import { PhotoCoverage } from '../_components/photo-coverage';
import { AttractionFeaturesEditor } from '../_components/attraction-features-editor';

/**
 * One park and everything about it that a person decides rather than a feed, in tabs under one
 * header, so it stays clear which park a correction lands on.
 */

type Tab = 'fields' | 'attractions' | 'features' | 'seasons' | 'media' | 'history';

const TABS: Array<{ id: Tab; label: string; icon: typeof Sliders }> = [
  { id: 'fields', label: 'Stammdaten', icon: Sliders },
  { id: 'attractions', label: 'Fahrgeschäfte', icon: Rows3 },
  { id: 'features', label: 'Merkmale', icon: ListChecks },
  { id: 'seasons', label: 'Saisons', icon: CalendarRange },
  { id: 'media', label: 'Bilder', icon: Images },
  { id: 'history', label: 'Verlauf', icon: History },
];

/**
 * The active tab, derived from the URL, so nothing falls out of step and it survives a reload and
 * a detour into a ride. `replace`, not `push`, so tab switches do not fill the history.
 */
function useTabFromUrl(): [Tab, (tab: Tab) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const wanted = params.get('tab');
  const tab = TABS.some((entry) => entry.id === wanted) ? (wanted as Tab) : 'fields';

  const select = useCallback(
    (next: Tab) => {
      const query = new URLSearchParams(params.toString());
      if (next === 'fields') query.delete('tab');
      else query.set('tab', next);
      const search = query.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  return [tab, select];
}

export default function ParkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // In the URL, so links like `?tab=attractions` and the way back from a ride land on the tab.
  const [tab, setTab] = useTabFromUrl();
  // Read once, at the top: hooks may not be called from inside the conditional
  // branches below, and calling `useCan` per tab would do exactly that.
  const canEdit = useCan('editor');

  const park = useAdminQuery<AdminParkDetail>(adminKeys.park(id), `/api/admin/content/parks/${id}`);

  if (park.isError) {
    return <ErrorState message={park.error.message} onRetry={() => void park.refetch()} />;
  }
  if (park.isLoading || !park.data) return <SkeletonRows rows={8} />;

  const data = park.data;

  return (
    <AdminPage>
      <ParkHeader park={data} />

      <div className="border-border/50 flex flex-wrap gap-x-1 border-b">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={cn(
              '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors',
              tab === entry.id
                ? 'border-primary text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            )}
          >
            <entry.icon className="h-3.5 w-3.5" />
            {entry.label}
            {entry.id === 'seasons' && data.seasons.length > 0 && (
              <span className="text-muted-foreground text-xs tabular-nums">
                {data.seasons.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'fields' && (
        <CuratedFieldsPanel
          fields={data.fields}
          endpoint={`/api/admin/content/parks/${data.id}`}
          draftScope={`park:${data.id}`}
          invalidateKeys={[adminKeys.park(data.id), ['admin', 'parks'], ['admin', 'history']]}
          emptyHint="Nichts korrigiert. Der Park zeigt überall, was der Sync liefert."
          savedDescription="Die Caches sind geleert, das Frontend wurde benachrichtigt."
          canEdit={canEdit}
        />
      )}
      {tab === 'attractions' && <ParkAttractionsTab parkId={id} />}
      {tab === 'features' && <AttractionFeaturesEditor park={data} />}
      {tab === 'seasons' && (
        <div id="seasons">
          <SeasonList parkId={id} seasons={data.seasons} canEdit={canEdit} />
        </div>
      )}
      {tab === 'media' && (
        <div className="space-y-4">
          <ParkPhotoCoverage parkId={id} parkSlug={data.slug} />
          <EntityMediaPanel parkSlug={data.slug} title={data.name} />
          <EntityPostsPanel
            parkSlug={data.slug}
            // The geo path disambiguates shared slugs — `disneyland-park`
            // exists in Anaheim and in Paris, and a reference that pinned a
            // full path only counts for the one it named.
            geoPath={data.path.split('/').slice(0, 3).join('/')}
            title={data.name}
          />
        </div>
      )}
      {tab === 'history' && (
        <HistoryList
          entries={data.history}
          invalidateKeys={[adminKeys.park(id)]}
          canUndo={canEdit}
        />
      )}
    </AdminPage>
  );
}

function ParkHeader({ park }: { park: AdminParkDetail }) {
  const missingCoordinates = park.latitude === null || park.longitude === null;
  // Owner only, because a changed city rewrites the park's public address.
  const canCorrectLocation = useCan('owner');

  return (
    <header className="space-y-3">
      {/* A way back to the list, since the top bar's breadcrumb does not link. */}
      <Link
        href="/admin/parks"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Zurück zur Parkliste
      </Link>

      <div className="flex flex-wrap items-start gap-3">
        <span className="bg-primary/10 text-primary mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <MapPin className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{park.name}</h1>
          <p className="text-muted-foreground truncate text-sm">
            {[park.city, park.region, park.country].filter(Boolean).join(', ')}
          </p>
          {park.name !== park.upstreamName && (
            <p className="text-muted-foreground mt-1 text-xs">
              Upstream nennt ihn <span className="font-medium">{park.upstreamName}</span>
            </p>
          )}
        </div>

        <a
          href={park.url}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border/60 hover:border-primary/40 inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Seite ansehen
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meta label="Fahrgeschäfte" value={park.attractionCount} />
        <Meta label="Zeitzone" value={park.timezone} />
        <Meta label="Slug" value={park.slug} />
        <Meta
          label="Koordinaten"
          value={
            missingCoordinates ? (
              <span className="text-amber-400">fehlen</span>
            ) : (
              `${park.latitude?.toFixed(3)}, ${park.longitude?.toFixed(3)}`
            )
          }
        />
      </div>

      {missingCoordinates && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Ohne Koordinaten bekommt der Park kein Wetter und taucht in der Umkreissuche nicht auf.
        </p>
      )}

      {canCorrectLocation && (
        <LocationEditor
          parkId={park.id}
          city={park.city}
          latitude={park.latitude}
          longitude={park.longitude}
        />
      )}

      {park.curationNote && (
        <p className="border-border/60 bg-muted/20 text-muted-foreground rounded-lg border px-3 py-2 text-xs italic">
          {park.curationNote}
        </p>
      )}
    </header>
  );
}

/**
 * The park's ride list, borrowed for the coverage lookup.
 *
 * Same query key as the Fahrgeschäfte tab with no filters, so opening both
 * costs one request rather than two.
 */
function ParkPhotoCoverage({ parkId, parkSlug }: { parkId: string; parkSlug: string }) {
  const attractions = useAdminQuery<{ total: number; attractions: AdminAttractionListItem[] }>(
    adminKeys.parkAttractions(parkId, { params: '' }),
    `/api/admin/content/parks/${parkId}/attractions?`
  );

  if (!attractions.data) return null;
  return <PhotoCoverage parkSlug={parkSlug} attractions={attractions.data.attractions} />;
}

function ParkAttractionsTab({ parkId }: { parkId: string }) {
  const [query, setQuery] = useState('');
  const [includeRetired, setIncludeRetired] = useState(false);

  const params = useMemo(() => {
    const search = new URLSearchParams();
    if (query.trim()) search.set('q', query.trim());
    if (includeRetired) search.set('includeRetired', 'true');
    return search.toString();
  }, [query, includeRetired]);

  const attractions = useAdminQuery<{ total: number; attractions: AdminAttractionListItem[] }>(
    adminKeys.parkAttractions(parkId, { params }),
    `/api/admin/content/parks/${parkId}/attractions?${params}`
  );

  const rows = attractions.data?.attractions ?? [];

  return (
    <Panel>
      <PanelHeader
        icon={Rows3}
        title="Fahrgeschäfte"
        hint={attractions.data ? `${attractions.data.total} in diesem Park` : undefined}
        action={
          <button
            type="button"
            onClick={() => setIncludeRetired((current) => !current)}
            className={cn(
              'rounded-lg border px-2 py-1 text-xs',
              includeRetired
                ? 'border-primary/40 text-primary'
                : 'border-border/60 text-muted-foreground'
            )}
          >
            Stillgelegte {includeRetired ? 'ausblenden' : 'zeigen'}
          </button>
        }
      />

      <div className="border-border/50 border-b px-4 py-2">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Fahrgeschäft suchen…"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {attractions.isError ? (
        <ErrorState message={attractions.error.message} />
      ) : attractions.isLoading ? (
        <SkeletonRows rows={8} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Rows3}
          title="Keine Treffer"
          description="Dieser Park hat kein Fahrgeschäft mit diesem Namen."
        />
      ) : (
        <ul className="divide-border/40 divide-y">
          {rows.map((attraction) => (
            <li key={attraction.id}>
              <Link
                href={`/admin/attractions/${attraction.id}`}
                className="hover:bg-muted/25 group flex items-center gap-3 px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="group-hover:text-primary truncate text-sm font-medium">
                    {attraction.name}
                    {attraction.retiredAt && (
                      <span className="text-muted-foreground ml-2 text-xs">stillgelegt</span>
                    )}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {[
                      attraction.land,
                      attraction.attractionType,
                      attraction.minimumHeight !== null
                        ? `ab ${attraction.minimumHeight} ${attraction.minimumHeightUnit ?? 'cm'}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {attraction.isSeasonal && (
                    <Chip tone={attraction.seasonalityCurated ? 'primary' : 'muted'}>saisonal</Chip>
                  )}
                  {attraction.hasRideProfile && <Chip>Profil</Chip>}
                  {attraction.fastPass?.has === true && (
                    <Chip tone="primary">
                      <Ticket className="h-3 w-3" />
                      {attraction.fastPass.price === 0
                        ? 'gratis'
                        : attraction.fastPass.price !== null
                          ? attraction.fastPass.price
                          : 'Fastpass'}
                    </Chip>
                  )}
                  {attraction.curatedFieldCount > 0 && (
                    <Chip tone="primary">
                      <Sparkles className="h-3 w-3" />
                      {attraction.curatedFieldCount}
                    </Chip>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
