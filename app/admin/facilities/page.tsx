'use client';

import { useMemo, useState } from 'react';
import {
  CheckCheck,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  MapPinned,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FACILITIES_API,
  FACILITY_STATES,
  FACILITY_STATE_LABEL,
  FACILITY_STATE_TONE,
  FACILITY_TYPES,
  facilityCountsLine,
  facilityPlot,
  facilityQueueText,
  facilityState,
  facilityStateCounts,
  facilityTypeMeta,
  filterFacilityParks,
  isFacilitiesBackendMissing,
  isOutlineRef,
  orderFacilityPoints,
  osmElementUrl,
  type FacilityBulkApproval,
  type FacilityList,
  type FacilityParkRow,
  type FacilityReview,
  type FacilityState,
  type FacilityType,
} from '@/lib/admin/facilities';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import { formatAgo } from '../_lib/format';
import { Field, Segmented, TextInput } from '../_ui/controls';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
  Panel,
  PanelBody,
  PanelHeader,
  Toolbar,
} from '../_ui/primitives';
import { useToast } from '../_ui/toast';

const LIST_KEY = adminKeys.raw(FACILITIES_API);
/** While an import runs the list is read again this often; idle, it is not polled. */
const BUSY_REFETCH_MS = 10_000;

/** The type filter's choices: every type, or one. */
const TYPE_OPTIONS = [
  { value: 'all' as const, label: 'Alle Arten' },
  ...FACILITY_TYPES.map((value) => ({ value, label: facilityTypeMeta(value).short })),
];
const WHEELCHAIR_LABEL = {
  yes: 'rollstuhlgerecht',
  limited: 'eingeschränkt',
  no: 'nicht rollstuhlgerecht',
};

/**
 * The places in a park from OpenStreetMap, toilets, drinking water and sights: the import for every
 * park, the review of what came in, and the approval without which no point reaches a visitor.
 */
export default function FacilitiesPage() {
  const query = useAdminQuery<FacilityList>(LIST_KEY, FACILITIES_API, {
    refetchInterval: (q) => {
      const queue = q.state.data?.queue;
      return queue && (queue.bulk || queue.parkIds.length > 0) ? BUSY_REFETCH_MS : false;
    },
  });

  if (isFacilitiesBackendMissing(query.error)) {
    return (
      <AdminPage width="narrow">
        <Notice>Die API kennt diese Seite noch nicht. Sie kommt mit ihrem nächsten Deploy.</Notice>
      </AdminPage>
    );
  }
  if (query.error) return <ErrorState message={query.error.message} onRetry={query.refetch} />;
  if (!query.data) return <LoadingState label="Lädt Parks…" />;
  return <FacilitiesBoard list={query.data} />;
}

/** One write, its toast, and the list read again. */
function useFacilityWrite() {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [busy, setBusy] = useState<string | null>(null);
  const run = async <T,>(key: string, title: string, call: () => Promise<T>): Promise<T | null> => {
    setBusy(key);
    try {
      const result = await call();
      toast.push({ title, tone: 'success' });
      return result;
    } catch (error) {
      toast.push({ title: 'Nicht geklappt', description: (error as Error).message, tone: 'error' });
      return null;
    } finally {
      invalidate(LIST_KEY);
      setBusy(null);
    }
  };
  return { busy, run };
}

function FacilitiesBoard({ list }: { list: FacilityList }) {
  const { busy, run } = useFacilityWrite();
  const counts = useMemo(() => facilityStateCounts(list.parks), [list.parks]);
  // Opens where the work is: first reviews, then parks with new points.
  const [state, setState] = useState<FacilityState | 'all'>(() =>
    counts.review > 0 ? 'review' : counts.update > 0 ? 'update' : 'all'
  );
  const [type, setType] = useState<FacilityType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const shown = useMemo(
    () => filterFacilityParks(list.parks, state, search, type),
    [list.parks, state, search, type]
  );
  const approvable = list.parks.filter((park) => park.bulkApprovable).length;
  const queueText = facilityQueueText(list.queue);
  const bulkRunning = Boolean(list.queue.bulk);

  const importAll = (all: boolean) =>
    run('import-all', 'Sammelimport gestartet', () =>
      adminFetch(`${FACILITIES_API}/import-all`, { method: 'POST', body: { all } })
    );

  const approveAll = async () => {
    const preview = await adminFetch<FacilityBulkApproval>(`${FACILITIES_API}/approve-all`, {
      method: 'POST',
      body: { dryRun: true },
    });
    if (
      preview.count === 0 ||
      !confirm(
        `${preview.count} Parks freigeben? Ihre Punkte liegen alle im Umriss, und es sind je mindestens drei. Angesehen hat sie dann niemand.`
      )
    ) {
      return;
    }
    await run('approve-all', `${preview.count} Parks freigegeben`, () =>
      adminFetch(`${FACILITIES_API}/approve-all`, { method: 'POST', body: { dryRun: false } })
    );
  };

  return (
    <AdminPage width="wide">
      <Panel>
        <PanelHeader
          icon={Download}
          title="Aus OpenStreetMap einlesen"
          hint="Toiletten, Trinkwasser und Sehenswürdigkeiten im Umriss jedes Parks. Ein Park nach dem anderen, mit Pause; alle Parks dauern eine bis mehrere Stunden. Kein Punkt ist öffentlich, bevor er freigegeben ist."
        />
        <PanelBody className="space-y-3">
          {queueText && (
            <p
              className={cn(
                'text-sm',
                list.queue.lastFailure && !bulkRunning && 'text-destructive'
              )}
              role="status"
            >
              {bulkRunning && <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />}
              {queueText}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={bulkRunning || busy !== null}
              onClick={() => importAll(false)}
            >
              {busy === 'import-all' ? <Loader2 className="animate-spin" /> : <Download />}
              Alle Parks importieren
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkRunning || busy !== null}
              onClick={() => {
                if (
                  confirm(
                    'Alle Parks neu einlesen, auch die schon eingelesenen? Ein freigegebener Park bleibt dabei online; bringt der Lauf neue Punkte, warten nur diese auf deine Freigabe.'
                  )
                ) {
                  void importAll(true);
                }
              }}
            >
              <RefreshCw />
              Alle neu einlesen
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={approvable === 0 || busy !== null}
              onClick={() => void approveAll()}
            >
              {busy === 'approve-all' ? <Loader2 className="animate-spin" /> : <CheckCheck />}
              Sammelfreigabe ({approvable})
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            „Alle Parks importieren“ nimmt nur Parks, deren letzter Lauf nicht durchging; erneut
            gestartet, setzt es fort. Die Sammelfreigabe nimmt Parks mit mindestens drei sichtbaren
            Punkten gleich welcher Art, die alle im Umriss liegen. Daten ©
            OpenStreetMap-Mitwirkende, ODbL.
          </p>
        </PanelBody>
      </Panel>

      <Panel>
        <Toolbar>
          <Segmented
            label="Zustand"
            value={state}
            onChange={setState}
            options={[
              { value: 'all' as const, label: `Alle ${list.parks.length}` },
              ...FACILITY_STATES.map((value) => ({
                value,
                label: `${FACILITY_STATE_LABEL[value]} ${counts[value]}`,
              })),
            ]}
            className="flex-wrap"
          />
          <Segmented label="Art" value={type} onChange={setType} options={TYPE_OPTIONS} />
          <TextInput
            type="search"
            aria-label="Park suchen"
            placeholder="Park oder Land"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="ml-auto w-full sm:w-56"
          />
        </Toolbar>
        {shown.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title="Kein Park in dieser Auswahl"
            description={
              state === 'review' || state === 'update'
                ? 'Nichts wartet auf eine Prüfung. Starte oben den Import, oder wähle einen anderen Zustand.'
                : 'Wähle einen anderen Zustand oder eine andere Art, oder leere die Suche.'
            }
          />
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {shown.map((park) => (
              <li key={park.parkId}>
                <ParkRow
                  park={park}
                  queued={list.queue.parkIds.includes(park.parkId)}
                  open={open === park.parkId}
                  onToggle={() => setOpen(open === park.parkId ? null : park.parkId)}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminPage>
  );
}

function ParkRow({
  park,
  queued,
  open,
  onToggle,
}: {
  park: FacilityParkRow;
  queued: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const state = facilityState(park);
  const { hidden, outside, awaitingReview = 0 } = park.counts;
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-left hover:bg-white/[0.03]"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{park.name}</span>
          <span className="text-muted-foreground block text-xs">
            {park.country ?? 'ohne Land'}
            {park.lastRunAt && ` · eingelesen ${formatAgo(park.lastRunAt)}`}
            {park.boundary && ` · ${park.boundary.type}/${park.boundary.id}`}
          </span>
        </span>
        {queued && (
          <Chip tone="primary">
            <Loader2 className="h-3 w-3 animate-spin" />
            wird eingelesen
          </Chip>
        )}
        {park.status !== 'none' && park.status !== 'pending' && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {facilityCountsLine(park.counts)}
            {hidden > 0 && ` · ${hidden} ausgeblendet`}
          </span>
        )}
        {awaitingReview > 0 && <Chip tone="primary">{awaitingReview} neu</Chip>}
        {outside > 0 && <Chip tone="warning">{outside} außerhalb</Chip>}
        {park.lastRun === 'failed' && state !== 'failed' && (
          <Chip tone="danger">letzter Lauf fehlgeschlagen</Chip>
        )}
        <Chip tone={FACILITY_STATE_TONE[state]}>{FACILITY_STATE_LABEL[state]}</Chip>
      </button>
      {open && <ParkReview park={park} />}
    </>
  );
}

function ParkReview({ park }: { park: FacilityParkRow }) {
  const path = `${FACILITIES_API}/${park.parkId}`;
  const key = adminKeys.raw(path);
  const query = useAdminQuery<FacilityReview>(key, path);
  const invalidate = useInvalidateAdmin();
  const { busy, run } = useFacilityWrite();
  const [outline, setOutline] = useState('');
  const [marked, setMarked] = useState<string | null>(null);
  const [type, setType] = useState<FacilityType | 'all'>('all');

  const write = (name: string, title: string, suffix: string) =>
    run(name, title, async () => {
      await adminFetch(`${path}${suffix}`, { method: 'POST' });
      invalidate(key);
    });

  const all = query.data?.facilities;
  const points = useMemo(
    () => orderFacilityPoints((all ?? []).filter((p) => type === 'all' || p.type === type)),
    [all, type]
  );
  const plot = useMemo(
    () => facilityPlot(query.data?.import?.boundaryRings ?? [], points),
    [query.data, points]
  );
  const approved = park.status === 'approved';
  const online = approved || Boolean(park.approvedAt);
  const visible = (all ?? []).filter((point) => !point.hidden).length;
  const waiting = (all ?? []).filter((point) => !point.hidden && point.awaitingReview).length;

  return (
    <div className="space-y-4 border-t border-white/[0.06] bg-white/[0.015] px-4 py-4">
      {park.lastRun && park.lastRun !== 'ok' && park.lastRunMessage && (
        <Notice>
          {park.lastRun === 'no_outline'
            ? 'Kein Umriss in OpenStreetMap trägt den Namen dieses Parks. Suche ihn auf openstreetmap.org und trage ihn unten ein. '
            : 'Der letzte Lauf schlug fehl. '}
          <span className="break-words">{park.lastRunMessage}</span>
        </Notice>
      )}

      {query.error ? (
        <ErrorState message={query.error.message} onRetry={query.refetch} />
      ) : !query.data ? (
        <LoadingState label="Lädt Punkte…" />
      ) : (
        (all ?? []).length > 0 && (
          <div className="space-y-3">
            <Segmented
              label="Art im Plot und in der Liste"
              value={type}
              onChange={setType}
              options={TYPE_OPTIONS}
            />
            <div className="grid gap-4 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
              {plot && (
                <svg
                  viewBox={`0 0 ${plot.width} ${plot.height}`}
                  role="img"
                  aria-label={`Umriss von ${park.name} mit ${points.length} Punkten, Norden oben`}
                  className="h-auto w-full rounded-xl border border-white/[0.08] bg-black/20"
                >
                  {plot.paths.map((d) => (
                    <path key={d} d={d} className="fill-emerald-500/10 stroke-emerald-400/70" />
                  ))}
                  {plot.points.map((dot, index) => {
                    const point = points[index];
                    return (
                      <circle
                        key={dot.id}
                        cx={dot.x}
                        cy={dot.y}
                        r={marked === dot.id ? 8 : 5}
                        onMouseEnter={() => setMarked(dot.id)}
                        onMouseLeave={() => setMarked(null)}
                        className={cn(
                          'stroke-black/60 transition-[r]',
                          facilityTypeMeta(point.type).fill,
                          point.hidden && 'opacity-30',
                          point.awaitingReview && 'stroke-white stroke-2',
                          !point.insideOutline && 'stroke-amber-400 stroke-2'
                        )}
                      >
                        <title>
                          {[
                            facilityTypeMeta(point.type).label,
                            point.name && `„${point.name}“`,
                            point.awaitingReview && 'neu',
                            `${point.osmType}/${point.osmId}`,
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        </title>
                      </circle>
                    );
                  })}
                </svg>
              )}
              <ul className="divide-y divide-white/[0.06] text-sm">
                {points.map((point, index) => (
                  <li
                    key={point.id}
                    onMouseEnter={() => setMarked(point.id)}
                    onMouseLeave={() => setMarked(null)}
                    className={cn(
                      'flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5',
                      marked === point.id && 'bg-white/[0.04]',
                      point.hidden && 'text-muted-foreground'
                    )}
                  >
                    {(index === 0 || points[index - 1].type !== point.type) && (
                      <span className="text-muted-foreground w-full pt-2 text-xs font-medium tracking-wide uppercase">
                        {facilityTypeMeta(point.type).label}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className={cn(point.hidden && 'line-through')}>
                        {facilityTypeMeta(point.type).label}
                        {point.name && ` „${point.name}“`}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {[
                          point.wheelchair && WHEELCHAIR_LABEL[point.wheelchair],
                          point.changingTable && 'Wickeltisch',
                          point.fee && 'kostet',
                          `in OSM geändert ${point.osmTimestamp.slice(0, 4)}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    {point.awaitingReview && !point.hidden && <Chip tone="primary">neu</Chip>}
                    {!point.insideOutline && <Chip tone="warning">außerhalb</Chip>}
                    <a
                      href={osmElementUrl(point.osmType, point.osmId)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${point.osmType}/${point.osmId} auf openstreetmap.org`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy !== null}
                      onClick={() =>
                        void write(
                          point.id,
                          point.hidden ? 'Punkt wieder sichtbar' : 'Punkt ausgeblendet',
                          `/points/${point.id}/${point.hidden ? 'show' : 'hide'}`
                        )
                      }
                    >
                      {busy === point.id ? (
                        <Loader2 className="animate-spin" />
                      ) : point.hidden ? (
                        <Eye />
                      ) : (
                        <EyeOff />
                      )}
                      {point.hidden ? 'Einblenden' : 'Ausblenden'}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      )}

      {online && waiting > 0 && (
        <p className="text-sm">
          Online; {waiting === 1 ? 'den neuen Punkt' : `die ${waiting} neuen Punkte`} sieht noch
          niemand.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-2">
        {!approved && (
          <Button
            size="sm"
            disabled={busy !== null || park.status !== 'imported' || visible === 0}
            onClick={() => void write('approve', `${park.name} freigegeben`, '/approve')}
          >
            {busy === 'approve' ? <Loader2 className="animate-spin" /> : <CheckCheck />}
            {online && waiting > 0
              ? waiting === 1
                ? 'Neuen Punkt freigeben'
                : `${waiting} neue Punkte freigeben`
              : 'Freigeben'}
          </Button>
        )}
        {online && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void write('withdraw', 'Freigabe zurückgezogen', '/withdraw')}
          >
            Freigabe zurückziehen
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => void write('import', 'Import eingereiht', '/import')}
        >
          {busy === 'import' ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Neu einlesen
        </Button>
        <Field
          label="Umriss in OpenStreetMap"
          htmlFor={`outline-${park.parkId}`}
          hint="Nur wenn keiner gefunden wurde oder der falsche: way/… oder relation/…"
          className="ml-auto"
        >
          <span className="flex gap-2">
            <TextInput
              id={`outline-${park.parkId}`}
              autoComplete="off"
              spellCheck={false}
              placeholder="way/31052062"
              value={outline}
              onChange={(event) => setOutline(event.target.value)}
              className="w-44"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null || !isOutlineRef(outline)}
              onClick={() =>
                void write(
                  'outline',
                  'Import mit diesem Umriss eingereiht',
                  `/import?boundary=${encodeURIComponent(outline.trim())}`
                ).then(() => setOutline(''))
              }
            >
              <MapPinned />
              Damit einlesen
            </Button>
          </span>
        </Field>
      </div>
      <p className="text-muted-foreground text-xs">
        Ein falscher Punkt wird in OpenStreetMap berichtigt und neu eingelesen; „Ausblenden“ ist für
        Punkte, die dort stimmen und für Besucher nicht taugen, etwa vor dem Eingang, und für einen
        neuen Punkt, den du nicht freigeben willst.
      </p>
    </div>
  );
}
