'use client';

import { SlidersHorizontal } from 'lucide-react';
import type { MlBandCalibration } from '@/lib/api/admin-ml-overview';
import { formatCoverageChange, formatLastRun, formatShare } from '@/lib/admin/ml-overview';
import { formatFigure } from '@/lib/admin/model-comparison';
import { Panel, PanelHeader } from '../../_ui/primitives';

const LEAD_ORDER = ['h0-2', 'h2-6', 'h6-24', 'h24+'];
const LEAD_LABELS: Record<string, string> = {
  'h0-2': 'bis 2 Std. voraus',
  'h2-6': '2 bis 6 Std.',
  'h6-24': '6 bis 24 Std.',
  'h24+': 'über 24 Std.',
};

/**
 * The CatBoost hourly band's daily calibration: per forecast distance the factor the band is
 * stretched by, and how often reality stayed under it before and after.
 */
export function BandCalibrationPanel({ calibration }: { calibration: MlBandCalibration }) {
  const leads = Object.keys(calibration.pooledByLead).sort(
    (a, b) => (LEAD_ORDER.indexOf(a) + 1 || 99) - (LEAD_ORDER.indexOf(b) + 1 || 99)
  );
  const segments = Object.entries(calibration.cells);
  return (
    <Panel>
      <PanelHeader
        icon={SlidersHorizontal}
        title="Wie breit ist die CatBoost-Spanne?"
        hint={`Ziel: ${formatShare(calibration.target)} der echten Wartezeiten unter Prognose plus Spanne, gemessen über ${calibration.windowDays} Tage. Stand ${formatLastRun(calibration.computedAt)} UTC.`}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm tabular-nums">
          <thead>
            <tr className="text-muted-foreground border-border/50 border-b text-left text-[11px] font-semibold tracking-wider uppercase">
              <th className="px-4 py-2.5 font-semibold">Vorlauf</th>
              <th className="px-4 py-2.5 text-right font-semibold">Faktor</th>
              <th className="px-4 py-2.5 text-right font-semibold">Abdeckung vorher → nachher</th>
              <th className="px-4 py-2.5 text-right font-semibold">Werte</th>
              <th className="px-4 py-2.5 text-right font-semibold">ohne eigenen Faktor</th>
            </tr>
          </thead>
          <tbody className="divide-border/40 divide-y">
            {leads.map((lead) => {
              const pool = calibration.pooledByLead[lead];
              const own = segments.filter(([key]) => key.startsWith(`${lead}|`));
              const borrowed = own.filter(([, cell]) => cell.source === 'pooled').length;
              return (
                <tr key={lead}>
                  <td className="px-4 py-2.5">{LEAD_LABELS[lead] ?? lead}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">
                    {pool.k == null ? 'roh' : `× ${formatFigure(pool.k, 2)}`}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {formatCoverageChange(pool.coverageRaw, pool.coverageCalibrated)}
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5 text-right">
                    {formatFigure(pool.n, 0)}
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5 text-right">
                    {own.length > 0 ? `${borrowed} von ${own.length}` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
