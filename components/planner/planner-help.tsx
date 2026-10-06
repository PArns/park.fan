'use client';

import { useTranslations } from 'next-intl';
import { Compass, CalendarPlus, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * What the planner is, for somebody who has not used it: one component for the panel's empty state
 * and the planner page, so the three sentences cannot drift. Cards on the page, a numbered list in
 * the panel. No screenshot, which would age with the feature.
 */
const STEPS = [
  { icon: Compass, key: 'find' },
  { icon: CalendarPlus, key: 'add' },
  { icon: MousePointerClick, key: 'arrange' },
] as const;

/**
 * The planner's three steps (find a park, add rides, arrange the day), as cards on the planner page
 * or as a numbered list in the empty panel.
 */
export function PlannerHelpSteps({ layout }: { layout: 'cards' | 'list' }) {
  const t = useTranslations('planner');
  const cards = layout === 'cards';

  return (
    <ol className={cn(cards ? 'grid gap-4 sm:grid-cols-3' : 'flex flex-col gap-3')}>
      {STEPS.map(({ icon: Icon, key }, index) => (
        <li
          key={key}
          className={cn(
            cards ? 'bg-card rounded-2xl border p-4' : 'flex items-start gap-2.5 text-left'
          )}
        >
          {cards ? (
            <>
              <div className="mb-2 flex items-center gap-2">
                <StepNumber index={index} />
                <Icon className="text-primary size-4" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium">{t(`page.steps.${key}.title`)}</p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {t(`page.steps.${key}.body`)}
              </p>
            </>
          ) : (
            <>
              <StepNumber index={index} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <Icon className="text-primary size-3.5 shrink-0" aria-hidden="true" />
                  {t(`page.steps.${key}.title`)}
                </span>
                <span className="text-muted-foreground mt-0.5 block text-[11px] leading-relaxed">
                  {t(`page.steps.${key}.body`)}
                </span>
              </span>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}

function StepNumber({ index }: { index: number }) {
  return (
    <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums">
      {index + 1}
    </span>
  );
}
