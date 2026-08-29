'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  ChevronDown,
  Crosshair,
  MapPin,
  Snowflake,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { distanceMeters } from '@/lib/media/geo';
import type { RankedRide } from '@/lib/media/photo-backlog';
import { adminFetch } from '../_lib/api';
import { formatDisplayName } from '../_lib/ui';
import { useSession } from '../_app/session';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
} from '../_ui/primitives';
import { ParkRidePicker, type PickerResult } from '../blog-editor/_components/park-ride-picker';
import { RideRow } from './_components/ride-row';
import { UploadBar } from './_components/upload-bar';
import { useDevicePosition, useNearbyPark } from './_lib/use-park-location';
import { useCaptureUploads } from './_lib/use-capture-uploads';
import type { BacklogResponse, UploadState } from './_lib/types';

/**
 * Photographing a park, from inside the park.
 *
 * Every other surface in the admin assumes a desk: a table, a filter row, a detail
 * panel beside the thing being edited. This one assumes a hand, a phone, sunlight,
 * and a queue you are about to walk past. So it is one column of large targets, and
 * it answers exactly two questions — what is missing a photograph, and what is in
 * front of me — with the same list under two sort orders rather than two lists.
 *
 * The ordering is not this file's business (`lib/media/photo-backlog.ts`), and
 * neither is the upload (`_lib/use-capture-uploads.ts`). What lives here is the
 * screen and its one real decision: what to do when there is no fix. Location is
 * refused, unavailable indoors, and wrong in a car park — so the park is a value
 * that can always be set by hand, and the ordering by distance is the thing that
 * degrades, not the page.
 */

type SortMode = 'importance' | 'distance';

export default function CapturePage() {
  const { identity } = useSession();
  const { position, status, retry } = useDevicePosition();
  const { park, resolving, failed, redetect } = useNearbyPark(position);

  /** A park chosen in the picker wins over the one the coordinates suggested. */
  const [manualPath, setManualPath] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [sort, setSort] = useState<SortMode>('importance');
  const [showCovered, setShowCovered] = useState(false);
  const [showOutOfSeason, setShowOutOfSeason] = useState(false);

  const path = manualPath ?? park?.path ?? null;

  const backlog = useQuery({
    queryKey: ['admin', 'photo-backlog', path],
    enabled: Boolean(path),
    // Long enough that walking between two rides does not re-fetch, short enough
    // that a photo committed twenty minutes ago stops being listed as missing.
    staleTime: 5 * 60_000,
    queryFn: () =>
      adminFetch<BacklogResponse>(`/api/admin/media/backlog?path=${encodeURIComponent(path!)}`),
  });

  const data = backlog.data ?? null;
  const author = identity.displayName ? formatDisplayName(identity.displayName) : null;
  const uploads = useCaptureUploads({ data, author });

  /** Metres from the phone to each ride, when both ends have coordinates. */
  const distanceFor = useCallback(
    (ride: RankedRide): number | null => {
      if (!position || ride.latitude === null || ride.longitude === null) return null;
      return distanceMeters(
        { lat: position.lat, lon: position.lon, source: 'exif' },
        { latitude: ride.latitude, longitude: ride.longitude }
      );
    },
    [position]
  );

  /** Upload states grouped by ride, so a row can show its own photos' progress. */
  const statesByRide = useMemo(() => {
    const map = new Map<string, UploadState[]>();
    for (const entry of uploads.active) {
      const key = entry.rideSlug ?? '';
      map.set(key, [...(map.get(key) ?? []), entry.state]);
    }
    return map;
  }, [uploads.active]);

  const missing = useMemo(() => {
    const rides = data?.backlog.missing ?? [];
    if (sort !== 'distance' || !position) return rides;
    // Rides with no coordinates cannot be sorted by distance and must not be
    // silently dropped from the list — they go to the end, in their own order.
    const withDistance = rides.map((ride) => ({ ride, d: distanceFor(ride) }));
    return [
      ...withDistance.filter((r) => r.d !== null).sort((a, b) => a.d! - b.d!),
      ...withDistance.filter((r) => r.d === null),
    ].map((r) => r.ride);
  }, [data, distanceFor, position, sort]);

  /** The ride to hand the thumb: nearest one still missing a photograph. */
  const nearest = useMemo(() => {
    if (!position || !data) return null;
    let best: { ride: RankedRide; d: number } | null = null;
    for (const ride of data.backlog.missing) {
      const d = distanceFor(ride);
      if (d === null) continue;
      if (!best || d < best.d) best = { ride, d };
    }
    return best;
  }, [data, distanceFor, position]);

  const handleFiles = useCallback(
    (ride: RankedRide) => (files: FileList | null) => {
      if (!files) return;
      void uploads.upload(files, { slug: ride.slug, name: ride.name, area: ride.land });
    },
    [uploads]
  );

  const applyPick = (result: PickerResult) => {
    const picked = result.refKey
      .replace(/^\/?(?:v1\/)?parks\//, '')
      .split('/')
      .filter(Boolean);
    // A ride hit carries `/attractions/<slug>` on the end; the park is the four
    // segments in front of it either way.
    if (picked.length >= 4) setManualPath(picked.slice(0, 4).join('/'));
    setPicking(false);
  };

  return (
    <AdminPage width="narrow" className="pb-28">
      <LocationBanner
        status={status}
        resolving={resolving}
        failed={failed}
        parkName={data?.park.name ?? park?.name ?? null}
        manual={Boolean(manualPath)}
        onRetry={retry}
        onPick={() => setPicking(true)}
        onRedetect={() => {
          setManualPath(null);
          redetect();
        }}
      />

      {!path ? (
        <Panel>
          <EmptyState
            icon={MapPin}
            title="Noch kein Park"
            description={
              status === 'denied'
                ? 'Die Ortung ist für diese Seite abgelehnt. Park von Hand wählen, oder in den Einstellungen des Browsers freigeben.'
                : 'Sobald die Ortung greift, steht hier der Park, in dem du stehst. Bis dahin geht es von Hand.'
            }
            action={
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="border-primary/40 bg-primary/15 text-primary min-h-11 rounded-xl border px-4 text-sm font-medium"
              >
                Park wählen
              </button>
            }
          />
        </Panel>
      ) : backlog.isLoading ? (
        <Panel>
          <SkeletonRows rows={8} />
        </Panel>
      ) : backlog.isError ? (
        <Panel>
          <ErrorState
            message={(backlog.error as Error).message}
            onRetry={() => void backlog.refetch()}
          />
        </Panel>
      ) : data ? (
        <>
          {nearest && (
            <Panel>
              <PanelHeader
                icon={Crosshair}
                title="Direkt vor dir"
                hint="Die nächste Bahn ohne Bild."
              />
              <ul>
                <RideRow
                  ride={nearest.ride}
                  distanceM={nearest.d}
                  states={statesByRide.get(nearest.ride.slug) ?? []}
                  onFiles={handleFiles(nearest.ride)}
                  featured
                />
              </ul>
            </Panel>
          )}

          <Panel>
            <PanelHeader
              icon={CameraOff}
              title="Fehlt noch"
              hint={
                data.statsAvailable
                  ? 'Headliner zuerst, dann was heute Schlange macht.'
                  : data.waitTimesAvailable
                    ? 'Ohne historische Statistik: Headliner zuerst, dann die Tageswerte.'
                    : 'Dieser Park veröffentlicht keine Wartezeiten, die Reihenfolge ist alphabetisch.'
              }
              action={
                <Chip tone={data.backlog.missing.length === 0 ? 'success' : 'warning'}>
                  {data.backlog.coverage.withPhoto}/{data.backlog.coverage.total}
                </Chip>
              }
            />
            <div className="border-border/50 flex gap-1 border-b px-4 py-2">
              <SortButton active={sort === 'importance'} onClick={() => setSort('importance')}>
                Wichtigkeit
              </SortButton>
              <SortButton
                active={sort === 'distance'}
                disabled={!position}
                onClick={() => setSort('distance')}
              >
                Nähe
              </SortButton>
            </div>
            {missing.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Jede Bahn hat ein Bild"
                description="Das ist selten. Ein Blick auf die Bahnen mit nur einem alten Foto lohnt trotzdem."
              />
            ) : (
              <ul>
                {missing.map((ride) => (
                  <RideRow
                    key={ride.slug}
                    ride={ride}
                    distanceM={distanceFor(ride)}
                    states={statesByRide.get(ride.slug) ?? []}
                    onFiles={handleFiles(ride)}
                  />
                ))}
              </ul>
            )}
          </Panel>

          {data.backlog.outOfSeason.length > 0 && (
            <CollapsedGroup
              icon={Snowflake}
              title="Außer Saison"
              hint="Läuft gerade nicht. Die Kulisse steht trotzdem."
              count={data.backlog.outOfSeason.length}
              open={showOutOfSeason}
              onToggle={() => setShowOutOfSeason((open) => !open)}
            >
              {data.backlog.outOfSeason.map((ride) => (
                <RideRow
                  key={ride.slug}
                  ride={ride}
                  distanceM={distanceFor(ride)}
                  states={statesByRide.get(ride.slug) ?? []}
                  onFiles={handleFiles(ride)}
                />
              ))}
            </CollapsedGroup>
          )}

          {data.backlog.covered.length > 0 && (
            <CollapsedGroup
              icon={Camera}
              title="Hat schon ein Bild"
              hint="Ein zweites Bild ist trotzdem willkommen — anderes Licht, andere Jahreszeit."
              count={data.backlog.covered.length}
              open={showCovered}
              onToggle={() => setShowCovered((open) => !open)}
            >
              {data.backlog.covered.map((ride) => (
                <RideRow
                  key={ride.slug}
                  ride={ride}
                  distanceM={distanceFor(ride)}
                  states={statesByRide.get(ride.slug) ?? []}
                  onFiles={handleFiles(ride)}
                />
              ))}
            </CollapsedGroup>
          )}
        </>
      ) : null}

      <UploadBar
        active={uploads.active}
        queued={uploads.queued.length}
        draining={uploads.draining}
        pullRequest={uploads.pullRequest}
        onDrain={() => void uploads.drain()}
      />

      {picking && (
        <ParkRidePicker mode="park" onPick={applyPick} onClose={() => setPicking(false)} />
      )}
    </AdminPage>
  );
}

function SortButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'min-h-9 rounded-lg px-3 text-xs font-medium transition-colors disabled:opacity-40',
        active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

function CollapsedGroup({
  icon,
  title,
  hint,
  count,
  open,
  onToggle,
  children,
}: {
  icon: typeof Camera;
  title: string;
  hint: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Panel>
      <button type="button" onClick={onToggle} className="w-full text-left">
        <PanelHeader
          icon={icon}
          title={title}
          hint={hint}
          action={
            <span className="flex items-center gap-2">
              <Chip>{count}</Chip>
              <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
            </span>
          }
        />
      </button>
      {open && <ul>{children}</ul>}
    </Panel>
  );
}

/** Where the screen thinks it is, and every way to correct it. */
function LocationBanner({
  status,
  resolving,
  failed,
  parkName,
  manual,
  onRetry,
  onPick,
  onRedetect,
}: {
  status: ReturnType<typeof useDevicePosition>['status'];
  resolving: boolean;
  failed: boolean;
  parkName: string | null;
  manual: boolean;
  onRetry: () => void;
  onPick: () => void;
  onRedetect: () => void;
}) {
  const line = parkName
    ? parkName
    : status === 'locating' || resolving
      ? 'Ortung läuft…'
      : status === 'denied'
        ? 'Ortung abgelehnt'
        : status === 'unavailable'
          ? 'Ortung nicht verfügbar'
          : failed
            ? 'Park nicht bestimmbar'
            : 'Kein Park in Reichweite';

  return (
    <Panel className="sticky top-14 z-20">
      <PanelBody className="flex items-center gap-3 py-3">
        <MapPin
          className={cn('h-4 w-4 shrink-0', parkName ? 'text-primary' : 'text-muted-foreground')}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{line}</p>
          {manual && <p className="text-muted-foreground text-xs">von Hand gewählt</p>}
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={manual ? onRedetect : onRetry}
            className="border-border/70 text-muted-foreground hover:text-foreground min-h-9 rounded-lg border px-2.5 text-xs"
          >
            {manual ? 'Orten' : 'Neu orten'}
          </button>
          <button
            type="button"
            onClick={onPick}
            className="border-border/70 text-muted-foreground hover:text-foreground min-h-9 rounded-lg border px-2.5 text-xs"
          >
            Park wählen
          </button>
        </div>
      </PanelBody>
    </Panel>
  );
}
