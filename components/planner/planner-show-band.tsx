'use client';

import { useTranslations } from 'next-intl';
import { Theater } from 'lucide-react';
import type { PlannerShowLine } from '@/lib/planner/live';

interface PlannerShowBandProps {
  /** `null` means "not knowable for this date", which is not the same as none. */
  lines: PlannerShowLine[] | null;
}

/**
 * The shows above the grid.
 *
 * Three states, never two. Showtimes exist for TODAY and no other date — the API
 * rewrites any non-today date onto today and the source is an observation table
 * with no forward schedule — while the day picker offers sixty days. An empty
 * array would collapse "we cannot know this yet" into "this park has no shows",
 * which is the exact conflation the backend's own comment warns about.
 *
 * The band reserves its height in all three states, so the grid below it does
 * not move when the answer arrives. The geometry comes from the state, the
 * content from the data.
 */
export function PlannerShowBand({ lines }: PlannerShowBandProps) {
  const t = useTranslations('planner');

  const names = lines ? [...new Set(lines.map((l) => l.name))] : [];

  return (
    <div className="border-border/60 bg-background/95 text-muted-foreground sticky top-0 z-40 flex min-h-[22px] items-center gap-1.5 border-b px-2 text-[10px] backdrop-blur-sm">
      <Theater className="size-3 shrink-0" aria-hidden="true" />
      {lines === null ? (
        <span className="truncate">{t('shows.notKnownYet')}</span>
      ) : names.length === 0 ? (
        <span className="truncate">{t('shows.none')}</span>
      ) : (
        <span className="truncate">{names.join(' · ')}</span>
      )}
    </div>
  );
}
