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
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../../_lib/api';
import type { AdminAttractionDetail, CurationResponse } from '../../_lib/types';
import {
  AdminPage,
  Chip,
  ErrorState,
  Meta,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
} from '../../_ui/primitives';
import { CuratedFieldsEditor, useCuratedForm, type FieldValues } from '../../_ui/curated-fields';
import { HistoryList } from '../../_ui/history-list';
import { useToast } from '../../_ui/toast';
import { useCan } from '../../_app/session';
import { RideProfileEditor } from '../_components/ride-profile-editor';
import { AttractionStatus } from '../_components/attraction-status';
import { EntityMediaPanel } from '../../_ui/entity-media';
import { EntityPostsPanel } from '../../_ui/entity-posts';

/**
 * One ride.
 *
 * The same four-tab shape as a park, for the same reason — but the second tab
 * is the ride profile rather than a list of children, because a ride's
 * interesting curation is not its facts so much as what it *is*: the glossary
 * terms that connect it to the dictionary and let the dictionary list it back.
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
        {/* The way back, spelled out. The park's name under the title has been
            a link all along, but it reads as a subtitle — and this page is
            reached from a park, from the palette and from a photo, so leaving
            "where did I come from" to the browser's back button was the one
            thing every route into it had in common. */}
        <Link
          href={
            data.park
              ? // Back to the ride list, not to the park's master data: this
                // page is reached from that list, one ride at a time, and
                // landing on another tab means finding your place again after
                // every single one.
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

        {/* Aus der Kennzahlenzeile heraus, weil er dort als Tatsache stand, die
            man zur Kenntnis nimmt — setzen ließ er sich nur in der
            Retirement-Arbeitsliste, und die zeigt eine Bahn nur, solange der
            Detector sie vorlegt. */}
        <AttractionStatus
          attractionId={data.id}
          name={data.name}
          retiredAt={data.retiredAt}
          retiredReason={data.retiredReason}
          canRetire={canRetire}
        />
      </header>

      <div className="border-border/50 flex gap-1 border-b">
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

      {tab === 'fields' && <AttractionFieldsTab attraction={data} canEdit={canEdit} />}
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

function AttractionFieldsTab({
  attraction,
  canEdit,
}: {
  attraction: AdminAttractionDetail;
  canEdit: boolean;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const form = useCuratedForm(attraction.fields, `attraction:${attraction.id}`);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overridden = attraction.fields.filter((field) => field.overridden).length;

  async function save(input: { fields: FieldValues; reason: string; sourceUrl: string }) {
    setSaving(true);
    setError(null);
    try {
      const result = await adminFetch<CurationResponse>(
        `/api/admin/content/attractions/${attraction.id}`,
        {
          method: 'PATCH',
          body: {
            fields: input.fields,
            ...(input.reason ? { reason: input.reason } : {}),
            ...(input.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
          },
        }
      );

      invalidate(
        adminKeys.attraction(attraction.id),
        attraction.park ? adminKeys.park(attraction.park.id) : ['admin'],
        ['admin', 'history']
      );
      form.applyServerFields(result.fields);

      toast.push({
        title: `${result.changed.length} Feld${result.changed.length === 1 ? '' : 'er'} gespeichert`,
        tone: 'success',
        action: result.auditId
          ? {
              label: 'Rückgängig',
              onClick: async () => {
                await adminFetch(`/api/admin/content/history/${result.auditId}/undo`, {
                  method: 'POST',
                });
                invalidate(adminKeys.attraction(attraction.id), ['admin', 'history']);
              },
            }
          : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel>
      <PanelHeader
        icon={Sliders}
        title="Kuratierte Felder"
        hint={
          overridden === 0
            ? 'Nichts korrigiert. Alles kommt so vom Sync.'
            : `${overridden} Feld${overridden === 1 ? '' : 'er'} weicht vom Upstream ab.`
        }
        action={
          overridden > 0 ? (
            <Chip tone="primary">
              <Sparkles className="h-3 w-3" />
              {overridden}
            </Chip>
          ) : null
        }
      />
      <PanelBody>
        {!canEdit && (
          <p className="text-muted-foreground mb-3 text-xs">
            Dein Konto darf lesen, aber nicht kuratieren.
          </p>
        )}
        <CuratedFieldsEditor
          fields={attraction.fields}
          form={form}
          disabled={!canEdit}
          saving={saving}
          saveError={error}
          onSave={save}
        />
      </PanelBody>
    </Panel>
  );
}
