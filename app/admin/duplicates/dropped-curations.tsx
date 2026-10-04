'use client';

import { AlertTriangle } from 'lucide-react';

/**
 * A curated row the merge would delete for good. `from` names the side that
 * loses it: `'loser'` is the row that disappears anyway, `'winner'` is the
 * row of the ride that stays, because the richer row wins the merge.
 */
export interface DroppedCuration {
  table: string;
  from: 'winner' | 'loser';
  row: Record<string, unknown>;
}

/** The API is older than this screen in some deployments; drop anything that is not a row. */
export function readDroppedCurations(value: unknown): DroppedCuration[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is DroppedCuration =>
      !!entry && typeof entry.table === 'string' && !!entry.row && typeof entry.row === 'object'
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '–';
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * What a rehearsal says the merge would destroy. The row content is printed
 * in full: it is the only way to write the curation back by hand afterwards.
 */
export function DroppedCurations({ entries }: { entries: DroppedCuration[] }) {
  return (
    <div
      role="alert"
      className="border-destructive/40 bg-destructive/[0.06] mt-3 space-y-3 rounded-lg border p-3"
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="text-destructive h-4 w-4 shrink-0" />
        Verlust: Der Merge löscht{' '}
        {entries.length === 1
          ? 'eine kuratierte Zeile'
          : `${entries.length} kuratierte Zeilen`}{' '}
        unwiederbringlich
      </p>
      <ul className="space-y-3">
        {entries.map((entry, index) => (
          <li key={`${entry.table}-${index}`} className="space-y-1.5">
            <p className="text-xs">
              <code>{entry.table}</code>
              {' · '}
              {entry.from === 'winner' && 'Verloren geht die Zeile der Bahn, die bleibt.'}
              {entry.from === 'loser' && 'Verloren geht die Zeile der Bahn, die verschwindet.'}
            </p>
            <dl className="bg-background/60 grid grid-cols-[minmax(0,max-content)_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-md p-2 font-mono text-xs">
              {Object.entries(entry.row).map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="break-words whitespace-pre-wrap">{formatCell(value)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
