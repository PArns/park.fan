'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CalendarSearch,
  HeartPulse,
  Link2Off,
  ListX,
  ShieldCheck,
} from 'lucide-react';
import { useAdminFetch } from '../_lib/admin-context';
import { useAdminQuery } from '../_lib/api';
import { formatDay } from '../_lib/format';
import {
  AdminPage,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
} from '../_ui/primitives';
import { Select } from '../_ui/controls';
import {
  DATA_QUALITY_KEY,
  SilencedClusterCard,
  UnreviewedParkCard,
  type AbsenceRetiredUnreviewed,
  type SilencedCluster,
} from './season-actions';

/**
 * What the backend's detectors noticed (a silenced feed, a job that keeps dying, a glossary id a
 * ride profile still points at): wrong now, not wrong enough to throw, and wrong until a person
 * looks here.
 */

interface FailingJob {
  queue: string;
  jobName: string;
  failures: number;
  lastReason: string;
  lastFailedAt: string | null;
}

interface DataQuality {
  windowDays: number;
  silencedClusters: SilencedCluster[];
  failingJobs: FailingJob[];
  /** Absent from an API that does not send it yet. */
  absenceRetiredUnreviewed?: AbsenceRetiredUnreviewed[];
}

interface BrokenTermId {
  termId: string;
  /** `parkSlug/rideSlug` for each ride page the missing term shortens. */
  usedBy: string[];
}

interface TermAudit {
  checkedAt: string;
  storedTermIds: number;
  glossaryTermIds: number;
  broken: BrokenTermId[];
  unusedGlossaryTermIds: number;
}

const WINDOWS = [
  { value: '7', label: '7 Tage' },
  { value: '14', label: '14 Tage' },
  { value: '30', label: '30 Tage' },
  { value: '90', label: '90 Tage' },
];

export default function DataQualityPage() {
  const [windowDays, setWindowDays] = useState('14');
  // A query rather than `useAdminFetch`: the cards below write, and an answered
  // card has to disappear — which needs a cache that can be invalidated.
  const qualityQuery = useAdminQuery<DataQuality>(
    [...DATA_QUALITY_KEY, windowDays],
    `/api/admin/data-quality?windowDays=${windowDays}`
  );
  const quality = {
    data: qualityQuery.data ?? null,
    error: qualityQuery.isError ? (qualityQuery.error?.message ?? 'Laden fehlgeschlagen') : null,
    loading: qualityQuery.isLoading,
  };
  const audit = useAdminFetch<TermAudit>('/api/admin/ride-profile-term-audit');

  const clusters = quality.data?.silencedClusters ?? [];
  const jobs = quality.data?.failingJobs ?? [];
  const broken = audit.data?.broken ?? [];
  const unreviewed = quality.data?.absenceRetiredUnreviewed ?? [];
  const unreviewedByPark = unreviewed.reduce<Map<string, AbsenceRetiredUnreviewed[]>>(
    (groups, row) => groups.set(row.parkId, [...(groups.get(row.parkId) ?? []), row]),
    new Map()
  );

  return (
    <AdminPage width="wide">
      <Panel>
        <PanelHeader icon={HeartPulse} title="Verstummte Fahrgeschäfte" />
        <PanelBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-muted-foreground min-w-0 flex-1 text-sm">
              Parks, in denen mehrere Bahnen aufgehört haben, OPERATING zu melden, während der Park
              weiter Daten liefert. Ein einzelnes stilles Fahrgeschäft ist eine Wartung, fünf auf
              einmal sind eine abgerissene Quelle.
            </p>
            <Select
              value={windowDays}
              onValueChange={(value) => setWindowDays(value ?? '14')}
              options={WINDOWS}
              className="w-36"
            />
          </div>

          {quality.error ? (
            <ErrorState message={quality.error} />
          ) : quality.loading && !quality.data ? (
            <LoadingState label="Datenqualität wird geprüft…" />
          ) : clusters.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Nichts verstummt"
              description={`In den letzten ${quality.data?.windowDays ?? windowDays} Tagen hat kein Park mehrere Bahnen gleichzeitig verloren.`}
            />
          ) : (
            <div className="space-y-2">
              {clusters.map((cluster) => (
                <SilencedClusterCard
                  key={`${cluster.parkId}:${cluster.lastOperating}`}
                  cluster={cluster}
                  lastOperatingLabel={formatDay(cluster.lastOperating)}
                />
              ))}
            </div>
          )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader icon={CalendarSearch} title="Saison oder weg?" />
        <PanelBody className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Bahnen, die ThemeParks.wiki nicht mehr listet und die deshalb stillgelegt wurden, ohne
            dass jemand gesagt hat, ob sie saisonal sind. Eine Halloween-Maze im ersten Jahr landet
            hier, weil die automatische Erkennung erst nach einem Jahr Beobachtung greift.{' '}
            <strong className="text-foreground">Kommt wieder</strong>: Monate wählen, die Bahn wird
            wieder aktiv, sobald der Feed sie listet.{' '}
            <strong className="text-foreground">Ist weg</strong>: die Stilllegung bleibt.
          </p>
          {quality.error ? null : quality.loading && !quality.data ? (
            <LoadingState />
          ) : unreviewed.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Nichts offen"
              description="Jede stillgelegte Bahn hat eine Saison-Entscheidung."
            />
          ) : (
            <div className="space-y-2">
              {[...unreviewedByPark.values()].map((rows) => (
                <UnreviewedParkCard key={rows[0].parkId} rows={rows} />
              ))}
            </div>
          )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader icon={ListX} title="Jobs, die scheitern" />
        <PanelBody className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Die letzten Fehlschläge je Queue, mit dem Grund, den Bull in Redis behält und den bisher
            nur ein Terminal lesen konnte.
          </p>
          {quality.error ? null : quality.loading && !quality.data ? (
            <LoadingState />
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Keine fehlgeschlagenen Jobs"
              description="Alle beobachteten Queues sind sauber."
            />
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={`${job.queue}:${job.jobName}`}
                  className="border-destructive/30 bg-destructive/[0.05] rounded-lg border p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs">{job.queue}</span>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="text-sm font-medium">{job.jobName}</span>
                    <Chip tone="danger">{job.failures}×</Chip>
                    <span className="text-muted-foreground ml-auto text-xs">
                      {formatDay(job.lastFailedAt)}
                    </span>
                    <Link
                      href="/admin/queues"
                      className="border-border/60 hover:border-primary/50 hover:text-primary rounded-md border px-2 py-1 text-xs transition-colors"
                    >
                      Stack in Queues ansehen
                    </Link>
                  </div>
                  <p className="text-muted-foreground mt-2 font-mono text-xs break-words">
                    {job.lastReason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader icon={Link2Off} title="Kaputte Glossar-Verweise" />
        <PanelBody className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Ride-Profile speichern Glossar-Term-Ids. Wird ein Term umbenannt oder entfernt, fällt
            der Verweis zur Laufzeit stillschweigend weg, die Bahn zeigt dann ein Element weniger,
            ohne dass irgendwo ein Fehler steht.
          </p>
          {audit.error ? (
            <ErrorState message={audit.error} />
          ) : audit.loading && !audit.data ? (
            <LoadingState />
          ) : broken.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Alle Verweise lösen auf"
              description={
                audit.data
                  ? `${audit.data.storedTermIds} gespeicherte Ids gegen ${audit.data.glossaryTermIds} Glossarbegriffe geprüft.`
                  : undefined
              }
            />
          ) : (
            <div className="space-y-2">
              {broken.map((entry) => (
                <div key={entry.termId} className="border-border/60 bg-card rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertTriangle className="text-destructive h-4 w-4" aria-hidden="true" />
                    <code className="text-sm font-medium">{entry.termId}</code>
                    <span className="text-muted-foreground text-xs">
                      {entry.usedBy.length} {entry.usedBy.length === 1 ? 'Bahn' : 'Bahnen'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.usedBy.map((slugPair) => {
                      const [parkSlug, rideSlug] = slugPair.split('/');
                      return (
                        /* The audit reports slugs, the editor works in ids —
                         `/admin/go` is the translation, the same one the media
                         panel uses. */
                        <Link
                          key={slugPair}
                          href={`/admin/go?park=${encodeURIComponent(parkSlug ?? '')}&ride=${encodeURIComponent(rideSlug ?? '')}`}
                          className="border-border/60 hover:border-primary/50 hover:text-primary rounded-md border px-2 py-1 font-mono text-xs transition-colors"
                        >
                          {slugPair}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelBody>
      </Panel>
    </AdminPage>
  );
}
