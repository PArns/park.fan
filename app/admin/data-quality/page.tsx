'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, HeartPulse, Link2Off, ListX, ShieldCheck } from 'lucide-react';
import { useAdminFetch } from '../_lib/admin-context';
import { Section } from '../_lib/ui';
import { Chip, EmptyState, ErrorState, LoadingState } from '../_ui/primitives';
import { Select } from '../_ui/controls';

/**
 * What the backend already noticed and nobody could see.
 *
 * Three detectors were built, tested and left without a screen — a silenced
 * feed, a job that keeps dying, a glossary id a ride profile still points at.
 * All three describe the same kind of problem: something that is wrong now, is
 * not wrong enough to throw, and will stay wrong until a person looks. The
 * whole point of this page is to be the place that person looks.
 */

interface SilencedCluster {
  parkId: string;
  parkName: string;
  attractionCount: number;
  lastOperating: string;
  sampleNames: string[];
}

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

function day(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DataQualityPage() {
  const [windowDays, setWindowDays] = useState('14');
  const quality = useAdminFetch<DataQuality>(`/api/admin/data-quality?windowDays=${windowDays}`);
  const audit = useAdminFetch<TermAudit>('/api/admin/ride-profile-term-audit');

  const clusters = quality.data?.silencedClusters ?? [];
  const jobs = quality.data?.failingJobs ?? [];
  const broken = audit.data?.broken ?? [];

  return (
    <>
      <Section icon={HeartPulse} title="Verstummte Fahrgeschäfte">
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
              <div
                key={cluster.parkId}
                className="border-border/60 bg-card flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/parks/${cluster.parkId}`}
                      className="hover:text-primary font-medium transition-colors"
                    >
                      {cluster.parkName}
                    </Link>
                    <Chip tone="warning">{cluster.attractionCount} Bahnen</Chip>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Zuletzt in Betrieb: {day(cluster.lastOperating)}
                  </p>
                  {cluster.sampleNames.length > 0 && (
                    <p className="text-muted-foreground mt-1 truncate text-xs">
                      {cluster.sampleNames.join(', ')}
                    </p>
                  )}
                </div>
                <Link
                  href={`/admin/parks/${cluster.parkId}?tab=attractions`}
                  className="border-border/60 hover:border-primary/50 hover:text-primary shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  Bahnen ansehen
                </Link>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={ListX} title="Jobs, die scheitern">
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
                    {day(job.lastFailedAt)}
                  </span>
                </div>
                <p className="text-muted-foreground mt-2 font-mono text-xs break-words">
                  {job.lastReason}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Link2Off} title="Kaputte Glossar-Verweise">
        <p className="text-muted-foreground text-sm">
          Ride-Profile speichern Glossar-Term-Ids. Wird ein Term umbenannt oder entfernt, fällt der
          Verweis zur Laufzeit stillschweigend weg — die Bahn zeigt dann ein Element weniger, ohne
          dass irgendwo ein Fehler steht.
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
      </Section>
    </>
  );
}
