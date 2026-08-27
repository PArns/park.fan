import { FlaskConical } from 'lucide-react';
import type { ParkSimScenario } from '@/lib/parks/park-simulation';

/**
 * The band that says this page is lying.
 *
 * `?state=` patches the park payload — a severe-weather warning that is not in force, a public
 * holiday that is not today. Nothing else in this app fabricates data, and the reason a
 * simulated page is safe to look at is that it announces itself: a screenshot of a preview
 * deployment carries this band, so a warning in it can never be mistaken for one the DWD issued.
 *
 * Deliberately untranslated. It is not part of the product, and a string in `messages/*.json`
 * would ship into six locale bundles for a band production never renders.
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
