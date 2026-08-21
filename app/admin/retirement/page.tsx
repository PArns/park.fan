'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Archive, CheckCircle2, Loader2, RotateCcw, Search, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminFetch, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import { useCan } from '../_app/session';
import { Section } from '../_lib/ui';
import { AdminPage, Chip, EmptyState, ErrorState, LoadingState } from '../_ui/primitives';
import { Field, TextInput } from '../_ui/controls';
import {
  RETIREMENT_KEYS,
  RETIRE_REASON_REQUIRED,
  retireAttraction,
  today,
  unretireAttraction,
} from '../_ui/retirement';
import { useToast } from '../_ui/toast';

/**
 * The worklist for rides that stopped reporting.
 *
 * The detection has been running for months and the answer it produces is a
 * question, not a fact: a feed going quiet looks the same whether the ride was
 * demolished, is in a nine-month refurbishment, or the park changed a name
 * upstream. Five endpoints existed to settle that question and none of them
 * had a screen, so the same candidates came back every run and nobody could
 * mark one as investigated.
 *
 * Hence three actions per row, not one. "Stillgelegt" is the destructive
 * answer, "kein Fall" is the one that stops the detector re-asking, and the
 * link into the editor is for the third case — where the answer is a curation,
 * not a retirement.
 */

interface Candidate {
  attractionId: string;
  park: string;
  name: string;
  wentSilent: string;
  maxWait: number;
}

interface Retired {
  id: string;
  name: string;
  park: string | null;
  retiredAt: string | null;
  reason: string | null;
}

function day(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Three months out — the default for "look at this again later". */
function inThreeMonths(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString().slice(0, 10);
}

function CandidateRow({ candidate, canRetire }: { candidate: Candidate; canRetire: boolean }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [mode, setMode] = useState<'idle' | 'retire' | 'clear'>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retiredAt, setRetiredAt] = useState(today);
  const [reason, setReason] = useState('');
  const [recheckAfter, setRecheckAfter] = useState(inThreeMonths);

  async function retire() {
    if (!reason.trim()) {
      setError(RETIRE_REASON_REQUIRED);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await retireAttraction({
        attractionId: candidate.attractionId,
        retiredAt,
        reason: reason.trim(),
      });
      toast.push({ title: `${candidate.name} stillgelegt`, tone: 'success' });
      invalidate(...RETIREMENT_KEYS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stilllegen fehlgeschlagen');
      setBusy(false);
    }
  }

  async function clearCandidate() {
    if (!reason.trim()) {
      setError(
        'Warum ist es kein Fall? Das liest die nächste Person, die es wieder vorgelegt bekommt.'
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminFetch('/api/admin/review-marks', {
        method: 'POST',
        body: {
          marks: [
            {
              kind: 'not_retired',
              attractionId: candidate.attractionId,
              reason: reason.trim(),
              // A permanent mark would hide the eventual real retirement
              // forever, so the default is a date rather than "never again".
              recheckAfter: recheckAfter || null,
            },
          ],
        },
      });
      toast.push({ title: `${candidate.name} als geprüft vermerkt`, tone: 'success' });
      invalidate(['admin', 'retirement-candidates']);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vermerk fehlgeschlagen');
      setBusy(false);
    }
  }

  return (
    <div className="border-border/60 bg-card rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/attractions/${candidate.attractionId}`}
              className="hover:text-primary font-medium transition-colors"
            >
              {candidate.name}
            </Link>
            <span className="text-muted-foreground text-xs">{candidate.park}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Still seit {day(candidate.wentSilent)} · zuletzt {candidate.maxWait} min Wartezeit
          </p>
        </div>
        {mode === 'idle' && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setMode('clear')}>
              Kein Fall
            </Button>
            {canRetire && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMode('retire')}
                className="text-destructive hover:text-destructive"
              >
                <Archive className="h-4 w-4" /> Stilllegen
              </Button>
            )}
          </div>
        )}
      </div>

      {mode !== 'idle' && (
        <div className="border-border/60 mt-3 space-y-3 border-t pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {mode === 'retire' ? (
              <Field label="Stillgelegt am" hint="Der Tag, den eine Quelle nennt.">
                <TextInput
                  type="date"
                  value={retiredAt}
                  onChange={(event) => setRetiredAt(event.target.value)}
                />
              </Field>
            ) : (
              <Field
                label="Erneut prüfen ab"
                hint="Leer heißt: nie wieder fragen. Das versteckt eine spätere echte Stilllegung."
              >
                <TextInput
                  type="date"
                  value={recheckAfter}
                  onChange={(event) => setRecheckAfter(event.target.value)}
                />
              </Field>
            )}
            <Field
              label={mode === 'retire' ? 'Grund und Quelle' : 'Was hast du festgestellt?'}
              hint={
                mode === 'retire'
                  ? 'z. B. „Abriss angekündigt, parkfan.example/news/…"'
                  : 'z. B. „Umbau bis Frühjahr, Aushang am Eingang"'
              }
            >
              <TextInput value={reason} onChange={(event) => setReason(event.target.value)} />
            </Field>
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={mode === 'retire' ? retire : clearCandidate}
              disabled={busy}
              className={
                mode === 'retire' ? 'bg-destructive hover:bg-destructive/90 text-white' : ''
              }
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'retire' ? 'Stilllegen' : 'Als geprüft vermerken'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setMode('idle');
                setError(null);
              }}
              disabled={busy}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RetiredRow({ entry, canRestore }: { entry: Retired; canRestore: boolean }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [busy, setBusy] = useState(false);

  async function restore() {
    setBusy(true);
    try {
      await unretireAttraction(entry.id);
      toast.push({ title: `${entry.name} zurückgeholt`, tone: 'success' });
      invalidate(...RETIREMENT_KEYS);
    } catch (err) {
      toast.push({
        title: 'Zurückholen fehlgeschlagen',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
      setBusy(false);
    }
  }

  return (
    <div className="border-border/60 bg-card flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2">
      <Link
        href={`/admin/attractions/${entry.id}`}
        className="hover:text-primary min-w-0 flex-1 truncate text-sm font-medium transition-colors"
      >
        {entry.name}
        {entry.park && <span className="text-muted-foreground"> · {entry.park}</span>}
      </Link>
      <span className="text-muted-foreground text-xs">{day(entry.retiredAt)}</span>
      {entry.reason && (
        <span className="text-muted-foreground max-w-md truncate text-xs">{entry.reason}</span>
      )}
      {canRestore && (
        <Button size="sm" variant="ghost" onClick={restore} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
          Zurückholen
        </Button>
      )}
    </div>
  );
}

export default function RetirementPage() {
  const canRetire = useCan('owner');
  const candidates = useAdminQuery<{ total: number; candidates: Candidate[] }>(
    ['admin', 'retirement-candidates'],
    '/api/admin/retirement-candidates'
  );
  const retired = useAdminQuery<{ total: number; attractions: Retired[] }>(
    ['admin', 'retired-attractions'],
    '/api/admin/retired-attractions'
  );

  return (
    <AdminPage width="wide">
      <>
        <Section icon={Search} title="Verdachtsfälle">
          <p className="text-muted-foreground text-sm">
            Fahrgeschäfte, deren Feed verstummt ist und die noch niemand beurteilt hat. Ein
            verstummter Feed beschreibt die Quelle, nicht die Welt: abgerissen, im Umbau und
            umbenannt sehen von außen gleich aus.
          </p>

          {candidates.isError ? (
            <ErrorState message={candidates.error?.message ?? 'Laden fehlgeschlagen'} />
          ) : candidates.isLoading ? (
            <LoadingState label="Verdachtsfälle werden geladen…" />
          ) : (candidates.data?.candidates?.length ?? 0) === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nichts offen"
              description="Jeder Verdachtsfall ist entweder stillgelegt oder als geprüft vermerkt."
            />
          ) : (
            <div className="space-y-2">
              {candidates.data?.candidates?.map((candidate) => (
                <CandidateRow
                  key={candidate.attractionId}
                  candidate={candidate}
                  canRetire={canRetire}
                />
              ))}
            </div>
          )}
        </Section>

        <Section
          icon={Archive}
          title="Stillgelegt"
          action={retired.data ? <Chip>{retired.data.total}</Chip> : undefined}
        >
          {retired.isError ? (
            <ErrorState message={retired.error?.message ?? 'Laden fehlgeschlagen'} />
          ) : retired.isLoading ? (
            <LoadingState />
          ) : (retired.data?.attractions?.length ?? 0) === 0 ? (
            <EmptyState
              icon={RotateCcw}
              title="Nichts stillgelegt"
              description="Sobald etwas stillgelegt wird, steht es hier, mitsamt dem Weg zurück."
            />
          ) : (
            <div className="space-y-1.5">
              {retired.data?.attractions?.map((entry) => (
                <RetiredRow key={entry.id} entry={entry} canRestore={canRetire} />
              ))}
            </div>
          )}
        </Section>
      </>
    </AdminPage>
  );
}
