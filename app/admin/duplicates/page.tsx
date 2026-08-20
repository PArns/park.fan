'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Copy, GitMerge, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminFetch, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import { useCan } from '../_app/session';
import { Section } from '../_lib/ui';
import { AdminPage, Chip, EmptyState, ErrorState, LoadingState } from '../_ui/primitives';
import { Field, TextInput } from '../_ui/controls';
import { useToast } from '../_ui/toast';

/**
 * Duplicate rows, and the one place they can be merged from.
 *
 * Two rows for one ride are not an internal tidiness problem: both appear in
 * the park's list on the public site, one of them with no wait time, and the
 * search suggests whichever it happens to hit. The detection and the merge
 * transaction have existed for a while — with a dry run, a recommended winner
 * and a safety verdict — reachable only by curl, which is why the catalogue
 * still has pairs in it.
 *
 * Nothing here merges in bulk. The backend supports it; a screen that offers
 * "merge all" invites exactly the case the verdict exists to prevent, and one
 * wrong merge deletes a row.
 */

interface DuplicatePair {
  parkId: string;
  parkName: string;
  baseSlug: string;
  suffixSlug: string;
  winnerId: string;
  loserId: string;
  survivingSlug: string;
  safe: boolean;
  reason: string;
}

interface DuplicateReport {
  total: number;
  safe: number;
  needsReview: number;
  pairs: DuplicatePair[];
}

function PairRow({ pair, canMerge }: { pair: DuplicatePair; canMerge: boolean }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [busy, setBusy] = useState<'dry' | 'live' | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function merge(dryRun: boolean) {
    setBusy(dryRun ? 'dry' : 'live');
    try {
      const result = await adminFetch<{ merged?: number; message?: string }>(
        '/api/admin/merge-duplicate-attractions',
        {
          method: 'POST',
          body: { winnerId: pair.winnerId, loserId: pair.loserId, dryRun },
        }
      );
      if (dryRun) {
        setPreview(result.message ?? 'Probelauf ohne Beanstandung.');
      } else {
        toast.push({ title: `${pair.baseSlug} zusammengeführt`, tone: 'success' });
        setConfirming(false);
        invalidate(['admin', 'duplicate-attractions']);
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

  return (
    <div className="border-border/60 bg-card rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <code className="text-sm font-medium">{pair.baseSlug}</code>
            <span className="text-muted-foreground text-xs">+</span>
            <code className="text-muted-foreground text-sm">{pair.suffixSlug}</code>
            {pair.safe ? <Chip tone="success">sicher</Chip> : <Chip tone="warning">prüfen</Chip>}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Bleibt: <code>{pair.survivingSlug}</code> · {pair.reason}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={`/admin/attractions/${pair.winnerId}`}
              className="border-border/60 hover:border-primary/50 hover:text-primary rounded-md border px-2 py-1 text-xs transition-colors"
            >
              Gewinner ansehen
            </Link>
            <Link
              href={`/admin/attractions/${pair.loserId}`}
              className="border-border/60 hover:border-primary/50 hover:text-primary rounded-md border px-2 py-1 text-xs transition-colors"
            >
              Verlierer ansehen
            </Link>
          </div>
        </div>

        {canMerge && !confirming && (
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => merge(true)} disabled={busy !== null}>
              {busy === 'dry' && <Loader2 className="h-4 w-4 animate-spin" />}
              Probelauf
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirming(true)}
              disabled={busy !== null || !pair.safe}
              title={
                pair.safe
                  ? undefined
                  : 'Als „prüfen" markierte Paare führt das Backend nicht zusammen.'
              }
            >
              <GitMerge className="h-4 w-4" /> Zusammenführen
            </Button>
          </div>
        )}
      </div>

      {preview && (
        <p className="border-border/60 text-muted-foreground mt-3 border-t pt-3 font-mono text-xs break-words">
          {preview}
        </p>
      )}

      {confirming && (
        <div className="border-destructive/40 bg-destructive/[0.06] mt-3 space-y-3 rounded-lg border p-3">
          <p className="text-sm font-medium">
            <code>{pair.suffixSlug}</code> in <code>{pair.survivingSlug}</code> überführen?
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Die verlierende Zeile wird gelöscht, ihre Wartezeiten und Verlaufsdaten wandern auf die
            bleibende. Das ist eine Transaktion und kein Undo.
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
    </div>
  );
}

function ParkMergePanel() {
  const toast = useToast();
  const [park1Id, setPark1Id] = useState('');
  const [park2Id, setPark2Id] = useState('');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function detect() {
    setBusy(true);
    setReport(null);
    try {
      // autoDetect false and no ids: the endpoint answers with what it found
      // without touching anything, which is the closest thing it has to a dry
      // run for parks.
      const result = await adminFetch<{ message: string; merged: number }>(
        '/api/admin/merge-duplicate-parks',
        { method: 'POST', body: { autoDetect: false } }
      );
      setReport(`${result.message} (${result.merged} zusammengeführt)`);
    } catch (err) {
      setReport(err instanceof Error ? err.message : 'Suche fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  async function mergePair() {
    setBusy(true);
    try {
      const result = await adminFetch<{ message: string; merged: number }>(
        '/api/admin/merge-duplicate-parks',
        { method: 'POST', body: { park1Id: park1Id.trim(), park2Id: park2Id.trim() } }
      );
      toast.push({ title: result.message, tone: 'success' });
      setPark1Id('');
      setPark2Id('');
      setConfirming(false);
    } catch (err) {
      toast.push({
        title: 'Zusammenführen fehlgeschlagen',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-border/60 bg-card space-y-3 rounded-lg border p-4">
      <p className="text-muted-foreground text-sm">
        Zwei Parkzeilen für denselben Park entstehen, wenn zwei Quellen ihn unterschiedlich
        benennen. Der Gewinner wird nach Wiki-Id, Zahl der Quellen, Zahl der Kinder und Alter
        bestimmt; kuratierte Felder und Saisons wandern mit, sofern die beiden Zeilen nah genug
        beieinander liegen, um derselbe Ort zu sein.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Park-Id (bleibt)" hint="Aus der Adresszeile des Park-Editors.">
          <TextInput value={park1Id} onChange={(event) => setPark1Id(event.target.value)} />
        </Field>
        <Field label="Park-Id (wird gelöscht)">
          <TextInput value={park2Id} onChange={(event) => setPark2Id(event.target.value)} />
        </Field>
      </div>

      {confirming ? (
        <div className="border-destructive/40 bg-destructive/[0.06] space-y-3 rounded-lg border p-3">
          <p className="text-sm font-medium">Parks endgültig zusammenführen?</p>
          <p className="text-muted-foreground text-xs">
            Die zweite Zeile verschwindet. Ihre Bahnen, Saisons und kuratierten Felder gehen auf die
            erste über, ihr bisheriger Pfad bleibt als Weiterleitung bestehen.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" autoFocus onClick={() => setConfirming(false)}>
              Abbrechen
            </Button>
            <Button
              size="sm"
              onClick={mergePair}
              disabled={busy}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Zusammenführen
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" onClick={detect} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Duplikate suchen
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirming(true)}
            disabled={busy || !park1Id.trim() || !park2Id.trim()}
          >
            <GitMerge className="h-4 w-4" /> Dieses Paar zusammenführen
          </Button>
        </div>
      )}

      {report && <p className="text-muted-foreground font-mono text-xs break-words">{report}</p>}
    </div>
  );
}

export default function DuplicatesPage() {
  const canMerge = useCan('owner');
  const query = useAdminQuery<DuplicateReport>(
    ['admin', 'duplicate-attractions'],
    '/api/admin/duplicate-attractions'
  );

  const byPark = useMemo(() => {
    const groups = new Map<string, { parkName: string; pairs: DuplicatePair[] }>();
    for (const pair of query.data?.pairs ?? []) {
      const group = groups.get(pair.parkId) ?? { parkName: pair.parkName, pairs: [] };
      group.pairs.push(pair);
      groups.set(pair.parkId, group);
    }
    return [...groups.entries()].sort((a, b) => a[1].parkName.localeCompare(b[1].parkName));
  }, [query.data]);

  return (
    <AdminPage width="wide">
      <>
        <Section
          icon={Copy}
          title="Doppelte Fahrgeschäfte"
          action={
            query.data ? (
              <div className="flex items-center gap-2">
                <Chip tone="success">{query.data.safe} sicher</Chip>
                {query.data.needsReview > 0 && (
                  <Chip tone="warning">{query.data.needsReview} prüfen</Chip>
                )}
              </div>
            ) : undefined
          }
        >
          <p className="text-muted-foreground text-sm">
            Zwei Zeilen für dieselbe Bahn, erkannt an Basis- und Suffix-Slug. Beide stehen auf der
            öffentlichen Parkseite, eine davon ohne Wartezeit.
          </p>

          {query.isError ? (
            <ErrorState message={query.error?.message ?? 'Laden fehlgeschlagen'} />
          ) : query.isLoading ? (
            <LoadingState label="Duplikate werden gesucht…" />
          ) : byPark.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Keine Duplikate"
              description="Kein Park hat zwei Zeilen für dasselbe Fahrgeschäft."
            />
          ) : (
            <div className="space-y-5">
              {byPark.map(([parkId, group]) => (
                <div key={parkId} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
                    <Link
                      href={`/admin/parks/${parkId}`}
                      className="hover:text-primary text-sm font-medium transition-colors"
                    >
                      {group.parkName}
                    </Link>
                    <span className="text-muted-foreground text-xs">
                      {group.pairs.length} {group.pairs.length === 1 ? 'Paar' : 'Paare'}
                    </span>
                  </div>
                  {group.pairs.map((pair) => (
                    <PairRow
                      key={`${pair.winnerId}:${pair.loserId}`}
                      pair={pair}
                      canMerge={canMerge}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {!canMerge && (
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Zusammenführen darf nur ein Owner.
            </p>
          )}
        </Section>

        {canMerge && (
          <Section icon={GitMerge} title="Doppelte Parks">
            <ParkMergePanel />
          </Section>
        )}
      </>
    </AdminPage>
  );
}
