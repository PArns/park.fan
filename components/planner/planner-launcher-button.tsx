'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarPlus } from 'lucide-react';
import { PlannerFlyout } from './planner-flyout';

/**
 * The button and the panel behind it.
 *
 * Its own file, and that is structural rather than tidiness. `planner-launcher`
 * is a lazy message boundary, and the generator counts a boundary's OWN
 * `useTranslations` calls while stopping the walk at its imports — so a boundary
 * that reads the namespace itself puts it straight back into the layout chrome
 * of every page. Everything that reads `planner` therefore sits on this side of
 * the import.
 */
export function PlannerLauncherButton({ total }: { total: number }) {
  const t = useTranslations('planner');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('open')}
        className="bg-popover/95 text-foreground ring-border/60 hover:bg-accent fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg ring-1 backdrop-blur-xl transition-colors max-sm:right-3 max-sm:bottom-3"
      >
        <CalendarPlus className="size-4" />
        <span className="text-sm font-medium">{t('title')}</span>
        <span className="bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-mono text-xs tabular-nums">
          {total}
        </span>
      </button>

      <PlannerFlyout open={open} onOpenChange={setOpen} />
    </>
  );
}
