'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Blocks,
  ExternalLink,
  History,
  Images,
  RollerCoaster,
  Sliders,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminKeys, useAdminQuery } from '../../_lib/api';
import type { AdminAttractionDetail } from '../../_lib/types';
import { AdminPage, ErrorState, Meta, SkeletonRows } from '../../_ui/primitives';
import { CuratedFieldsPanel } from '../../_ui/curated-fields';
import { HistoryList } from '../../_ui/history-list';
import { useCan } from '../../_app/session';
import { RideProfileEditor } from '../_components/ride-profile-editor';
import { AttractionStatus } from '../_components/attraction-status';
import { EntityMediaPanel } from '../../_ui/entity-media';
import { EntityPostsPanel } from '../../_ui/entity-posts';

/**
 * One ride, in the park editor's tab shape, with the ride profile as the second tab: its glossary
 * terms connect the ride to the dictionary.
 */

type Tab = 'fields' | 'profile' | 'media' | 'history';

const TABS: Array<{ id: Tab; label: string; icon: typeof Sliders }> = [
  { id: 'fields', label: 'Stammdaten', icon: Sliders },
  { id: 'profile', label: 'Ride-Profil', icon: Blocks },
  { id: 'media', label: 'Bilder', icon: Images },
  { id: 'history', label: 'Verlauf', icon: History },
];

export default function AttractionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>('fields');
  const canEdit = useCan('editor');
  // Stilllegen und Zurückholen sind `owner` — dieselbe Grenze wie in der
  // Retirement-Arbeitsliste, weil es dieselbe Entscheidung ist.
  const canRetire = useCan('owner');

  const attraction = useAdminQuery<AdminAttractionDetail>(
    adminKeys.attraction(id),
    `/api/admin/content/attractions/${id}`
  );

  if (attraction.isError) {
    return (
      <ErrorState message={attraction.error.message} onRetry={() => void attraction.refetch()} />
    );
  }
  if (attraction.isLoading || !attraction.data) return <SkeletonRows rows={8} />;

  const data = attraction.data;

  return (
    <AdminPage>
      <header className="space-y-3">
        {/* The way back, spelled out: the park's name under the title reads as a subtitle, not a
            link. */}
        <Link
          href={
            data.park
              ? // Back to the ride list, where this page is reached from one ride at a time.
                `/admin/parks/${data.park.id}?tab=attractions`
              : '/admin/parks'
          }
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {data.park ? `Zurück zu ${data.park.name}` : 'Zurück zu den Parks'}
        </Link>

        <div className="flex flex-wrap items-start gap-3">
          <span className="bg-primary/10 text-primary mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <RollerCoaster className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold">{data.name}</h1>
            {data.park && (
              <Link
                href={`/admin/parks/${data.park.id}`}
                className="text-muted-foreground hover:text-foreground truncate text-sm"
              >
                {data.park.name}
              </Link>
            )}
            {data.name !== data.upstreamName && (
              <p className="text-muted-foreground mt-1 text-xs">
                Upstream nennt es <span className="font-medium">{data.upstreamName}</span>
              </p>
            )}
          </div>

          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border/60 hover:border-primary/40 inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Seite ansehen
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Meta label="Slug" value={data.slug} />
          <Meta label="Externe ID" value={data.externalId} />
          <Meta
            label="Profil"
            value={data.rideProfile ? `${data.rideProfile.elements.length} Elemente` : '—'}
          />
        </div>

        {/* Settable here, not only in the retirement worklist, which shows a ride only while the
            detector proposes it. */}
        <AttractionStatus
          attractionId={data.id}
          name={data.name}
          retiredAt={data.retiredAt}
          retiredReason={data.retiredReason}
          canRetire={canRetire}
        />
      </header>

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
          </button>
        ))}
      </div>

      {tab === 'fields' && (
        <CuratedFieldsPanel
          fields={data.fields}
          endpoint={`/api/admin/content/attractions/${data.id}`}
          draftScope={`attraction:${data.id}`}
          invalidateKeys={[
            adminKeys.attraction(data.id),
            data.park ? adminKeys.park(data.park.id) : ['admin'],
            ['admin', 'history'],
          ]}
          undoInvalidateKeys={[adminKeys.attraction(data.id), ['admin', 'history']]}
          emptyHint="Nichts korrigiert. Alles kommt so vom Sync."
          canEdit={canEdit}
        />
      )}
      {tab === 'profile' && (
        <RideProfileEditor
          attractionId={data.id}
          parkId={data.park?.id ?? null}
          profile={data.rideProfile}
          canEdit={canEdit}
        />
      )}
      {tab === 'media' && (
        <div className="space-y-4">
          <EntityMediaPanel
            parkSlug={data.park?.slug ?? null}
            rideSlug={data.slug}
            title={data.name}
          />
          <EntityPostsPanel
            parkSlug={data.park?.slug ?? null}
            rideSlug={data.slug}
            geoPath={data.park?.path.split('/').slice(0, 3).join('/')}
            title={data.name}
          />
        </div>
      )}
      {tab === 'history' && (
        <HistoryList
          entries={data.history}
          invalidateKeys={[adminKeys.attraction(data.id)]}
          canUndo={canEdit}
        />
      )}
    </AdminPage>
  );
}
