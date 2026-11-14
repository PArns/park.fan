'use client';

import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { RegionSceneCut } from '@/components/layout/planner-region-art';
import type { PlannerMenuRegion } from '@/lib/navigation/planner-menu';

/**
 * A trip region in the sheet where several are listed, as the band's tiles in a phone's width: a
 * 44 px row with a cut of its scene, its name and its area, the whole row the planner's link. One
 * region stays a plain row like the links around it.
 */
export function SheetRegionLink({ region }: { region: PlannerMenuRegion }) {
  return (
    <Link
      href={region.href as '/'}
      prefetch={false}
      className="group hover:bg-muted/60 -mx-2 flex min-h-11 items-center gap-3 rounded-lg px-2 py-1 transition-colors"
    >
      <RegionSceneCut regionId={region.id} />
      <span className="min-w-0 flex-1">
        <span className="text-foreground block text-sm leading-tight font-medium text-pretty">
          {region.name}
        </span>
        <span className="text-muted-foreground block text-[11px] leading-tight">{region.area}</span>
      </span>
      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
    </Link>
  );
}
