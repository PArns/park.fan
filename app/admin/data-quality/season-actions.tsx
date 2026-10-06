'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarCheck2, Loader2, Trash2, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { adminFetch, useInvalidateAdmin } from '../_lib/api';
import { formatDay } from '../_lib/ui';
import { Chip } from '../_ui/primitives';
import { useToast } from '../_ui/toast';

/**
 * The answers to the two questions `/admin/data-quality` asks about rides
 * (PAR-695): "season ending or dropped feed?" and "season or gone?".
 *
 * Both write the same two curated columns through the bulk curation endpoint —
 * audited, cache-evicting, revalidating — so a card answered here disappears
 * on the next read and stays answered: the absence retirement and the silence
 * detector both skip a ride whose season is known.
 */

export const DATA_QUALITY_KEY = ['admin', 'data-quality'];

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

const PRESETS: { label: string; months: number[] }[] = [
  { label: 'Halloween', months: [9, 10, 11] },
  { label: 'Winter', months: [12, 1] },
  { label: 'Sommer', months: [5, 6, 7, 8, 9] },
];

/** Twelve toggles and three presets. Empty means "seasonal, months unknown". */
function MonthPicker({ value, onChange }: { value: number[]; onChange: (next: number[]) => void }) {
  const toggle = (month: number) =>
    onChange(
      value.includes(month)
        ? value.filter((m) => m !== month)
        : [...value, month].sort((a, b) => a - b)
    );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.months)}
            className="border-border/60 hover:border-primary/50 hover:text-primary rounded-md border px-2 py-1 text-xs transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-1 sm:grid-cols-12">
        {MONTHS.map((label, index) => {
          const month = index + 1;
          const on = value.includes(month);
          return (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(month)}
              className={cn(
                'rounded-md border px-1.5 py-1 text-xs transition-colors',
                on
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border/60 text-muted-foreground hover:border-primary/50'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Writes `curatedIsSeasonal` (+ months) for rides of one park, then refreshes the page. */
function useSeasonWrite() {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [busy, setBusy] = useState(false);

  async function write(
    parkId: string,
    attractionIds: string[],
    seasonal: boolean,
    months: number[],
    reason: string,
    success: string
  ): Promise<boolean> {
    setBusy(true);
    try {
      await adminFetch(`/api/admin/content/parks/${parkId}/attractions`, {
        method: 'PATCH',
        body: {
          entries: attractionIds.map((id) => ({
            id,
            fields: seasonal
              ? { curatedIsSeasonal: true, curatedSeasonMonths: months.length ? months : null }
              : { curatedIsSeasonal: false },
          })),
          reason,
        },
      });
      toast.push({ title: success, tone: 'success' });
      invalidate(DATA_QUALITY_KEY);
      return true;
    } catch (err) {
      toast.push({
        title: 'Speichern fehlgeschlagen',
        description: err instanceof Error ? err.message : undefined,
        tone: 'error',
      });
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { write, busy };
}

function monthsLabel(months: number[]): string {
  return months.length ? months.map((m) => MONTHS[m - 1]).join(', ') : 'Monate unbekannt';
}

// ── Verstummte Fahrgeschäfte ───────────────────────────────────────────────

export interface SilencedCluster {
  parkId: string;
  parkName: string;
  attractionCount: number;
  lastOperating: string;
  sampleNames: string[];
  /** Absent until the API with PAR-695 is deployed. */
  attractions?: { attractionId: string; name: string }[];
}

/**
 * Data-quality card for a group of a park's rides that went silent together, asking "season ending
 * or dropped feed?": sets the season months for all of them in one write, or explains the feed
 * case.
 */
export function SilencedClusterCard({
  cluster,
  lastOperatingLabel,
}: {
  cluster: SilencedCluster;
  lastOperatingLabel: string;
}) {
  const { write, busy } = useSeasonWrite();
  const [mode, setMode] = useState<'idle' | 'season' | 'feed'>('idle');
  const [months, setMonths] = useState<number[]>([]);
  const rides = cluster.attractions ?? [];

  return (
    <div className="border-border/60 bg-card rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/parks/${cluster.parkId}?tab=attractions`}
          className="hover:text-primary font-medium transition-colors"
        >
          {cluster.parkName}
        </Link>
        <Chip tone="warning">{cluster.attractionCount} Bahnen</Chip>
        <span className="text-muted-foreground text-xs">
          zuletzt in Betrieb {lastOperatingLabel}
        </span>
      </div>

      <p className="mt-2 text-sm font-medium">Saisonende oder abgerissener Feed?</p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {(rides.length
          ? rides
          : cluster.sampleNames.map((name) => ({ attractionId: name, name }))
        ).map((ride) =>
          rides.length ? (
            <Link
              key={ride.attractionId}
              href={`/admin/attractions/${ride.attractionId}`}
              className="border-border/60 hover:border-primary/50 hover:text-primary rounded-md border px-2 py-0.5 text-xs transition-colors"
            >
              {ride.name}
            </Link>
          ) : (
            <span key={ride.name} className="text-muted-foreground text-xs">
              {ride.name}
            </span>
          )
        )}
      </div>

      {mode === 'idle' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => setMode('season')}
            disabled={rides.length === 0}
            title={rides.length === 0 ? 'Braucht die neue API (PAR-695).' : undefined}
          >
            <CalendarCheck2 className="h-4 w-4" /> Saisonende – Saison setzen
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode('feed')}>
            <Unplug className="h-4 w-4" /> Feed-Problem
          </Button>
        </div>
      )}

      {mode === 'season' && (
        <div className="border-border/60 mt-3 space-y-3 rounded-lg border p-3">
          <p className="text-xs">
            In welchen Monaten laufen diese {rides.length} Bahnen? Danach zählen sie nicht mehr als
            verstummt und werden außerhalb der Saison nicht stillgelegt.
          </p>
          <MonthPicker value={months} onChange={setMonths} />
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setMode('idle')}>
              Abbrechen
            </Button>
            <Button
              size="sm"
              disabled={busy}
              onClick={async () => {
                const ok = await write(
                  cluster.parkId,
                  rides.map((r) => r.attractionId),
                  true,
                  months,
                  `Datenqualität: Saisonende, ${rides.length} Bahnen gleichzeitig verstummt (${monthsLabel(months)})`,
                  `${cluster.parkName}: Saison für ${rides.length} Bahnen gesetzt`
                );
                if (ok) setMode('idle');
              }}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Für {rides.length} Bahnen speichern ({monthsLabel(months)})
            </Button>
          </div>
        </div>
      )}

      {mode === 'feed' && (
        <div className="border-border/60 text-muted-foreground mt-3 space-y-2 rounded-lg border p-3 text-xs">
          <p>
            Dann liefert ThemeParks.wiki diese Bahnen nicht mehr, der Rest des Parks schon. Im Admin
            gibt es dafür nichts zu reparieren: Melden die Bahnen wieder, verschwindet die Karte von
            selbst, spätestens nach dem gewählten Zeitfenster.
          </p>
          <Button size="sm" variant="ghost" onClick={() => setMode('idle')}>
            Verstanden
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Saison oder weg? ───────────────────────────────────────────────────────

export interface AbsenceRetiredUnreviewed {
  attractionId: string;
  name: string;
  slug: string;
  parkId: string;
  parkName: string;
  retiredAt: string;
  lastReading: string | null;
}

function UnreviewedRide({ row }: { row: AbsenceRetiredUnreviewed }) {
  const { write, busy } = useSeasonWrite();
  const [picking, setPicking] = useState(false);
  const [months, setMonths] = useState<number[]>([]);

  return (
    <li className="border-border/60 rounded-md border p-2">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/attractions/${row.attractionId}`}
          className="hover:text-primary min-w-0 flex-1 truncate text-sm transition-colors"
        >
          {row.name}
        </Link>
        <span className="text-muted-foreground text-xs">
          zuletzt gemessen {formatDay(row.lastReading)}
        </span>
        {!picking && (
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setPicking(true)} disabled={busy}>
              <CalendarCheck2 className="h-4 w-4" /> Kommt wieder
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() =>
                write(
                  row.parkId,
                  [row.attractionId],
                  false,
                  [],
                  'Datenqualität „Saison oder weg?“: ist weg',
                  `${row.name}: als weg markiert`
                )
              }
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{' '}
              Ist weg
            </Button>
          </div>
        )}
      </div>
      {picking && (
        <div className="mt-2 space-y-2">
          <MonthPicker value={months} onChange={setMonths} />
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPicking(false)}>
              Abbrechen
            </Button>
            <Button
              size="sm"
              disabled={busy}
              onClick={async () => {
                const ok = await write(
                  row.parkId,
                  [row.attractionId],
                  true,
                  months,
                  `Datenqualität „Saison oder weg?“: kommt wieder (${monthsLabel(months)})`,
                  `${row.name}: Saison gesetzt`
                );
                if (ok) setPicking(false);
              }}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Speichern ({monthsLabel(months)})
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * Data-quality card for one park's rides retired for absence and not yet reviewed: per ride (or all
 * at once) mark it as gone, or as seasonal with its months.
 */
export function UnreviewedParkCard({ rows }: { rows: AbsenceRetiredUnreviewed[] }) {
  const { write, busy } = useSeasonWrite();
  const [confirmAll, setConfirmAll] = useState(false);
  const park = rows[0];

  return (
    <div className="border-border/60 bg-card rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/parks/${park.parkId}?tab=attractions`}
          className="hover:text-primary font-medium transition-colors"
        >
          {park.parkName}
        </Link>
        <Chip tone="warning">
          {rows.length} {rows.length === 1 ? 'Bahn' : 'Bahnen'}
        </Chip>
        {rows.length > 1 &&
          (confirmAll ? (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs">Alle {rows.length} als weg markieren?</span>
              <Button size="sm" variant="ghost" onClick={() => setConfirmAll(false)}>
                Abbrechen
              </Button>
              <Button
                size="sm"
                disabled={busy}
                onClick={async () => {
                  const ok = await write(
                    park.parkId,
                    rows.map((r) => r.attractionId),
                    false,
                    [],
                    'Datenqualität „Saison oder weg?“: alle Bahnen des Parks sind weg',
                    `${park.parkName}: ${rows.length} Bahnen als weg markiert`
                  );
                  if (ok) setConfirmAll(false);
                }}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Ja, alle weg
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => setConfirmAll(true)}
            >
              <Trash2 className="h-4 w-4" /> Alle: ist weg
            </Button>
          ))}
      </div>
      <ul className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <UnreviewedRide key={row.attractionId} row={row} />
        ))}
      </ul>
    </div>
  );
}
