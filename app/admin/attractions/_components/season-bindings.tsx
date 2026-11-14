'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarRange, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEASON_STATUS_TONE } from '@/components/parks/season-headline';
import { parkDayOf } from '@/lib/utils/park-day';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../../_lib/api';
import {
  SEASON_STATUS_LABELS,
  bindableSeasons,
  seasonRideMode,
  seasonListPath,
  seasonRidePatch,
  seasonTitle,
} from '../../_lib/seasons';
import type { CuratedField, ParkSeason } from '../../_lib/types';
import type { SeasonRideMode } from '../../_lib/seasons';
import { Segmented } from '../../_ui/controls';
import { Chip, Notice } from '../../_ui/primitives';
import { useToast } from '../../_ui/toast';
import { SeasonEditor } from '../../seasons/_components/season-editor';
import { SeasonSummary } from '../../seasons/_components/season-summary';

/** The three ways a season can hold this ride, as the row's segmented control offers them. */
const MODES: ReadonlyArray<{ value: SeasonRideMode; label: string; title: string }> = [
  { value: 'none', label: '—', title: 'Nicht gebunden' },
  { value: 'only', label: 'Nur während', title: 'Die Bahn gibt es nur in dieser Saison' },
  { value: 'paused', label: 'Nicht während', title: 'Die Bahn schließt für diese Saison' },
];

/** The toast after a change, by what the ride is now. */
const MODE_SAVED: Record<SeasonRideMode, string> = {
  none: 'Bindung gelöst',
  only: 'Läuft nur während der Saison',
  paused: 'Pausiert während der Saison',
};

/**
 * Why a binding changes nothing, in the order of the API's resolver (`resolveCuratedFacts`): the
 * ride's own page is the most specific statement, so its curated months or curated „Nein“ win.
 */
const OUTRANKED = {
  months:
    'Kuratierte Monate haben Vorrang vor der Saison-Bindung. Solange „Betriebsmonate“ gesetzt sind, gelten sie und nicht die Tage der Saison.',
  no: 'Ein kuratiertes „Nein“ bei „Saisonal“ hat Vorrang vor der Saison-Bindung. Solange es gesetzt ist, gilt die Bahn als ganzjährig.',
  both: 'Kuratierte Monate und ein kuratiertes „Nein“ haben Vorrang vor der Saison-Bindung. Solange sie gesetzt sind, ändert die Bindung nichts an der Bahn.',
} as const;

/** What of the ride's own curation outranks a binding, read from its saved curated fields. */
function curatedSeason(fields: readonly CuratedField[]) {
  const months = fields.find((field) => field.key === 'curatedSeasonMonths')?.curatedValue;
  const seasonal = fields.find((field) => field.key === 'curatedIsSeasonal')?.curatedValue;
  return {
    months: Array.isArray(months) && months.length > 0,
    no: seasonal === false,
  };
}

/**
 * „An Saison gebunden“, under the „Saison“ fields of a ride: the running and coming seasons of its
 * park that can bind a ride (`bindableSeasons`), each with its icon, name, dates and status and
 * „—“, „Nur während“ or „Nicht während“: the ride in the season's `attractionIds`, in its
 * `pausedAttractionIds` or in neither (`seasonRidePatch`). Those are the lists the season form's two
 * ride pickers edit, written through the same `PATCH seasons/:id`, so the two cannot disagree. A
 * season's name opens the shared season form.
 *
 * The ride's own curation outranks a binding (the API's `resolveCuratedFacts`): curated months or a
 * curated „Nein“ decide over every season, so a bound ride with either says so, with the button
 * that clears it. Read-only below `editor`; the API's refusal is shown as it words it.
 */
export function SeasonBindings({
  attractionId,
  park,
  fields,
  canEdit,
}: {
  attractionId: string;
  park: { id: string; name: string };
  fields: readonly CuratedField[];
  canEdit: boolean;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ParkSeason | null>(null);
  // The editor's own day: a season that ended yesterday in the park's zone may show a day longer.
  const [today] = useState(() => parkDayOf(Date.now(), undefined));

  const path = seasonListPath({
    year: null,
    kind: null,
    status: null,
    region: null,
    parkId: park.id,
    current: false,
  });
  const seasons = useAdminQuery<{ seasons: ParkSeason[]; total: number }>(
    adminKeys.seasons({ path }),
    path
  );
  const shown = bindableSeasons(seasons.data?.seasons ?? [], today);
  const bound = shown.some((season) => seasonRideMode(season, attractionId) !== 'none');
  const curated = curatedSeason(fields);
  const outranked = bound && (curated.months || curated.no);

  /** The caches a binding changes: the seasons, the park and its ride list, this ride, the log. */
  const refresh = () =>
    invalidate(
      adminKeys.seasons(),
      adminKeys.park(park.id),
      adminKeys.attraction(attractionId),
      adminKeys.history()
    );

  async function choose(season: ParkSeason, mode: SeasonRideMode) {
    if (busy || mode === seasonRideMode(season, attractionId)) return;
    setBusy(season.id);
    setError(null);
    try {
      await adminFetch(`/api/admin/content/seasons/${season.id}`, {
        method: 'PATCH',
        body: seasonRidePatch(season, attractionId, mode),
      });
      refresh();
      toast.push({ title: MODE_SAVED[mode], tone: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setBusy(null);
    }
  }

  async function clearCuration() {
    if (busy) return;
    setBusy('curation');
    setError(null);
    try {
      await adminFetch(`/api/admin/content/attractions/${attractionId}`, {
        method: 'PATCH',
        body: {
          fields: {
            ...(curated.months && { curatedSeasonMonths: null }),
            ...(curated.no && { curatedIsSeasonal: null }),
          },
          reason: 'Die Saison-Bindung soll gelten.',
        },
      });
      refresh();
      toast.push({ title: 'Die Saison-Bindung gilt jetzt', tone: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="border-border/50 mt-4 space-y-2 border-t px-3 pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-medium">An Saison gebunden</h4>
        <Link
          href={`/admin/seasons?parkId=${park.id}&year=all`}
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          Alle Saisons von {park.name}
        </Link>
      </div>
      <p className="text-muted-foreground text-xs">
        „Nur während“: die Bahn gibt es nur in der Saison (Eisbahn, Maze), außerhalb ihrer Tage gilt
        sie als außer Saison. „Nicht während“: die Bahn läuft das ganze Jahr und schließt für die
        Saison (River Quest während Wintertraum). Eine Bahn, die das Event nur umgestaltet, gehört
        zu keinem von beiden.
      </p>

      {outranked && (
        <Notice>
          <p>
            {OUTRANKED[curated.months && curated.no ? 'both' : curated.months ? 'months' : 'no']}
          </p>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={busy !== null}
              onClick={() => void clearCuration()}
            >
              {busy === 'curation' && <Loader2 className="h-4 w-4 animate-spin" />}
              {curated.months && curated.no
                ? 'Monate und „Nein“ zurücksetzen'
                : curated.months
                  ? 'Monate zurücksetzen'
                  : '„Nein“ zurücksetzen'}
            </Button>
          )}
        </Notice>
      )}

      {error && (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      )}

      {seasons.isError ? (
        <p className="text-destructive text-xs">{seasons.error.message}</p>
      ) : seasons.isLoading ? (
        <p className="text-muted-foreground text-xs">Saisons werden geladen…</p>
      ) : shown.length === 0 ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <CalendarRange className="h-3.5 w-3.5" aria-hidden />
          Keine laufende oder kommende Saison, an die sich eine Bahn binden lässt.
        </p>
      ) : (
        <ul className="divide-border/40 divide-y">
          {shown.map((season) => {
            return (
              <li key={season.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <Segmented
                  label={`„${seasonTitle(season)}“ und diese Bahn`}
                  options={MODES}
                  value={seasonRideMode(season, attractionId)}
                  onChange={(mode) => void choose(season, mode)}
                  disabled={!canEdit || busy !== null}
                />
                <button
                  type="button"
                  onClick={() => setEditing(season)}
                  className="hover:text-primary flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm"
                  title="Saison öffnen"
                >
                  <SeasonSummary season={season} />
                  <Pencil className="text-muted-foreground h-3 w-3 shrink-0" aria-hidden />
                </button>
                <Chip className={SEASON_STATUS_TONE[season.status]}>
                  {SEASON_STATUS_LABELS[season.status] ?? season.status}
                </Chip>
                {busy === season.id && (
                  <Loader2 className="text-muted-foreground h-3.5 w-3.5 animate-spin" />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <SeasonEditor
          season={editing}
          parkId={park.id}
          parkName={park.name}
          canEdit={canEdit}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
