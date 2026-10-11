'use client';

import type { ModelComparisonReport } from '@/lib/api/admin-model-comparison';
import { StatTile } from '../../_ui/primitives';

/**
 * The model matrix in four counts: better than what the app shows today, still measuring, no
 * reliable difference, worse. Shown above the matrix and on the ML overview, so both read alike.
 */
export function MatrixSummary({ summary }: { summary: ModelComparisonReport['summary'] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        label="Besser als heute"
        value={<span className="text-emerald-600 dark:text-emerald-400">{summary.better}</span>}
        sub="warten auf Live-Bestätigung"
      />
      <StatTile
        label="Messung läuft"
        value={<span className="text-amber-600 dark:text-amber-400">{summary.pending}</span>}
        sub="Ergebnis kommt noch"
      />
      <StatTile
        label="Kein sicherer Unterschied"
        value={<span className="text-muted-foreground">{summary.unclear}</span>}
        sub="weder klar besser noch schlechter"
      />
      <StatTile
        label="Schlechter als heute"
        value={<span className="text-red-600 dark:text-red-400">{summary.worse}</span>}
        sub="bleibt, wie es ist"
      />
    </div>
  );
}
