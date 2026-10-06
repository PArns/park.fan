import { FlaskConical } from 'lucide-react';
import type { ParkSimScenario } from '@/lib/parks/park-simulation';

/**
 * The band that says this page is simulated. `?state=` patches the park payload (a weather warning
 * not in force, a holiday that is not today), and the band shows in every screenshot so nothing on
 * the page is mistaken for real. Untranslated on purpose: production never renders it, and a
 * message key would ship into six locale bundles.
 */
export function ParkSimulationNotice({ scenarios }: { scenarios: ParkSimScenario[] }) {
  if (scenarios.length === 0) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-fuchsia-400/60 bg-fuchsia-50 px-3 py-2 text-xs text-fuchsia-900 dark:border-fuchsia-500/40 dark:bg-fuchsia-950/40 dark:text-fuchsia-200">
      <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <strong className="font-semibold">Simulierter Zustand</strong>
      <span className="opacity-80">
        Wetter, Ferien und Andrang auf dieser Seite sind erfunden, nicht gemessen:
      </span>
      <code className="rounded bg-fuchsia-500/15 px-1.5 py-0.5 font-mono">
        ?state={scenarios.join(',')}
      </code>
    </div>
  );
}
