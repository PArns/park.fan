'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, GitMerge, Loader2, Repeat, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminFetch, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import { useCan } from '../_app/session';
import { Section } from '../_lib/ui';
import { Chip, EmptyState, ErrorState, LoadingState } from '../_ui/primitives';
import { Field, TextInput } from '../_ui/controls';
import { useToast } from '../_ui/toast';
import { DroppedCurations, readDroppedCurations, type DroppedCuration } from './dropped-curations';

/**
 * Rides the feed may have re-issued under a new id AND a new name (API PAR-686).
 *
 * ThemeParks.wiki hands a seasonal maze a new id every season and often
 * renames it on the way — `HAUNTED HOUSE: SAW: Legacy of Terror` came back as
 * `SAW Legacy of Terror`. The sync only recognises an identical name, so the
 * old row stays retired with the history, and a new row starts from nothing.
 *
 * Every retired row with a younger live row within 30 m is listed, matching
 * name or not: Movie Park's Dutch pairs were real and match nothing, Walibi
 * Belgium's three 4D films are 0 m apart and are three films. The name chip is
 * a hint; the decision is made here, pair by pair, and a dismissed pair does
 * not come back.
 */

interface CandidateSide {
  attractionId: string;
  name: string;
  slug: string;
  externalId: string | null;
  createdAt: string;
  lastReading: string | null;
}

interface ReissueCandidate {
  parkId: string;
  parkName: string;
  previous: CandidateSide;
  current: CandidateSide;
  meters: number;
  namesMatch: boolean;
}

interface ReissueReport {
  total: number;
  namesMatch: number;
  candidates: ReissueCandidate[];
}

const QUERY_KEY = ['admin', 'reissue-candidates'];

function day(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Side({ label, side }: { label: string; side: CandidateSide }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</p>
      <Link
        href={`/admin/attractions/${side.attractionId}`}
        className="hover:text-primary block truncate text-sm font-medium transition-colors"
      >
        {side.name}
      </Link>
      <p className="text-muted-foreground truncate font-mono text-xs">{side.slug}</p>
      <p className="text-muted-foreground text-xs">
        angelegt {day(side.createdAt)} · zuletzt gemessen {day(side.lastReading)}
      </p>
      <p
        className="text-muted-foreground truncate font-mono text-[11px]"
        title={side.externalId ?? ''}
      >
        Wiki-Id {side.externalId ? side.externalId.slice(0, 8) : '—'}
      </p>
    </div>
  );
}

function CandidateRow({
  candidate,
  canMerge,
  canDismiss,
}: {
  candidate: ReissueCandidate;
  canMerge: boolean;
  canDismiss: boolean;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [busy, setBusy] = useState<'dry' | 'live' | 'dismiss' | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dropped, setDropped] = useState<DroppedCuration[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [reason, setReason] = useState('');

  const { previous, current } = candidate;

  async function merge(dryRun: boolean) {
    setBusy(dryRun ? 'dry' : 'live');
    if (dryRun) {
      setPreview(null);
      setDropped([]);
    }
    try {
      const result = await adminFetch<{
        survivingSlug?: string;
        removedSlug?: string;
        inheritedColumns?: string[];
        droppedCurations?: DroppedCuration[];
        message?: string;
      }>('/api/admin/merge-duplicate-attractions', {
        method: 'POST',
        // The retired row wins: it holds the history and the indexed slug.
        // `adoptLoserExternalId` puts it on the id the feed lists now —
        // without it the next sync grows the removed row back, because the
        // names differ and nothing else ties the two together.
        body: {
          winnerId: previous.attractionId,
          loserId: current.attractionId,
          adoptLoserExternalId: true,
          dryRun,
        },
      });
      if (dryRun) {
        setDropped(readDroppedCurations(result.droppedCurations));
        setPreview(
          result.survivingSlug
            ? [
                `Bleibt: ${result.survivingSlug}`,
                result.removedSlug && result.removedSlug !== result.survivingSlug
                  ? `Leitet um: ${result.removedSlug}`
                  : null,
                result.inheritedColumns?.length
                  ? `Übernimmt: ${result.inheritedColumns.join(', ')}`
                  : null,
                current.externalId ? `Neue Wiki-Id: ${current.externalId.slice(0, 8)}` : null,
              ]
                .filter(Boolean)
                .join(' · ')
            : (result.message ?? 'Probelauf ohne Beanstandung.')
        );
      } else {
        toast.push({ title: `${previous.name} zusammengeführt`, tone: 'success' });
        setConfirming(false);
        invalidate(QUERY_KEY);
      }
    } catch (err) {
      toast.push({
        title: dryRun ? 'Probelauf fehlgeschlagen' : 'Zusammenführen fehlgeschlagen',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    } finally {
      setBusy(null);
    }
  }

  async function dismiss() {
    setBusy('dismiss');
    try {
      await adminFetch('/api/admin/review-marks', {
        method: 'POST',
        body: {
          marks: [
            {
              kind: 'not_a_duplicate',
              attractionId: previous.attractionId,
              otherAttractionId: current.attractionId,
              reason: reason.trim(),
            },
          ],
        },
      });
      toast.push({ title: 'Als kein Duplikat markiert', tone: 'success' });
      setDismissing(false);
      invalidate(QUERY_KEY);
    } catch (err) {
      toast.push({
        title: 'Markieren fehlgeschlagen',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    } finally {
      setBusy(null);
    }
  }

  const idle = !confirming && !dismissing;

  return (
    <div className="border-border/60 bg-card rounded-lg border p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/parks/${candidate.parkId}`}
          className="hover:text-primary text-sm font-medium transition-colors"
        >
          {candidate.parkName}
        </Link>
        <Chip tone={candidate.namesMatch ? 'success' : 'muted'}>
          {candidate.namesMatch ? 'Name passt' : 'Name anders'}
        </Chip>
        <Chip tone="muted">{candidate.meters} m</Chip>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Side label="Stillgelegt (mit Historie)" side={previous} />
        <ArrowRight
          className="text-muted-foreground hidden h-4 w-4 shrink-0 self-center sm:block"
          aria-hidden="true"
        />
        <Side label="Neu im Feed" side={current} />
      </div>

      {idle && (canMerge || canDismiss) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {canMerge && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => merge(true)}
                disabled={busy !== null}
              >
                {busy === 'dry' && <Loader2 className="h-4 w-4 animate-spin" />}
                Probelauf
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirming(true)}
                disabled={busy !== null}
              >
                <GitMerge className="h-4 w-4" /> Zusammenführen
              </Button>
            </>
          )}
          {canDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissing(true)}
              disabled={busy !== null}
            >
              <XCircle className="h-4 w-4" /> Kein Duplikat
            </Button>
          )}
        </div>
      )}

      {preview && (
        <p className="border-border/60 text-muted-foreground mt-3 border-t pt-3 font-mono text-xs break-words">
          {preview}
        </p>
      )}

      {dropped.length > 0 && <DroppedCurations entries={dropped} />}

      {confirming && (
        <div className="border-destructive/40 bg-destructive/[0.06] mt-3 space-y-3 rounded-lg border p-3">
          <p className="text-sm font-medium">
            <code>{current.slug}</code> in <code>{previous.slug}</code> überführen?
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Die neue Zeile wird gelöscht, ihre Daten wandern auf die alte, und die alte übernimmt
            die Wiki-Id, die der Feed jetzt meldet. Der alte Slug bleibt, der neue leitet um. Eine
            Transaktion, kein Undo.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" autoFocus onClick={() => setConfirming(false)}>
              Abbrechen
            </Button>
            <Button
              size="sm"
              onClick={() => merge(false)}
              disabled={busy !== null}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {busy === 'live' && <Loader2 className="h-4 w-4 animate-spin" />}
              Endgültig zusammenführen
            </Button>
          </div>
        </div>
      )}

      {dismissing && (
        <div className="border-border/60 mt-3 space-y-3 rounded-lg border p-3">
          <Field
            label="Warum zwei verschiedene Dinge?"
            hint="Mit Quelle. Das Paar taucht danach nicht wieder auf."
          >
            <TextInput
              value={reason}
              autoFocus
              onChange={(event) => setReason(event.target.value)}
              placeholder="z. B. zwei Filme im selben 4D-Kino, Quelle: walibi.be"
            />
          </Field>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setDismissing(false)}>
              Abbrechen
            </Button>
            <Button size="sm" onClick={dismiss} disabled={busy !== null || !reason.trim()}>
              {busy === 'dismiss' && <Loader2 className="h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Duplicates section listing retired rides with a younger live ride within 30 m, pair by pair:
 * merge into the retired row after a dry run (`canMerge`), or mark as not a duplicate (editor and
 * up).
 */
export function ReissueCandidatesSection({ canMerge }: { canMerge: boolean }) {
  const canDismiss = useCan('editor');
  const query = useAdminQuery<ReissueReport>(QUERY_KEY, '/api/admin/reissue-candidates');
  const candidates = query.data?.candidates ?? [];

  return (
    <Section
      icon={Repeat}
      title="Neu ausgegeben unter anderem Namen?"
      action={
        query.data ? (
          <div className="flex items-center gap-2">
            <Chip tone="success">{query.data.namesMatch} Name passt</Chip>
            <Chip tone="muted">{query.data.total} in der Nähe</Chip>
          </div>
        ) : undefined
      }
    >
      <p className="text-muted-foreground text-sm">
        Stillgelegte Bahnen, neben denen innerhalb von 30 m eine jüngere Bahn läuft. ThemeParks.wiki
        gibt Saison-Attraktionen jedes Jahr unter neuer Id aus und benennt sie dabei oft um, dann
        erkennt der Sync sie nicht wieder. „Name passt“ ist nur ein Hinweis: Im selben Gebäude
        stehen oft zwei verschiedene Dinge, und eine Übersetzung passt nie.
      </p>

      {query.isError ? (
        <ErrorState message={query.error?.message ?? 'Laden fehlgeschlagen'} />
      ) : query.isLoading ? (
        <LoadingState label="Kandidaten werden gesucht…" />
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Keine Kandidaten"
          description="Neben keiner stillgelegten Bahn läuft eine jüngere."
        />
      ) : (
        <div className="space-y-2">
          {candidates.map((candidate) => (
            <CandidateRow
              key={`${candidate.previous.attractionId}:${candidate.current.attractionId}`}
              candidate={candidate}
              canMerge={canMerge}
              canDismiss={canDismiss}
            />
          ))}
        </div>
      )}
    </Section>
  );
}
